# Database Schema

Last updated: 2026-02-04
Source: src/lib/formTracking.ts, src/lib/database.ts

## Supabase Project
- **Project:** apply-new-adms-lp-v2
- **URL:** knablvyvctlofexttsqg.supabase.co
- **RLS:** Enabled

## Table: form_sessions (35 columns)

### Primary Keys
| Column | Type | Constraint |
|--------|------|------------|
| `id` | uuid | PK, auto-generated |
| `session_id` | text | UNIQUE, NOT NULL |

### Timestamps
| Column | Type | Default |
|--------|------|---------|
| `created_at` | timestamptz | now() |
| `updated_at` | timestamptz | now() |

### Environment
| Column | Type | Values |
|--------|------|--------|
| `environment` | text | `stg`, `prod` |

### Page 1: Student Info
| Column | Type | Source Field |
|--------|------|--------------|
| `form_filler_type` | text | formFillerType |
| `student_name` | text | studentName |
| `current_grade` | text | currentGrade |
| `location` | text | location |
| `phone_number` | text | countryCode + phoneNumber |

### Page 1: Academic Info
| Column | Type | Source Field |
|--------|------|--------------|
| `curriculum_type` | text | curriculumType |
| `grade_format` | text | gradeFormat |
| `gpa_value` | text | gpaValue |
| `percentage_value` | text | percentageValue |
| `school_name` | text | schoolName |

### Page 1: Preferences
| Column | Type | Source Field |
|--------|------|--------------|
| `scholarship_requirement` | text | scholarshipRequirement |
| `target_geographies` | jsonb | targetGeographies |

### Page 2: Contact
| Column | Type | Source Field |
|--------|------|--------------|
| `parent_name` | text | parentName |
| `parent_email` | text | email |

### Page 2A: Booking
| Column | Type | Source Field |
|--------|------|--------------|
| `selected_date` | text | selectedDate |
| `selected_slot` | text | selectedSlot |

### System Fields
| Column | Type | Description |
|--------|------|-------------|
| `lead_category` | text | bch, lum-l1, lum-l2, nurture, masters, drop |
| `is_counselling_booked` | boolean | Has date + slot |
| `funnel_stage` | text | Current funnel position |
| `is_qualified_lead` | boolean | BCH or Luminaire |
| `page_completed` | integer | 1 or 2 |
| `triggered_events` | jsonb | Meta events fired |

### UTM Parameters
| Column | Type |
|--------|------|
| `utm_source` | text |
| `utm_medium` | text |
| `utm_campaign` | text |
| `utm_term` | text |
| `utm_content` | text |
| `utm_id` | text |

## Funnel Stages

```typescript
type FunnelStage =
  | '01_form_start'
  | '02_page1_student_info_filled'
  | '03_page1_academic_info_filled'
  | '04_page1_scholarship_info_filled'
  | '05_page1_complete'
  | '06_lead_evaluated'
  | '07_page_2_view'
  | '08_page_2_counselling_slot_selected'
  | '09_page_2_parent_details_filled'
  | '10_form_submit'
  | 'abandoned';
```

## RPC Function

### upsert_form_session

Primary function for all writes:

```sql
upsert_form_session(
  p_form_data: jsonb,
  p_session_id: text
) RETURNS void
```

Called via:
```typescript
await supabase.rpc('upsert_form_session', {
  p_form_data: dbFormData,
  p_session_id: sessionId
});
```

## Branching
| Branch | Environment | GitHub Branch |
|--------|-------------|---------------|
| staging | Development | staging |
| main | Production | main |

Identical schema, separate data.

## Fallback Strategy

If RPC fails, direct upsert:
```typescript
await supabase
  .from('form_sessions')
  .upsert([dbFormData], {
    onConflict: 'session_id',
    ignoreDuplicates: false
  });
```
