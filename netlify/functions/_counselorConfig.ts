import type { LeadCategory } from "../../src/types/form";

type WindowRange = {
  startHour: number;
  endHour: number;
};

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CounselorKey = "bch" | "lum" | "lum_l2";

export interface CounselorPolicy {
  key: CounselorKey;
  name: string;
  timezone: string;
  calendarId: string;
  slotDurationMinutes: number;
  sameDayBufferMinutes: number;
  windowDays: number;
  blockedHours: number[];
  windowsByWeekday: Partial<Record<WeekdayIndex, WindowRange[]>>;
}

const requireEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optionalEnv = (key: string, fallback: string): string => {
  return process.env[key]?.trim() || fallback;
};

export const counselorPolicies: Record<CounselorKey, CounselorPolicy> = {
  bch: {
    key: "bch",
    name: "Viswanathan Ramakrishnan",
    timezone: "Asia/Kolkata",
    calendarId: requireEnv("GCAL_ID_BCH"),
    slotDurationMinutes: 60,
    sameDayBufferMinutes: 60,
    windowDays: 7,
    blockedHours: [14],
    windowsByWeekday: {
      0: [{ startHour: 11, endHour: 15 }],
      1: [],
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
    calendarId: requireEnv("GCAL_ID_LUM_L1"),
    slotDurationMinutes: 60,
    sameDayBufferMinutes: 60,
    windowDays: 7,
    blockedHours: [14],
    windowsByWeekday: {
      0: [],
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
  lum_l2: {
    // lum-l2 may be handled by either counselor depending on business needs.
    // Set GCAL_ID_LUM_L2 to the appropriate counselor's calendar ID.
    // Defaults to LUM (Karthik) if not set.
    key: "lum_l2",
    name: "Karthik Lakshman",
    timezone: "Asia/Kolkata",
    calendarId: optionalEnv("GCAL_ID_LUM_L2", requireEnv("GCAL_ID_LUM_L1")),
    slotDurationMinutes: 60,
    sameDayBufferMinutes: 60,
    windowDays: 7,
    blockedHours: [14],
    windowsByWeekday: {
      0: [],
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
): CounselorKey => {
  if (leadCategory === "bch") {
    return "bch";
  }
  if (leadCategory === "lum-l2") {
    return "lum_l2";
  }
  return "lum"; // lum-l1 and any other qualified lead
};

export const getCounselorPolicyForLeadCategory = (
  leadCategory: LeadCategory | string
): CounselorPolicy => {
  const key = resolveCounselorKeyFromLeadCategory(leadCategory);
  return counselorPolicies[key];
};
