# Tracking And Attribution

Source of truth: `@repo/src/lib/metaPixelEvents.ts`, `@repo/src/lib/metaCAPI.ts`, `@repo/src/lib/ga4Events.ts`, `@repo/src/lib/cookiePolling.ts`, `@repo/src/lib/clientInfo.ts`, `@repo/netlify/functions/meta-capi.ts`, and `@repo/index.html`.

## Current Architecture

- Meta Pixel fires browser-side custom events.
- Meta CAPI sends the same event names server-side through Netlify function `/.netlify/functions/meta-capi`.
- GA4 mirrors the Meta event names through `gtag('event', ...)`.
- Google Ads base tag is configured in `@repo/index.html`.
- Google Ads conversions are intended to be imported from GA4 key events. No Google Ads conversion snippet or `send_to` conversion event is wired in code.

## Environment Naming

Meta and GA4 event names are suffixed:

- Production: `_prod`
- Staging or any non-`prod` environment: `_stg`

The suffix comes from `VITE_ENVIRONMENT`.

## Event Set

Classification:

- `apply_prnt_event`
- `apply_spam_prnt`
- `apply_nonspam_prnt`
- `apply_tam_prnt`
- `apply_tam_prnt_level2`
- `apply_qualfd_prnt`
- `apply_disqualfd_prnt`
- `apply_stdnt`
- `apply_spam_stdnt`
- `apply_qualfd_stdnt`
- `apply_disqualfd_stdnt`

Funnel:

- `apply_page_1_continue`
- `apply_page_2_view`
- `apply_page_2_submit`
- `apply_form_complete`

CTA:

- `apply_cta_hero`
- `apply_cta_header`

Category-specific:

- `apply_bch_page_1_continue`
- `apply_bch_page_2_view`
- `apply_bch_page_2_submit`
- `apply_bch_form_complete`
- `apply_lum_l1_page_1_continue`
- `apply_lum_l1_page_2_view`
- `apply_lum_l1_page_2_submit`
- `apply_lum_l1_form_complete`
- `apply_lum_l2_page_1_continue`
- `apply_lum_l2_page_2_view`
- `apply_lum_l2_page_2_submit`
- `apply_lum_l2_form_complete`

Qualified-lead specific:

- `apply_qualfd_prnt_page_1_continue`
- `apply_qualfd_prnt_page_2_view`
- `apply_qualfd_prnt_page_2_submit`
- `apply_qualfd_prnt_form_complete`
- `apply_qualfd_stdnt_page_1_continue`
- `apply_qualfd_stdnt_page_2_view`
- `apply_qualfd_stdnt_page_2_submit`
- `apply_qualfd_stdnt_form_complete`

Enrichment:

- `apply_phone_captured`
- `apply_email_captured`

`apply_page_view` helper exists for Meta/GA4 parity, but it is not currently called from a component. Meta standard `PageView` fires during pixel initialization, and GA4 standard pageview comes from `gtag('config', ...)` in `@repo/index.html`.

## TAM Parent Events

`apply_tam_prnt` fires for:

- parent form
- not spam
- grade in `7_below`, `8`, `9`, `10`, `11`, `12`
- curriculum is not `State_Boards`

`apply_tam_prnt_level2` fires on Page 2A email blur for a non-spam TAM parent with email. It is a deeper-funnel signal. It is not a final-submit event.

Structural implication: because Page 2A is qualified-only, `apply_tam_prnt_level2` is narrower than `apply_tam_prnt`.

## Meta CAPI

Client posts to:

`/.netlify/functions/meta-capi`

Netlify function posts to:

`https://graph.facebook.com/v21.0/{META_PIXEL_ID}/events`

Netlify env vars:

- `META_CAPI_ACCESS_TOKEN`
- `META_PIXEL_ID`

PII fields `em`, `ph`, `fn`, `ln`, `ct` are SHA-256 hashed inside the Netlify function before sending to Meta. `_fbp`, `_fbc`, `external_id`, `client_ip_address`, and `client_user_agent` pass through unhashed.

Event IDs are generated as:

`{sessionId}_{eventName}_{timestamp}_{counter}`

The same event ID is sent to Pixel and CAPI for deduplication.

## Cookie Polling

Events queue until Meta cookies are available. If cookies do not appear before polling maxes out, queued events are processed anyway with whatever user data is available.

## Client IP Caveat

`clientInfo.ts` still uses Supabase Edge Function `get-client-ip` for optional IP enrichment. If that fails, CAPI still sends without client IP. The active CAPI transport itself is Netlify.

## GA4 Mirror

`@repo/src/lib/ga4Events.ts` mirrors Meta event names into GA4 with:

- same `_prod` / `_stg` suffix
- `source: apply_lp`
- lightweight params like `lead_category` and `form_filler_type`
- no PII
- staging-only console logs showing event name, params, timestamp, and whether `window.gtag` was available

This GA4 mirror is separate from the older `analytics.ts` helper, which only tracks legacy events on the production domain.

## Google Tags

`@repo/index.html` loads one Google tag script for `G-1PMRW2MXT4`, then configures:

- GA4: `G-1PMRW2MXT4`
- Google Ads base tag: `AW-17192426075`

No Google Ads conversion action snippet is currently required in code based on the current architecture. The conversion path is GA4 key events imported into Google Ads.

## Not Verified In This Pass

- Production Tag Assistant firing.
- GA4 Realtime or DebugView receipt.
- Meta Events Manager delivery/deduplication.
- GA4 key-event and Google Ads import setup.
