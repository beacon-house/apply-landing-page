import type { CounselorPolicy } from "./_counselorConfig";
import {
  formatHourLabel,
  getCalendarClient,
  getWeekdayIndexInTimeZone,
  parseBusyRanges,
  rangesOverlap,
  zonedDateToUtc,
} from "./_gcal";

export interface SlotInterval {
  startIso: string;
  endIso: string;
  label: string;
}

const validateDateKey = (dateKey: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
};

const getDateDiffFromNowInTimezoneDays = (dateKey: string, timezone: string): number => {
  const now = new Date();
  const nowDateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const targetUtc = zonedDateToUtc(dateKey, 0, 0, timezone);
  const nowUtc = zonedDateToUtc(nowDateKey, 0, 0, timezone);
  return Math.round((targetUtc.getTime() - nowUtc.getTime()) / 86_400_000);
};

const DEFAULT_WEEKDAY_WINDOWS: { startHour: number; endHour: number }[] = [
  { startHour: 11, endHour: 19 },
];

const buildCandidateSlots = (
  dateKey: string,
  policy: CounselorPolicy
): Array<{ start: Date; end: Date; label: string; isOffDay: boolean }> => {
  const weekdayIndex = getWeekdayIndexInTimeZone(dateKey, policy.timezone) as
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6;
  let dayWindows = policy.windowsByWeekday[weekdayIndex] ?? [];
  const isOffDay = dayWindows.length === 0;

  // On off-days (e.g., Monday for BCH), generate default weekday slots
  // so we can show them all as "booked" in the UI
  if (isOffDay) {
    dayWindows = DEFAULT_WEEKDAY_WINDOWS;
  }

  const nowWithBuffer = new Date(Date.now() + policy.sameDayBufferMinutes * 60 * 1000);
  const todayInTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: policy.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const isTodayInCounselorTz = todayInTz === dateKey;

  const candidates: Array<{ start: Date; end: Date; label: string; isOffDay: boolean }> = [];

  for (const window of dayWindows) {
    for (let hour = window.startHour; hour <= window.endHour; hour += 1) {
      if (policy.blockedHours.includes(hour)) {
        continue;
      }

      const slotStart = zonedDateToUtc(dateKey, hour, 0, policy.timezone);
      const slotEnd = new Date(slotStart.getTime() + policy.slotDurationMinutes * 60 * 1000);

      if (isTodayInCounselorTz && slotStart < nowWithBuffer) {
        continue;
      }

      candidates.push({
        start: slotStart,
        end: slotEnd,
        label: formatHourLabel(slotStart, policy.timezone),
        isOffDay,
      });
    }
  }

  return candidates;
};

export const getCandidateSlotsForDate = async (
  dateKey: string,
  policy: CounselorPolicy
): Promise<SlotInterval[]> => {
  if (!validateDateKey(dateKey)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  const dayDiff = getDateDiffFromNowInTimezoneDays(dateKey, policy.timezone);
  if (dayDiff < 0 || dayDiff >= policy.windowDays) {
    return [];
  }

  const candidateSlots = buildCandidateSlots(dateKey, policy);
  if (candidateSlots.length === 0) {
    return [];
  }

  // Off-day slots (e.g., Monday for BCH) are all shown as booked
  const isOffDay = candidateSlots[0]?.isOffDay;
  if (isOffDay) {
    return candidateSlots.map((slot) => ({
      startIso: slot.start.toISOString(),
      endIso: slot.end.toISOString(),
      label: slot.label,
      status: "booked" as const,
    }));
  }

  const calendar = getCalendarClient();
  const dayStart = zonedDateToUtc(dateKey, 0, 0, policy.timezone);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const freeBusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      timeZone: policy.timezone,
      items: [{ id: policy.calendarId }],
    },
  });

  const busyRanges = parseBusyRanges(
    freeBusyResponse.data.calendars?.[policy.calendarId]?.busy ?? []
  );

  return candidateSlots.map((slot) => {
    const isBooked = busyRanges.some((busy) =>
      rangesOverlap(slot.start, slot.end, busy.start, busy.end)
    );
    return {
      startIso: slot.start.toISOString(),
      endIso: slot.end.toISOString(),
      label: slot.label,
      status: isBooked ? ("booked" as const) : ("available" as const),
    };
  });
};

