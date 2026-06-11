# Todo

Last updated after `ebcc3b2` push to `origin/main` and `origin/staging`: 2026-06-02.

## Active Verification

- [ ] Confirm `ebcc3b2` deploy is live on Netlify production.
- [ ] Confirm `ebcc3b2` deploy is live on Netlify staging.
- [ ] Verify `G-1PMRW2MXT4` fires on `apply.beaconhouse.in`.
- [ ] Verify Google Ads base tag `AW-17192426075` fires via Tag Assistant.
- [ ] Verify `apply_*_prod` events appear in GA4 Realtime or DebugView.
- [ ] Mark relevant `_prod` GA4 events as key events and import into Google Ads.
- [ ] Meta Events Manager: approve/use `apply_tam_prnt_level2` if it becomes the optimization signal.

## Paused Decisions

- [ ] Confirm whether GA4 should remain `G-1PMRW2MXT4` or switch to `G-ZRF7H5ZFXK`.

## Make.com

- [ ] Verify live Make.com scenario against current webhook payload.
- [ ] Redetermine webhook data structure.
- [ ] Add/map newer ad params if missing: `campaign_id`, `utm_adset`, `adset_id`, `ad_id`, `utm_placement`.
- [ ] Wire or verify `needs_manual_followup` router and failure email.
- [ ] Use column headers as IDs before updating Google Sheets mapping.

## Supabase / Data

- [ ] Update `upsert_form_session()` RPC to save booking status fields.
- [ ] Change RPC fallback `funnel_stage` default from `initial_capture` to `01_form_start`.
- [ ] Decide whether Supabase incremental saves should also store the newer ad params.
- [ ] Decide whether `phone_number` should include country code or whether `country_code` should be stored separately.

## UX

- [ ] Add "none of these times work" or callback request path for fully booked days.
- [ ] Add unit tests for `leadCategorization.ts`.
- [ ] Add focused manual checks for webhook payload shape, GA4 mirror events, CAPI dedupe, UTM capture, and booking failure routing.

## Backlog

- [ ] Form abandonment recovery.
- [ ] WhatsApp post-submission confirmation and nurture sequence.
- [ ] A/B testing for CTA copy and form field ordering.

## Won't Do

- Google Ads conversion snippet in code unless strategy changes. Current path is GA4 key events imported into Google Ads.
- In-code Google Calendar event creation. Make.com handles calendar event creation.
