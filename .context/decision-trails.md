# Decision Trails

This file records why major product decisions were made. It is historical context, not a replacement for code.

## DT-001: Add A Deeper TAM Parent Signal

Problem: `apply_tam_prnt` was broad. Low CPM plus high CTR suggested Meta could find cheap broad education-interest traffic, but not necessarily the top-university parent ICP.

Decision: keep `apply_tam_prnt` as the broad TAM parent signal and add `apply_tam_prnt_level2` for non-spam TAM parents who reach Page 2A and enter email.

Rationale: form depth is a stronger intent signal than Page 1 completion. Page 2A is qualified-only, so email blur there is a higher-friction, higher-intent event.

Current code: `apply_tam_prnt_level2` fires from `@repo/src/components/forms/QualifiedLeadForm.tsx` on valid email blur via `fireTamParentLevel2Event()`.

## DT-002: Spam Parents Route To Drop

Problem: spam-detected parents with GPA `10` or percentage `100` could previously continue into a contact path, contaminating deeper email-capture signals.

Decision: route spam-detected forms to `drop`.

Rationale: if the user enters impossible/perfect score values, the funnel should not collect Page 2 email or create a high-intent optimization signal.

Current code: `@repo/src/lib/leadCategorization.ts` returns `drop` for `gpaValue === '10'` or `percentageValue === '100'`.

## DT-003: All Qualified Leads Route To Viswanathan

Decision: `bch`, `lum-l1`, and `lum-l2` all route to Viswanathan for the current counseling UX.

Rationale: Karthik no longer takes 1:1 counseling calls in this funnel. His config is preserved in code but not surfaced.

Current code: `@repo/netlify/functions/_counselorConfig.ts` resolves all qualified categories to `bch`, and `@repo/src/components/forms/QualifiedLeadForm.tsx` hardcodes Viswanathan's profile.

## DT-004: CAPI Uses Netlify Function

Decision: send CAPI through `/.netlify/functions/meta-capi`, not Supabase Edge Functions.

Rationale: avoids dependency on Supabase Edge Function availability from Indian user networks and keeps the CAPI route on the same hosted surface as the landing page.

Current code: `@repo/src/lib/metaCAPI.ts` posts to the Netlify function; `@repo/netlify/functions/meta-capi.ts` proxies to Meta Graph API.

## DT-005: Google Ads Uses GA4 Imports

Decision: do not wire a Google Ads conversion snippet in code for now.

Rationale: the intended path is GA4 key events imported into Google Ads. The code mirrors Meta `apply_*` events into GA4 so the conversion architecture stays aligned.

Current code: `@repo/index.html` has Google Ads base tag `AW-17192426075`; `@repo/src/lib/ga4Events.ts` mirrors event names into GA4.

## DT-006: Grade 8 Jan-Jun Seasonal Nurture Rule

Decision: from January through June in `Asia/Kolkata`, Grade 8 parent leads that pass global overrides route to `nurture`. From July through December, Grade 8 follows the standard qualification rules.

Rationale: Grade 8 leads can still be useful for nurture early in the year, but should not route into the immediate qualified booking path during the Jan-Jun season.

Current code: `@repo/src/lib/leadCategorization.ts` uses `isJanToJunInKolkata()` before the Grade 8/9/10 BCH branch.

## DT-007: GA4 Measurement ID Change Paused

Decision: keep GA4 Measurement ID `G-1PMRW2MXT4` for now.

Rationale: Vishy surfaced `G-ZRF7H5ZFXK`, but the founder/team has not yet confirmed which GA4 property should receive Apply and Clarity events. Kamil's confirmed Ads tag remains `AW-17192426075`.

Current code: `@repo/index.html` still configures GA4 `G-1PMRW2MXT4` and Google Ads `AW-17192426075`.
