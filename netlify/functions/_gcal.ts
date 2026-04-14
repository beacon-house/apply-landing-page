import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";

export interface SlotInterval {
  startIso: string;
  endIso: string;
  label: string;
}

const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

export const getCalendarClient = (): calendar_v3.Calendar => {
  if (!PRIVATE_KEY || !CLIENT_EMAIL) {
    throw new Error(
      "Missing Google credentials: GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
    );
  }

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
};

export const formatHourLabel = (date: Date, timezone: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: true,
  }).format(date);
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string): number => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") {
      acc[p.type] = p.value;
    }
    return acc;
  }, {});

  const zonedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return zonedAsUtc - date.getTime();
};

export const zonedDateToUtc = (
  dateKey: string,
  hour: number,
  minute: number,
  timeZone: string
): Date => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMs = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMs);
};

export const getWeekdayIndexInTimeZone = (dateKey: string, timeZone: string): number => {
  const startOfDayUtc = zonedDateToUtc(dateKey, 0, 0, timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  })
    .formatToParts(startOfDayUtc)
    .find((p) => p.type === "weekday")?.value;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  if (!weekday || weekdayMap[weekday] === undefined) {
    throw new Error(`Failed to resolve weekday for ${dateKey} in timezone ${timeZone}`);
  }

  return weekdayMap[weekday];
};

export const rangesOverlap = (
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean => {
  return aStart < bEnd && bStart < aEnd;
};

export const parseBusyRanges = (
  busyRanges: Array<{ start?: string; end?: string }>
): Array<{ start: Date; end: Date }> => {
  return busyRanges
    .filter((busy) => busy.start && busy.end)
    .map((busy) => ({
      start: new Date(busy.start as string),
      end: new Date(busy.end as string),
    }));
};
