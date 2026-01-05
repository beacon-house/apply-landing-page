import "jsr:@supabase/functions-js/edge-runtime.d.ts";

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "authorization, content-type");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  }

  try {
    const { event_name, user_data, event_id, event_time, event_source_url } = await req.json();

    if (!event_name || !event_id || !event_time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event_name, event_id, event_time" }),
        { status: 400, headers }
      );
    }

    const clientIpAddress = user_data?.client_ip_address;
    const clientUserAgent = user_data?.client_user_agent;

    const hashedUserData: Record<string, string> = {};

    if (user_data?.em) {
      hashedUserData.em = await hashSHA256(user_data.em);
    }

    if (user_data?.ph) {
      hashedUserData.ph = await hashSHA256(user_data.ph);
    }

    if (user_data?.fn) {
      hashedUserData.fn = await hashSHA256(user_data.fn);
    }

    if (user_data?.ln) {
      hashedUserData.ln = await hashSHA256(user_data.ln);
    }

    if (user_data?.ct) {
      hashedUserData.ct = await hashSHA256(user_data.ct);
    }

    if (clientIpAddress) {
      hashedUserData.client_ip_address = clientIpAddress;
    }

    if (clientUserAgent) {
      hashedUserData.client_user_agent = clientUserAgent;
    }

    if (user_data?.fbp) {
      hashedUserData.fbp = user_data.fbp;
    }

    if (user_data?.fbc) {
      hashedUserData.fbc = user_data.fbc;
    }

    if (user_data?.external_id) {
      hashedUserData.external_id = user_data.external_id;
    }

    const metaAccessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
    const metaPixelId = Deno.env.get("META_PIXEL_ID");

    if (!metaAccessToken || !metaPixelId) {
      console.error("Missing Meta credentials: META_CAPI_ACCESS_TOKEN or META_PIXEL_ID");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers }
      );
    }

    const metaPayload = {
      data: [
        {
          event_name: event_name,
          event_time: event_time,
          event_id: event_id,
          event_source_url: event_source_url || undefined,
          action_source: "website",
          user_data: hashedUserData,
        },
      ],
      access_token: metaAccessToken,
    };

    const metaApiUrl = `https://graph.facebook.com/v21.0/${metaPixelId}/events`;
    const metaResponse = await fetch(metaApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaPayload),
    });

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("Meta CAPI error:", metaResult);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send event to Meta", 
          details: metaResult 
        }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: event_id,
        meta_response: metaResult 
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message 
      }),
      { status: 500, headers }
    );
  }
});
