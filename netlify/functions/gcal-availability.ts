import type { Handler } from "@netlify/functions";
import { getCounselorPolicyForLeadCategory } from "./_counselorConfig";
import { getAvailableSlotsForDate } from "./_slotEngine";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
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
    const { leadCategory, date } = JSON.parse(event.body || "{}");

    if (!leadCategory || !date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: leadCategory, date" }),
      };
    }

    const policy = getCounselorPolicyForLeadCategory(leadCategory);
    const slots = await getAvailableSlotsForDate(date, policy);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        counselorKey: policy.key,
        timezone: policy.timezone,
        slots,
      }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("gcal-availability error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch availability",
        message,
      }),
    };
  }
};
