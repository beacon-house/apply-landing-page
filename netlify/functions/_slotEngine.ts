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

const buildCandidateSlots = (
  dateKey: string,
  policy: CounselorPolicy
): Array<{ start: Date; end: Date; label: string }> => {
  const weekdayIndex = getWeekdayIndexInTimeZone(dateKey, policy.timezone) as
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6;
  const dayWindows = policy.windowsByWeekday[weekdayIndex] ?? [];
  const nowWithBuffer = new Date(Date.now() + policy.sameDayBufferMinutes * 60 * 1000);
  const todayInTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: policy.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const isTodayInCounselorTz = todayInTz === dateKey;

  const candidates: Array<{ start: Date; end: Date; label: string }> = [];

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
      });
    }
  }

  return candidates;
};

export const getAvailableSlotsForDate = async (
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

  return candidateSlots
    .filter((slot) => !busyRanges.some((busy) => rangesOverlap(slot.start, slot.end, busy.start, busy.end)))
    .map((slot) => ({
      startIso: slot.start.toISOString(),
      endIso: slot.end.toISOString(),
      label: slot.label,
    }));
};

