# Current State

Last verified from local code and git push on 2026-06-02. Live Netlify deploy completion, GA4, Meta Events Manager, Make.com, and Supabase dashboard state were not verified in this pass.

## Product

Apply LP is the primary Beacon House lead-generation page for `apply.beaconhouse.in`. The app is React 18 + TypeScript + Vite, hosted on Netlify, with Supabase, Make.com, Meta Pixel/CAPI, GA4, and Google Calendar availability.

## Source Files

| Area | Code |
|------|------|
| Form orchestration | `@repo/src/components/forms/FormContainer.tsx` |
| Page 1 form | `@repo/src/components/forms/InitialLeadCaptureForm.tsx` |
| Qualified Page 2A | `@repo/src/components/forms/QualifiedLeadForm.tsx` |
| Disqualified Page 2B | `@repo/src/components/forms/DisqualifiedLeadForm.tsx` |
| Lead rules | `@repo/src/lib/leadCategorization.ts` |
| Webhook submit | `@repo/src/lib/form.ts` |
| Supabase incremental saves | `@repo/src/lib/formTracking.ts` |
| Meta events | `@repo/src/lib/metaPixelEvents.ts` |
| GA4 mirror | `@repo/src/lib/ga4Events.ts` |
| CAPI client | `@repo/src/lib/metaCAPI.ts` |
| CAPI Netlify function | `@repo/netlify/functions/meta-capi.ts` |
| Calendar availability | `@repo/netlify/functions/gcal-availability.ts` |
| Counselor routing | `@repo/netlify/functions/_counselorConfig.ts` |

## Flow

1. User opens the landing page and starts Page 1.
2. Page 1 captures form filler type, student name, grade, location, phone, curriculum, school, score, scholarship, and target geographies.
3. `determineLeadCategory()` assigns one of five categories: `bch`, `lum-l1`, `lum-l2`, `nurture`, `drop`.
   - Seasonal caveat: from January through June in `Asia/Kolkata`, Grade 8 parent leads that pass the global overrides are routed to `nurture`; from July through December, Grade 8 follows the standard qualification rules.
4. `drop` submits immediately after Page 1. No Page 2 and no email capture.
5. Student-filled forms are categorized as `nurture` and submit immediately after Page 1.
6. Qualified leads (`bch`, `lum-l1`, `lum-l2`) see a 10-second evaluation animation, then Page 2A with Viswanathan's calendar.
7. `nurture` parent leads go to Page 2B for parent name and email.
8. Final submit sends the webhook to Make.com and records Supabase tracking where available.

## Counselor Routing

All qualified leads route to Viswanathan. `resolveCounselorKeyFromLeadCategory()` returns `bch` for `bch`, `lum-l1`, and `lum-l2`. Karthik config remains in code but is not surfaced in the current UX.

## Calendar Behavior

- Page 2A fetches availability from `/.netlify/functions/gcal-availability`.
- Function accepts `POST` and `OPTIONS`.
- 7-day lookahead.
- Viswanathan: Monday off, Sunday 11 AM to 3 PM, Tuesday to Saturday 11 AM to 7 PM, 2 PM blocked.
- Booked slots are disabled.
- Static fallback slots appear only if availability fetch fails or returns no slots.
- If all returned candidate slots are booked, the user must choose another date. There is no "none of these times work" escape hatch yet.

## Shipped Locally

- `main`, `origin/main`, and `origin/staging` are at `ebcc3b2 feat: add grade 8 rule and GA4 staging logs`.
- The same commit was pushed to remote `main` and `staging` on 2026-06-02.
- GA4 base tag `G-1PMRW2MXT4` and Google Ads base tag `AW-17192426075` are in `@repo/index.html`.
- GA4 mirror events are in code and wired alongside Meta event triggers.
- GA4 staging console logs show event name, params, timestamp, and whether `window.gtag` was available.
- Grade 8 parent leads that pass global overrides are routed to `nurture` from January through June in `Asia/Kolkata`; July through December follows the standard rules.
- CAPI uses Netlify function `/.netlify/functions/meta-capi`, not Supabase Edge Functions.
- Extra ad params are sent to Make.com webhook: `campaign_id`, `utm_adset`, `adset_id`, `ad_id`, `utm_placement`.
- GA4 Measurement ID remains `G-1PMRW2MXT4`. A possible switch to `G-ZRF7H5ZFXK` is paused until the founder/team confirms the correct GA4 property.

## Not Verified In This Pass

- Netlify production deployment for latest `main`.
- Netlify staging deployment for latest `staging`.
- GA4 Realtime or DebugView receipt.
- Google Tag Assistant live tag firing.
- Meta Events Manager event approval/delivery.
- Live Make.com scenario mapping.
- Live Supabase RPC definition in dashboard.

## Known Code Gaps

- Supabase RPC migration still omits booking status columns, so normal RPC saves drop those fields.
- Supabase incremental saves store standard UTM fields only through `utm_id`; final webhook sends the newer ad params too.
- `phone_number` is raw `phoneNumber`, not `countryCode + phoneNumber`.
- `src/lib/metaCAPI.ts` comments still mention Supabase Edge Function even though implementation uses Netlify.
- Old Supabase CAPI function files still exist under `@repo/supabase/functions/`; they are not the active route.
