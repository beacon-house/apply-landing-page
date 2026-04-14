import type { LeadCategory } from "../../src/types/form";

type WindowRange = {
  startHour: number;
  endHour: number;
};

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CounselorPolicy {
  key: "bch" | "lum";
  name: string;
  timezone: string;
  calendarId: string;
  slotDurationMinutes: number;
  sameDayBufferMinutes: number;
  windowDays: number;
  blockedHours: number[];
  windowsByWeekday: Partial<Record<WeekdayIndex, WindowRange[]>>;
  titleTemplate: string;
}

const requireEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const counselorPolicies: Record<"bch" | "lum", CounselorPolicy> = {
  bch: {
    key: "bch",
    name: "Viswanathan Ramakrishnan",
    timezone: "Asia/Kolkata",
    calendarId: requireEnv("GCAL_ID_BCH"),
    slotDurationMinutes: 60,
    sameDayBufferMinutes: 60,
    windowDays: 7,
    blockedHours: [14],
    titleTemplate: "Beacon House Consultation - {StudentName}",
    windowsByWeekday: {
      0: [{ startHour: 11, endHour: 15 }], // Sunday
      1: [], // Monday unavailable
      2: [{ startHour: 11, endHour: 19 }],
      3: [{ startHour: 11, endHour: 19 }],
      4: [{ startHour: 11, endHour: 19 }],
      5: [{ startHour: 11, endHour: 19 }],
      6: [{ startHour: 11, endHour: 19 }],
    },
  },
  lum: {
    key: "lum",
    name: "Karthik Lakshman",
    timezone: "Asia/Kolkata",
    calendarId: requireEnv("GCAL_ID_LUM"),
    slotDurationMinutes: 60,
    sameDayBufferMinutes: 60,
    windowDays: 7,
    blockedHours: [14],
    titleTemplate: "Beacon House Consultation - {StudentName}",
    windowsByWeekday: {
      0: [], // Sunday unavailable
      1: [
        { startHour: 11, endHour: 13 },
        { startHour: 16, endHour: 19 },
      ],
      2: [
        { startHour: 11, endHour: 13 },
        { startHour: 16, endHour: 19 },
      ],
      3: [
        { startHour: 11, endHour: 13 },
        { startHour: 16, endHour: 19 },
      ],
      4: [
        { startHour: 11, endHour: 13 },
        { startHour: 16, endHour: 19 },
      ],
      5: [
        { startHour: 11, endHour: 13 },
        { startHour: 16, endHour: 19 },
      ],
      6: [
        { startHour: 11, endHour: 13 },
        { startHour: 16, endHour: 19 },
      ],
    },
  },
};

export const resolveCounselorKeyFromLeadCategory = (
  leadCategory: LeadCategory | string
): CounselorPolicy["key"] => {
  if (leadCategory === "bch") {
    return "bch";
  }
  return "lum";
};

export const getCounselorPolicyForLeadCategory = (
  leadCategory: LeadCategory | string
): CounselorPolicy => {
  const key = resolveCounselorKeyFromLeadCategory(leadCategory);
  return counselorPolicies[key];
};
