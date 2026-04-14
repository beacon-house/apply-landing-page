import type { Handler } from "@netlify/functions";
import { getCounselorPolicyForLeadCategory } from "./_counselorConfig";
import { getCalendarClient } from "./_gcal";
import { getAvailableSlotsForDate } from "./_slotEngine";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

const isValidEmail = (email?: string): boolean => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      leadCategory,
      date,
      startIso,
      endIso,
      selectedSlotLabel,
      studentName,
      parentName,
      parentEmail,
      phoneNumber,
    } = JSON.parse(event.body || "{}");

    if (!leadCategory || !date || !startIso || !endIso || !selectedSlotLabel) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields: leadCategory, date, startIso, endIso, selectedSlotLabel",
        }),
      };
    }

    const policy = getCounselorPolicyForLeadCategory(leadCategory);
    const availableSlots = await getAvailableSlotsForDate(date, policy);
    const selectedSlot = availableSlots.find(
      (slot) =>
        slot.startIso === startIso &&
        slot.endIso === endIso &&
        slot.label === selectedSlotLabel
    );

    if (!selectedSlot) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: "SLOT_TAKEN",
          message: "Slot just got booked. Please choose another slot.",
        }),
      };
    }

    const calendar = getCalendarClient();
    const attendeeEnabled = process.env.GCAL_ADD_PARENT_AS_ATTENDEE !== "false";
    const canAddAttendee = attendeeEnabled && isValidEmail(parentEmail);

    const studentDisplayName = studentName?.trim() || "Student";
    const eventTitle = policy.titleTemplate.replace("{StudentName}", studentDisplayName);
    const descriptionLines = [
      "Booked from Beacon House admissions form.",
      `Counselor: ${policy.name}`,
      `Parent Name: ${parentName || "Not provided"}`,
      `Parent Email: ${parentEmail || "Not provided"}`,
      `Phone: ${phoneNumber || "Not provided"}`,
      `Lead Category: ${leadCategory}`,
    ];

    const eventResponse = await calendar.events.insert({
      calendarId: policy.calendarId,
      sendUpdates: canAddAttendee ? "all" : "none",
      requestBody: {
        summary: eventTitle,
        description: descriptionLines.join("\n"),
        start: {
          dateTime: selectedSlot.startIso,
          timeZone: policy.timezone,
        },
        end: {
          dateTime: selectedSlot.endIso,
          timeZone: policy.timezone,
        },
        attendees: canAddAttendee && parentEmail ? [{ email: parentEmail }] : [],
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        eventId: eventResponse.data.id,
        htmlLink: eventResponse.data.htmlLink,
        attendeeAdded: canAddAttendee,
      }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("gcal-booking error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to create booking",
        message,
      }),
    };
  }
};
