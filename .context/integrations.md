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

## Google Calendar (Planned)

### Purpose
- Real-time counselor availability
- Automatic slot blocking
- Calendar invite creation

### Status
Not implemented. Currently using static slot rules in QualifiedLeadForm.tsx.
