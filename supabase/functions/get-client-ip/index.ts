import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "authorization, content-type");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const xForwardedFor = req.headers.get("x-forwarded-for");
    let clientIp: string | undefined = undefined;

    if (xForwardedFor) {
      const ipList = xForwardedFor.split(",").map(ip => ip.trim());
      clientIp = ipList[0] || undefined;
    }

    if (!clientIp) {
      clientIp = req.headers.get("x-real-ip") || undefined;
    }

    if (!clientIp) {
      clientIp = req.headers.get("cf-connecting-ip") || undefined;
    }

    if (clientIp) {
      return new Response(
        JSON.stringify({ ip: clientIp }),
        { status: 200, headers }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Unable to determine client IP address" }),
        { status: 400, headers }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers }
    );
  }
});
