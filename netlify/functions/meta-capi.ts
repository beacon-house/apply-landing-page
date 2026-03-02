import type { Handler } from "@netlify/functions";
import { createHash } from "crypto";

function hashSHA256(value: string): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export const handler: Handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };

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
    const { event_name, user_data, event_id, event_time, event_source_url } =
      JSON.parse(event.body || "{}");

    if (!event_name || !event_id || !event_time) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields: event_name, event_id, event_time",
        }),
      };
    }

    const hashedUserData: Record<string, string> = {};

    if (user_data?.em) hashedUserData.em = hashSHA256(user_data.em);
    if (user_data?.ph) hashedUserData.ph = hashSHA256(user_data.ph);
    if (user_data?.fn) hashedUserData.fn = hashSHA256(user_data.fn);
    if (user_data?.ln) hashedUserData.ln = hashSHA256(user_data.ln);
    if (user_data?.ct) hashedUserData.ct = hashSHA256(user_data.ct);

    if (user_data?.fbp) hashedUserData.fbp = user_data.fbp;
    if (user_data?.fbc) hashedUserData.fbc = user_data.fbc;
    if (user_data?.external_id) hashedUserData.external_id = user_data.external_id;
    if (user_data?.client_ip_address) hashedUserData.client_ip_address = user_data.client_ip_address;
    if (user_data?.client_user_agent) hashedUserData.client_user_agent = user_data.client_user_agent;

    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
    const metaPixelId = process.env.META_PIXEL_ID;

    if (!metaAccessToken || !metaPixelId) {
      console.error("Missing Meta credentials: META_CAPI_ACCESS_TOKEN or META_PIXEL_ID");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error" }),
      };
    }

    const metaPayload = {
      data: [
        {
          event_name,
          event_time,
          event_id,
          event_source_url: event_source_url || undefined,
          action_source: "website",
          user_data: hashedUserData,
        },
      ],
      access_token: metaAccessToken,
    };

    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${metaPixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("Meta CAPI error:", metaResult);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to send event to Meta", details: metaResult }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, event_id, meta_response: metaResult }),
    };
  } catch (error: any) {
    console.error("Netlify Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error", message: error.message }),
    };
  }
};
