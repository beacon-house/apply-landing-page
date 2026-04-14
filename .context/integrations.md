# Integrations

Last updated: 2026-02-04

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

## Google Calendar (Netlify Functions)

### Purpose
- Real-time counselor availability via Google FreeBusy API
- Slot lockout by creating counselor calendar events
- Invite parent as attendee (configurable)

### Runtime Endpoints
- `/.netlify/functions/gcal-availability`
- `/.netlify/functions/gcal-booking`

### Server Configuration (Netlify env)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
GCAL_ID_BCH
GCAL_ID_LUM
GCAL_ADD_PARENT_AS_ATTENDEE=true|false
```

### Setup Notes
1. Create Google Cloud service account with Calendar API enabled.
2. Share each counselor calendar with service account email.
3. Grant permission to create/edit events on those calendars.
4. Put calendar IDs in `GCAL_ID_BCH` and `GCAL_ID_LUM`.

### Business Rules (server-side enforced)
- `leadCategory === bch` routes to BCH counselor calendar; all others route to LUM counselor.
- 1-hour slots, 7-day window, 60-minute same-day buffer.
- Day windows remain same as current business rules.
- 2 PM slot is globally blocked for both counselors.

### Event Behavior
- Event title format: `Beacon House Consultation - {StudentName}`.
- Booking endpoint rechecks freebusy before insert to avoid race conditions.
- If slot is no longer free, endpoint returns `409` with `SLOT_TAKEN`.
