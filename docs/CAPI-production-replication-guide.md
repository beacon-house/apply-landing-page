# Meta CAPI Production Replication Guide

This guide outlines the exact steps to replicate the CAPI implementation from staging to production.

## Overview

**No database schema changes were made** - all changes are in:
1. Supabase Edge Functions (2 new functions)
2. Frontend code (new files and modifications)
3. Environment variables/secrets

---

## Step 1: Deploy Edge Functions to Production Supabase

You need to create **2 Edge Functions** in your production Supabase project:

### Edge Function 1: `get-client-ip`

**Location**: `supabase/functions/get-client-ip/index.ts`

**Purpose**: Extracts client IP address from request headers

**Code**:
```typescript
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
```

**Deployment Steps**:
1. Go to Supabase Dashboard → Production Project → Edge Functions
2. Click "Create a new function"
3. Name: `get-client-ip`
4. Copy the code above into the editor
5. Click "Deploy"

---

### Edge Function 2: `meta-capi`

**Location**: `supabase/functions/meta-capi/index.ts`

**Purpose**: Receives events from frontend, hashes PII, and forwards to Meta CAPI

**Code**:
```typescript
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
```

**Deployment Steps**:
1. Go to Supabase Dashboard → Production Project → Edge Functions
2. Click "Create a new function"
3. Name: `meta-capi`
4. Copy the code above into the editor
5. Click "Deploy"

---

## Step 2: Set Edge Function Secrets in Production

After deploying the Edge Functions, set these secrets in your production Supabase project:

### Secret 1: `META_CAPI_ACCESS_TOKEN`
1. Go to Supabase Dashboard → Production Project → Edge Functions → `meta-capi`
2. Click on "Settings" or "Secrets"
3. Add secret:
   - **Name**: `META_CAPI_ACCESS_TOKEN`
   - **Value**: Your Meta CAPI Access Token (same as staging - it's for the same client/pixel)

### Secret 2: `META_PIXEL_ID`
1. In the same Edge Function settings
2. Add secret:
   - **Name**: `META_PIXEL_ID`
   - **Value**: `549164201502176` (same pixel ID used in staging)

**Note**: These are the same values as staging since it's the same client and pixel.

---

## Step 3: Frontend Code Changes

The frontend code changes are already in your repository and will be deployed automatically when you merge from staging to main. These include:

### New Files Created:
1. `src/lib/clientInfo.ts` - IP address fetching and caching
2. `src/lib/cookiePolling.ts` - Meta cookie detection and event queueing
3. `src/lib/metaCAPI.ts` - CAPI event sending logic

### Modified Files:
1. `src/lib/metaPixelEvents.ts` - Integrated CAPI with Pixel events
2. `src/store/formStore.ts` - Added event counter for unique event IDs
3. `src/App.tsx` - Added client IP fetching on initialization

**Action Required**: None - these will be deployed automatically via GitHub merge.

---

## Step 4: Environment Variables

### Frontend Environment Variables (Netlify)

No new frontend environment variables are needed. The existing ones are sufficient:
- `VITE_SUPABASE_URL` - Already set (production URL)
- `VITE_SUPABASE_ANON_KEY` - Already set (production anon key)
- `VITE_META_PIXEL_ID` - Already set (same pixel ID)

**Action Required**: Verify these are set correctly in Netlify production environment.

---

## Step 5: Database Changes

**No database schema changes were made.**

The CAPI implementation does not require any:
- New tables
- New columns
- New RPC functions
- New migrations

All data is sent directly to Meta CAPI via the Edge Function.

---

## Summary Checklist

### ✅ Supabase Edge Functions (Production)
- [ ] Deploy `get-client-ip` Edge Function
- [ ] Deploy `meta-capi` Edge Function
- [ ] Set `META_CAPI_ACCESS_TOKEN` secret in `meta-capi` function
- [ ] Set `META_PIXEL_ID` secret in `meta-capi` function

### ✅ Frontend Code
- [ ] Merge staging branch to main (includes all CAPI code)
- [ ] Verify Netlify production deployment completes successfully

### ✅ Environment Variables
- [ ] Verify `VITE_SUPABASE_URL` is set to production URL in Netlify
- [ ] Verify `VITE_SUPABASE_ANON_KEY` is set to production anon key in Netlify
- [ ] Verify `VITE_META_PIXEL_ID` is set to `549164201502176` in Netlify

### ✅ Database
- [ ] No action required - no database changes needed

---

## Testing After Deployment

1. **Test Edge Functions**:
   - Visit: `https://[your-prod-project].supabase.co/functions/v1/get-client-ip`
   - Should return: `{"ip":"[your-ip]"}`

2. **Test CAPI Events**:
   - Fill out the form on production
   - Check browser console for: `✅ CAPI event sent: [event-name] ([event-id])`
   - Check Supabase Edge Function logs for `meta-capi` function
   - Verify events appear in Meta Events Manager

3. **Verify Event Deduplication**:
   - Check Meta Events Manager
   - Same event should appear from both Pixel (browser) and CAPI (server)
   - Event IDs should match between Pixel and CAPI

---

## Important Notes

1. **Same Meta Access Token**: Use the same `META_CAPI_ACCESS_TOKEN` as staging since it's for the same client and pixel.

2. **No Database Migration**: No database changes are needed - CAPI sends data directly to Meta.

3. **Frontend Auto-Deploy**: Frontend code will deploy automatically when you merge staging → main.

4. **Edge Functions Manual**: Edge Functions must be manually deployed in production Supabase Dashboard (you can't use CLI).

---

## Support

If you encounter issues:
1. Check Supabase Edge Function logs for errors
2. Check browser console for CAPI event logs
3. Verify secrets are set correctly in Supabase Dashboard
4. Verify environment variables in Netlify
