# Integrations

Last updated: 2026-04-17

## Supabase

**Project:** apply-new-adms-lp-v2

### Config
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Usage
- Primary data store (`form_sessions` table)
- RPC function `upsert_form_session`
- Edge Functions for Meta CAPI
- RLS enabled

### Client Init (src/lib/database.ts)
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(url, anonKey)
```

---

## Make.com

### Webhook
```
VITE_REGISTRATION_WEBHOOK_URL
Method: POST
Trigger: Final form submission
```

### Scenarios
| Environment | Scenario |
|-------------|----------|
| Staging | 04.stg-apply-bch page v2 |
| Production | 04.prod-apply-bch page v2 |

### Actions
1. Receive webhook payload
2. Add row to Google Sheets
3. Send team notification email

---

## Meta Pixel

**ID:** `VITE_META_PIXEL_ID`

### Implementation (src/lib/metaPixelEvents.ts)
- Loaded via inline script
- Cookie polling for _fbp, _fbc
- ~37 custom events
- Environment suffix on all events

### Key Functions
```typescript
initializeMetaPixel()
fireLeadClassificationEvents(formData)
fireFormProgressionEvents(stage, formData)
fireCTAClickEvent(location)
```

---

## Meta CAPI

### Endpoint
```
{SUPABASE_URL}/functions/v1/meta-capi
```

### Implementation (src/lib/metaCAPI.ts)
```typescript
sendCAPIEvent(eventName, userData, eventId)
```

### Data Sent
- event_name, event_id, event_time
- user_data: fbp, fbc, em, ph, fn, ln, ct, external_id
- event_source_url (sanitized)

---

## Google Analytics

**ID:** G-ZRF7H5ZFXK

### Config
- Production only (apply.beaconhouse.in)
- Disabled in staging

### Events
- form_view
- form_step_complete
- form_abandonment
- form_error

---

## Netlify

### Sites
| Environment | Domain | Branch |
|-------------|--------|--------|
| Staging | staging-v2-apply-bch-in.netlify.app | staging |
| Production | apply.beaconhouse.in | main |

### Build
```
Build: npm run build
Publish: dist/
```

---

## Google Calendar (Netlify Functions — Read-Only)

### Purpose
- Real-time counselor availability via Google FreeBusy API (read-only)
- Calendar event creation is handled by Make.com (not this codebase)

### Runtime Endpoints
- `/.netlify/functions/gcal-availability` — POST, returns available slots for a given date + leadCategory

### Server Configuration (Netlify env)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
GCAL_ID_BCH
GCAL_ID_LUM_L1
GCAL_ID_LUM_L2 (optional, defaults to GCAL_ID_LUM_L1)
```

### Setup Notes
1. Create Google Cloud service account with Calendar API enabled.
2. Share each counselor calendar with service account email (read access is sufficient).
3. Put calendar IDs in `GCAL_ID_BCH`, `GCAL_ID_LUM_L1`, and optionally `GCAL_ID_LUM_L2`.

### Lead Category → Calendar Routing
| lead_category | Calendar | Env Var |
|---------------|----------|---------|
| `bch` | Vishy's calendar | GCAL_ID_BCH |
| `lum-l1` | Karthik's calendar | GCAL_ID_LUM_L1 |
| `lum-l2` | Configurable (default: Karthik) | GCAL_ID_LUM_L2 |

### Business Rules (server-side enforced)
- `leadCategory === bch` routes to BCH counselor calendar; all others route to LUM counselor.
- 1-hour slots, 7-day window, 60-minute same-day buffer.
- Day windows remain same as current business rules.
- 2 PM slot is globally blocked for both counselors.

### Fallback Behavior
- If Google Calendar API is unavailable, the form falls back to static slot rules (same as pre-GCal behavior).
- A `bookingFailureContext` is recorded in the store with `failureType: 'availability_fetch_failed'` or `'no_slots_available'`.
- This context is passed to both Supabase and Make.com webhook so the team can proactively reach out.

### Booking Failure Flow
- When availability fetch fails or returns no slots, user still sees fallback slots and can submit the form.
- Supabase write + Meta events + Make.com webhook ALL fire regardless of booking success/failure.
- Make.com receives `needs_manual_followup: true` flag when booking failed, routing to proactive follow-up.
- Make.com creates the calendar event + adds parent as attendee (existing flow, unchanged).
