# Meta Pixel Events

Last updated: 2026-02-04
Source: src/lib/metaPixelEvents.ts (535 lines)

## Event Naming Convention

All events are suffixed with environment:
- Staging: `event_name_stg`
- Production: `event_name_prod`

## Event Categories

### 1. Page & CTA Events (3 events)

| Event Name | Trigger | User Data |
|------------|---------|-----------|
| `apply_page_view` | Page load | - |
| `apply_cta_hero` | Hero CTA click | - |
| `apply_cta_header` | Header CTA click | - |

### 2. Lead Classification Events (8 events)

**Parent Events:**
| Event Name | Trigger |
|------------|---------|
| `apply_prnt_event` | Parent submits Page 1 |
| `apply_spam_prnt` | Parent + spam detected |
| `apply_qualfd_prnt` | Parent + qualified (BCH/Luminaire) |
| `apply_disqualfd_prnt` | Parent + not qualified |

**Student Events:**
| Event Name | Trigger |
|------------|---------|
| `apply_stdnt` | Student submits Page 1 |
| `apply_spam_stdnt` | Student + spam detected |
| `apply_qualfd_stdnt` | Student + would be qualified as parent |
| `apply_disqualfd_stdnt` | Student + would not be qualified |

### 3. Funnel Events (4 events)

| Event Name | Trigger |
|------------|---------|
| `apply_page_1_continue` | Page 1 complete |
| `apply_page_2_view` | Page 2 loaded |
| `apply_page_2_submit` | Page 2 submit clicked |
| `apply_form_complete` | Form fully submitted |

### 4. Category-Specific Events (12 events)

For each qualified category (bch, lum_l1, lum_l2):

| Pattern | Events |
|---------|--------|
| `apply_{category}_page_1_continue` | 3 events |
| `apply_{category}_page_2_view` | 3 events |
| `apply_{category}_page_2_submit` | 3 events |
| `apply_{category}_form_complete` | 3 events |

### 5. Qualified Lead Events (8 events)

**Parent qualified events:**
- `apply_qualfd_prnt_page_1_continue`
- `apply_qualfd_prnt_page_2_view`
- `apply_qualfd_prnt_page_2_submit`
- `apply_qualfd_prnt_form_complete`

**Student qualified events (simulated):**
- `apply_qualfd_stdnt_page_1_continue`
- `apply_qualfd_stdnt_page_2_view`
- `apply_qualfd_stdnt_page_2_submit`
- `apply_qualfd_stdnt_form_complete`

### 6. Enrichment Events (2 events)

| Event Name | Trigger | Purpose |
|------------|---------|---------|
| `apply_phone_captured` | Phone field blur with valid data | Early phone capture for matching |
| `apply_email_captured` | Email field blur with valid data | Early email capture for matching |

## User Data Sent

Events include user data for improved ad matching:

```typescript
MetaUserData {
  fbp?: string;           // _fbp cookie
  fbc?: string;           // _fbc cookie
  client_user_agent?: string;
  client_ip_address?: string;
  em?: string;            // email (lowercase)
  ph?: string;            // phone (E.164 format)
  fn?: string;            // first name (lowercase)
  ln?: string;            // last name (lowercase)
  ct?: string;            // city (lowercase, no spaces)
  external_id?: string;   // session ID
}
```

## Event Deduplication

Each event gets a unique `eventId`:
```
{sessionId}_{eventName}_{timestamp}_{counter}
```

Same eventId sent to both Pixel and CAPI for deduplication.

## CAPI Integration

Server-side events sent to Supabase Edge Function:
```
POST {SUPABASE_URL}/functions/v1/meta-capi
```

Payload:
```json
{
  "event_name": "apply_page_view_prod",
  "user_data": { ... },
  "event_id": "uuid_event_timestamp_1",
  "event_time": 1706745600,
  "event_source_url": "https://apply.beaconhouse.in/"
}
```

## Cookie Polling

Events are queued until Meta cookies (`_fbp`, `_fbc`) are available. This improves event match quality.

## Total Event Count

- Page/CTA: 3
- Classification: 8
- Funnel: 4
- Category-specific: 12
- Qualified lead: 8
- Enrichment: 2
- **Total: ~37 unique events**
