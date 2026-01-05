# Database Complete Reference

## 1. Database Architecture

### Technology
Supabase PostgreSQL

### Connection
- Library: `@supabase/supabase-js`
- Client Type: Supabase Client (JavaScript SDK)
- Authentication: Anon key

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (JWT token)
```

### Client Initialization
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Location: `src/lib/database.ts`

---

## 2. Table Schema: form_sessions

### Table Structure
- Primary Key: `id` (uuid)
- Unique Constraint: `session_id` (text, NOT NULL)
- Row Level Security: Enabled
- Total Columns: 35

### Column Definitions

#### Core Session Columns (4)

**id**
- Type: `uuid`
- Constraint: PRIMARY KEY
- Default: `gen_random_uuid()`
- Nullable: NO

**session_id**
- Type: `text`
- Constraint: UNIQUE, NOT NULL
- Nullable: NO
- Default: None

**created_at**
- Type: `timestamp with time zone`
- Default: `now()`
- Nullable: YES

**updated_at**
- Type: `timestamp with time zone`
- Default: `now()`
- Nullable: YES

#### Environment & Config (1)

**environment**
- Type: `text`
- Nullable: YES
- Default: None

#### Page 1: Student Information (5)

**form_filler_type**
- Type: `text`
- Nullable: YES
- Default: None

**student_name**
- Type: `text`
- Nullable: YES
- Default: None

**current_grade**
- Type: `text`
- Nullable: YES
- Default: None

**location**
- Type: `text`
- Nullable: YES
- Default: None

**phone_number**
- Type: `text`
- Nullable: YES
- Default: None

#### Page 1: Academic Information (5)

**curriculum_type**
- Type: `text`
- Nullable: YES
- Default: None

**grade_format**
- Type: `text`
- Nullable: YES
- Default: None

**gpa_value**
- Type: `text`
- Nullable: YES
- Default: None

**percentage_value**
- Type: `text`
- Nullable: YES
- Default: None

**school_name**
- Type: `text`
- Nullable: YES
- Default: None

#### Page 1: Study Preferences (2)

**scholarship_requirement**
- Type: `text`
- Nullable: YES
- Default: None

**target_geographies**
- Type: `jsonb`
- Nullable: YES
- Default: None

#### Page 2: Parent Contact Information (2)

**parent_name**
- Type: `text`
- Nullable: YES
- Default: None

**parent_email**
- Type: `text`
- Nullable: YES
- Default: None

#### Page 2A: Counseling Information (2)

**selected_date**
- Type: `text`
- Nullable: YES
- Default: None

**selected_slot**
- Type: `text`
- Nullable: YES
- Default: None

#### System & Tracking Fields (6)

**lead_category**
- Type: `text`
- Nullable: YES
- Default: None

**is_counselling_booked**
- Type: `boolean`
- Nullable: YES
- Default: `false`

**funnel_stage**
- Type: `text`
- Nullable: YES
- Default: `'01_form_start'::text`

**is_qualified_lead**
- Type: `boolean`
- Nullable: YES
- Default: `false`

**page_completed**
- Type: `integer`
- Nullable: YES
- Default: `1`

**triggered_events**
- Type: `jsonb`
- Nullable: YES
- Default: `'[]'::jsonb`

#### UTM Parameters (6)

**utm_source**
- Type: `text`
- Nullable: YES
- Default: None

**utm_medium**
- Type: `text`
- Nullable: YES
- Default: None

**utm_campaign**
- Type: `text`
- Nullable: YES
- Default: None

**utm_term**
- Type: `text`
- Nullable: YES
- Default: None

**utm_content**
- Type: `text`
- Nullable: YES
- Default: None

**utm_id**
- Type: `text`
- Nullable: YES
- Default: None

---

## 3. Indexes

### Existing Indexes (3)

**form_sessions_pkey**
- Type: UNIQUE INDEX
- Column: `id`
- Definition: `CREATE UNIQUE INDEX form_sessions_pkey ON public.form_sessions USING btree (id)`

**form_sessions_session_id_key**
- Type: UNIQUE INDEX
- Column: `session_id`
- Definition: `CREATE UNIQUE INDEX form_sessions_session_id_key ON public.form_sessions USING btree (session_id)`

**form_sessions_session_id_idx**
- Type: INDEX
- Column: `session_id`
- Definition: `CREATE INDEX form_sessions_session_id_idx ON public.form_sessions USING btree (session_id)`

---

## 4. Functions

### update_timestamp()

**Purpose:** Automatically updates the updated_at column on row updates

**Definition:**
```sql
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

**Used By:** `update_form_sessions_timestamp` trigger

### upsert_form_session()

**Purpose:** Insert or update form session data with COALESCE merging

**Signature:**
```sql
upsert_form_session(
  p_session_id text,
  p_form_data jsonb
) RETURNS uuid
```

**Definition:**
```sql
CREATE OR REPLACE FUNCTION public.upsert_form_session(
  p_session_id text,
  p_form_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.form_sessions (
    session_id,
    environment,
    form_filler_type,
    student_name,
    current_grade,
    phone_number,
    location,
    curriculum_type,
    grade_format,
    gpa_value,
    percentage_value,
    school_name,
    scholarship_requirement,
    target_geographies,
    parent_name,
    parent_email,
    selected_date,
    selected_slot,
    lead_category,
    is_counselling_booked,
    funnel_stage,
    is_qualified_lead,
    page_completed,
    triggered_events,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    utm_id
  )
  VALUES (
    p_session_id,
    p_form_data->>'environment',
    p_form_data->>'form_filler_type',
    p_form_data->>'student_name',
    p_form_data->>'current_grade',
    p_form_data->>'phone_number',
    p_form_data->>'location',
    p_form_data->>'curriculum_type',
    p_form_data->>'grade_format',
    p_form_data->>'gpa_value',
    p_form_data->>'percentage_value',
    p_form_data->>'school_name',
    p_form_data->>'scholarship_requirement',
    p_form_data->'target_geographies',
    p_form_data->>'parent_name',
    p_form_data->>'parent_email',
    p_form_data->>'selected_date',
    p_form_data->>'selected_slot',
    p_form_data->>'lead_category',
    COALESCE((p_form_data->>'is_counselling_booked')::boolean, false),
    COALESCE(p_form_data->>'funnel_stage', 'initial_capture'),
    COALESCE((p_form_data->>'is_qualified_lead')::boolean, false),
    COALESCE((p_form_data->>'page_completed')::integer, 1),
    COALESCE(p_form_data->'triggered_events', '[]'::jsonb),
    p_form_data->>'utm_source',
    p_form_data->>'utm_medium',
    p_form_data->>'utm_campaign',
    p_form_data->>'utm_term',
    p_form_data->>'utm_content',
    p_form_data->>'utm_id'
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    environment = COALESCE(EXCLUDED.environment, form_sessions.environment),
    form_filler_type = COALESCE(EXCLUDED.form_filler_type, form_sessions.form_filler_type),
    student_name = COALESCE(EXCLUDED.student_name, form_sessions.student_name),
    current_grade = COALESCE(EXCLUDED.current_grade, form_sessions.current_grade),
    phone_number = COALESCE(EXCLUDED.phone_number, form_sessions.phone_number),
    location = COALESCE(EXCLUDED.location, form_sessions.location),
    curriculum_type = COALESCE(EXCLUDED.curriculum_type, form_sessions.curriculum_type),
    grade_format = COALESCE(EXCLUDED.grade_format, form_sessions.grade_format),
    gpa_value = COALESCE(EXCLUDED.gpa_value, form_sessions.gpa_value),
    percentage_value = COALESCE(EXCLUDED.percentage_value, form_sessions.percentage_value),
    school_name = COALESCE(EXCLUDED.school_name, form_sessions.school_name),
    scholarship_requirement = COALESCE(EXCLUDED.scholarship_requirement, form_sessions.scholarship_requirement),
    target_geographies = COALESCE(EXCLUDED.target_geographies, form_sessions.target_geographies),
    parent_name = COALESCE(EXCLUDED.parent_name, form_sessions.parent_name),
    parent_email = COALESCE(EXCLUDED.parent_email, form_sessions.parent_email),
    selected_date = COALESCE(EXCLUDED.selected_date, form_sessions.selected_date),
    selected_slot = COALESCE(EXCLUDED.selected_slot, form_sessions.selected_slot),
    lead_category = COALESCE(EXCLUDED.lead_category, form_sessions.lead_category),
    is_counselling_booked = COALESCE(EXCLUDED.is_counselling_booked, form_sessions.is_counselling_booked),
    funnel_stage = COALESCE(EXCLUDED.funnel_stage, form_sessions.funnel_stage),
    is_qualified_lead = COALESCE(EXCLUDED.is_qualified_lead, form_sessions.is_qualified_lead),
    page_completed = COALESCE(EXCLUDED.page_completed, form_sessions.page_completed),
    triggered_events = COALESCE(EXCLUDED.triggered_events, form_sessions.triggered_events),
    utm_source = COALESCE(EXCLUDED.utm_source, form_sessions.utm_source),
    utm_medium = COALESCE(EXCLUDED.utm_medium, form_sessions.utm_medium),
    utm_campaign = COALESCE(EXCLUDED.utm_campaign, form_sessions.utm_campaign),
    utm_term = COALESCE(EXCLUDED.utm_term, form_sessions.utm_term),
    utm_content = COALESCE(EXCLUDED.utm_content, form_sessions.utm_content),
    utm_id = COALESCE(EXCLUDED.utm_id, form_sessions.utm_id),
    updated_at = now()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$function$;
```

**COALESCE Logic:**
- If new_value is NOT NULL → Use new_value
- If new_value is NULL → Keep existing_value
- Result: Never overwrites existing data with nulls

**Function Default for funnel_stage:** `'initial_capture'` (when p_form_data->>'funnel_stage' is null)
**Table Default for funnel_stage:** `'01_form_start'::text`

---

## 5. Triggers

### update_form_sessions_timestamp

**Event:** UPDATE
**Timing:** BEFORE
**Function:** `update_timestamp()`
**Purpose:** Auto-update updated_at timestamp on every UPDATE

**Definition:**
```sql
CREATE TRIGGER update_form_sessions_timestamp
  BEFORE UPDATE ON public.form_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();
```

### trigger_auto_assign_new_lead

**Event:** INSERT
**Timing:** AFTER
**Function:** `auto_assign_new_lead()`
**Purpose:** Automatically assign new leads to counselors

**Definition:**
```sql
CREATE TRIGGER trigger_auto_assign_new_lead
  AFTER INSERT ON public.form_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_new_lead();
```

---

## 6. Row Level Security

### Policies (7 Total)

**Anonymous users can view form sessions**
- Command: SELECT
- Roles: anon
- Using: true

**Anonymous users can create form sessions**
- Command: INSERT
- Roles: anon
- With Check: true

**Anonymous users can update form sessions**
- Command: UPDATE
- Roles: anon
- Using: true
- With Check: true

**Authenticated users can view form sessions**
- Command: SELECT
- Roles: authenticated
- Using: true

**Authenticated users can insert form sessions**
- Command: INSERT
- Roles: authenticated
- With Check: true

**Authenticated users can update form sessions**
- Command: UPDATE
- Roles: authenticated
- Using: true
- With Check: true

**Service role can access all form sessions**
- Command: ALL
- Roles: service_role
- Using: true
- With Check: true

---

## 7. Field Mappings

### Frontend (camelCase) → Database (snake_case)

| Frontend | Database | Type | Notes |
|----------|----------|------|-------|
| formFillerType | form_filler_type | text | |
| studentName | student_name | text | |
| currentGrade | current_grade | text | |
| location | location | text | |
| countryCode | [combined] | text | Combined into phone_number |
| phoneNumber | phone_number | text | Combined with countryCode |
| curriculumType | curriculum_type | text | |
| gradeFormat | grade_format | text | |
| gpaValue | gpa_value | text | |
| percentageValue | percentage_value | text | |
| schoolName | school_name | text | |
| scholarshipRequirement | scholarship_requirement | text | |
| targetGeographies | target_geographies | jsonb | Array of strings |
| parentName | parent_name | text | |
| email | parent_email | text | Field name changes |
| selectedDate | selected_date | text | |
| selectedSlot | selected_slot | text | |
| lead_category | lead_category | text | Same name |
| sessionId | session_id | text | |

### Special Field Handling

**Phone Number:**
- Frontend: Two separate fields (countryCode, phoneNumber)
- Database: One combined string
- Example: countryCode="+91", phoneNumber="9876543210" → phone_number="+919876543210"

**Email:**
- Frontend field name: `email`
- Database field name: `parent_email`
- Webhook field name: `parent_email`

**Target Geographies:**
- Frontend: Array of strings (JavaScript)
- Database: JSONB array (PostgreSQL)
- Example: `['US', 'UK']` stored as JSONB array

**Triggered Events:**
- Frontend: Array of strings (Zustand state)
- Database: JSONB array (PostgreSQL)
- Accumulates throughout session

### Calculated Fields

**is_qualified_lead:**
```typescript
['bch', 'lum-l1', 'lum-l2'].includes(lead_category)
```

**is_counselling_booked:**
```typescript
Boolean(selected_date && selected_slot)
```

**page_completed:**
- Set to 1 when Page 1 submitted
- Set to 2 when Page 2 loaded or submitted

**funnel_stage:**
- Determined by save operation
- Never set directly by frontend
- Maps from section name to stage code

---

## 8. Database Write Operations

### Overview
The form performs 11 database write operations across the user journey. Each write is an upsert (INSERT or UPDATE) using the same session_id.

### Write Operation 1: Form Start

**Trigger:** FormContainer component mounts (useEffect)
**Timing:** Immediate (as soon as form page loads)
**Funnel Stage:** `'01_form_start'`

**Data Included:**
- session_id (Generated UUID)
- environment ('stg' or 'prod')
- funnel_stage: '01_form_start'
- page_completed: 1
- triggered_events: [] (Empty initially)
- created_at (ISO 8601)

**Function Called:**
```typescript
saveFormDataIncremental(sessionId, 1, '01_form_start', { /* minimal data */ })
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 2: Student Info Complete

**Trigger:** All student info fields filled (useEffect watch)
**Watch Fields:** formFillerType, studentName, currentGrade, location, countryCode, phoneNumber
**Timing:** When all 6 fields have values
**Funnel Stage:** `'02_page1_student_info_filled'`

**Data Included:**
- session_id
- environment
- form_filler_type
- student_name
- current_grade
- location
- phone_number (Combined countryCode + phoneNumber)
- funnel_stage: '02_page1_student_info_filled'
- page_completed: 1
- triggered_events (Accumulated events)

**Function Called:**
```typescript
trackFormSection(sessionId, 'student_info_complete', 1, fullFormData)
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 3: Academic Info Complete

**Trigger:** All academic fields filled (useEffect watch)
**Watch Fields:** curriculumType, schoolName, gradeFormat, gpaValue OR percentageValue
**Timing:** When all 4 required fields have values
**Funnel Stage:** `'03_page1_academic_info_filled'`

**Data Included:**
- All previous fields from Operation 2
- curriculum_type
- grade_format
- gpa_value (string | null)
- percentage_value (string | null)
- school_name
- funnel_stage: '03_page1_academic_info_filled'
- triggered_events

**Function Called:**
```typescript
trackFormSection(sessionId, 'academic_info_complete', 1, fullFormData)
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 4: Preferences Complete

**Trigger:** All preference fields filled (useEffect watch)
**Watch Fields:** scholarshipRequirement, targetGeographies (array length > 0)
**Timing:** When both fields have values
**Funnel Stage:** `'04_page1_scholarship_info_filled'`

**Data Included:**
- All previous Page 1 fields
- scholarship_requirement
- target_geographies (string[])
- funnel_stage: '04_page1_scholarship_info_filled'
- triggered_events

**Function Called:**
```typescript
trackFormSection(sessionId, 'preferences_complete', 1, fullFormData)
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 5: Page 1 Complete

**Trigger:** Continue button clicked AND validation passes
**Timing:** After Zod validation, before lead categorization
**Funnel Stage:** `'05_page1_complete'`

**Data Included:**
- All Page 1 fields (complete)
- lead_category (Determined by categorization)
- is_qualified_lead (Calculated)
- funnel_stage: '05_page1_complete'
- page_completed: 1
- triggered_events (Includes page_1_complete events)
- utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id

**Function Called:**
```typescript
trackPageCompletion(sessionId, 1, '05_page1_complete', formDataWithCategory)
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 6: Lead Evaluated (Qualified Only)

**Trigger:** After 10-second evaluation animation completes
**Timing:** Before navigating to Page 2A
**Applies To:** BCH, LUM-L1, LUM-L2 leads only
**Funnel Stage:** `'06_lead_evaluated'`

**Data Included:**
- All Page 1 fields
- lead_category
- is_qualified_lead: true
- funnel_stage: '06_lead_evaluated'
- page_completed: 2 (Entering Page 2)
- triggered_events (Includes page_2_view events)

**Function Called:**
```typescript
saveFormDataIncremental(sessionId, 2, '06_lead_evaluated', { ...storeFormData, triggeredEvents })
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 7: Page 2 View (Disqualified Only)

**Trigger:** Navigate to Page 2B (disqualified leads)
**Timing:** When currentStep changes to 2
**Applies To:** NURTURE, MASTERS leads only (not DROP - they submit at Page 1)
**Funnel Stage:** `'07_page_2_view'`

**Data Included:**
- All Page 1 fields
- lead_category
- is_qualified_lead: false
- funnel_stage: '07_page_2_view'
- page_completed: 2
- triggered_events (Includes page_2_view events)

**Function Called:**
```typescript
saveFormDataIncremental(sessionId, 2, '07_page_2_view', formData)
```

**Location:** `src/lib/formTracking.ts`

**Note:** Operations 6 and 7 are mutually exclusive - only one happens per session

### Write Operation 8: Counseling Slot Selected (Page 2A Only)

**Trigger:** Both selectedDate AND selectedSlot filled (useEffect watch)
**Timing:** When both booking fields have values
**Applies To:** Qualified leads on Page 2A only
**Funnel Stage:** `'08_page_2_counselling_slot_selected'`

**Data Included:**
- All Page 1 fields
- selected_date
- selected_slot
- is_counselling_booked: true (Calculated)
- funnel_stage: '08_page_2_counselling_slot_selected'
- page_completed: 2
- triggered_events

**Function Called:**
```typescript
trackFormSection(sessionId, 'counseling_slot_selected', 2, { ...storeFormData, selectedDate, selectedSlot })
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 9: Contact Details Entered (Page 2A & 2B)

**Trigger:** Both parentName AND email filled (useEffect watch)
**Timing:** When both contact fields have values
**Applies To:** All Page 2 forms (2A and 2B)
**Funnel Stage:** `'09_page_2_parent_details_filled'`

**Data Included:**
- All previous fields
- parent_name
- parent_email (Frontend field: email)
- funnel_stage: '09_page_2_parent_details_filled'
- page_completed: 2
- triggered_events

**Function Called:**
```typescript
trackFormSection(sessionId, 'contact_details_entered', 2, { ...storeFormData, parentName, email })
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 10: Form Submit

**Trigger:** Submit button clicked on Page 2 AND validation passes
**Timing:** Immediately before webhook submission
**Applies To:** All Page 2 submissions (2A and 2B)
**Funnel Stage:** `'10_form_submit'`

**Data Included:**
- ALL form fields (complete form)
- lead_category
- is_counselling_booked (boolean)
- is_qualified_lead (boolean)
- funnel_stage: '10_form_submit'
- page_completed: 2
- triggered_events (All accumulated events)
- utm_parameters
- created_at, updated_at

**Function Called:**
```typescript
trackFormSubmission(sessionId, completeFormData, true)
```

**Location:** `src/lib/formTracking.ts`

### Write Operation 11: Immediate Submission (Grade 7/Student)

**Trigger:** Page 1 completion for Grade 7_below OR Student form filler
**Timing:** After lead categorization, instead of navigation to Page 2
**Funnel Stage:** `'10_form_submit'` (skips Page 2)

**Data Included:**
- All Page 1 fields
- lead_category: 'drop' | 'nurture'
- is_qualified_lead: false
- funnel_stage: '10_form_submit'
- page_completed: 1 (Only completed Page 1)
- parent_name: null
- parent_email: null
- selected_date: null
- selected_slot: null
- is_counselling_booked: false
- triggered_events (Includes form_complete events)

**Function Called:**
```typescript
trackFormSubmission(sessionId, formData, true)
```

**Location:** `src/lib/formTracking.ts`

### Database Write Implementation

**Core Function:** `saveFormDataIncremental`

**Location:** `src/lib/formTracking.ts`

**Signature:**
```typescript
saveFormDataIncremental(
  sessionId: string,
  pageNumber: number,
  funnelStage: FunnelStage,
  formData: any
): Promise<void>
```

**Logic:**
1. Calculate is_counselling_booked: `Boolean(formData.selectedDate && formData.selectedSlot)`
2. Calculate is_qualified_lead: `['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category)`
3. Get UTM parameters from Zustand store
4. Prepare database payload (all snake_case)
5. Call Supabase RPC: `supabase.rpc('upsert_form_session', { p_session_id, p_form_data })`
6. If RPC fails, fallback to direct upsert: `supabase.from('form_sessions').upsert([dbFormData], { onConflict: 'session_id' })`
7. Log success or error
8. Don't throw errors (form continues even if save fails)

**Error Handling:**
- Non-blocking errors
- Form continues working even if tracking fails
- Fallback to direct upsert if RPC fails

---

## 9. Funnel Stages

### Overview
Funnel stages track user progress through the form with 11 predefined stages.

### Stage List

#### 01_form_start
- Meaning: User landed on form page, component mounted
- Data Captured: Minimal (session_id, environment, start_time)
- Trigger: FormContainer mount (useEffect)
- Next Stage: 02_page1_student_info_filled

#### 02_page1_student_info_filled
- Meaning: Student information section completed
- Data Captured: Student info fields (5 fields)
- Trigger: All student fields filled (useEffect watch)
- Next Stage: 03_page1_academic_info_filled

#### 03_page1_academic_info_filled
- Meaning: Academic information section completed
- Data Captured: Academic fields (curriculum, school, grades)
- Trigger: All academic fields filled (useEffect watch)
- Next Stage: 04_page1_scholarship_info_filled

#### 04_page1_scholarship_info_filled
- Meaning: Study preferences section completed
- Data Captured: Scholarship requirement, target geographies
- Trigger: All preference fields filled (useEffect watch)
- Next Stage: 05_page1_complete

#### 05_page1_complete
- Meaning: Page 1 submitted successfully
- Data Captured: All Page 1 fields + lead_category + events
- Trigger: Continue button clicked, validation passed
- Next Stage: 06_lead_evaluated OR 07_page_2_view OR 10_form_submit

#### 06_lead_evaluated
- Meaning: Evaluation animation completed (qualified leads only)
- Data Captured: Same as previous + page_2_view events
- Trigger: After 10-second animation
- Applies To: BCH, LUM-L1, LUM-L2 only
- Next Stage: 08_page_2_counselling_slot_selected

#### 07_page_2_view
- Meaning: Page 2B loaded (disqualified leads only)
- Data Captured: Same as 05 + page_2_view events
- Trigger: Navigate to Page 2B
- Applies To: NURTURE, MASTERS only
- Next Stage: 09_page_2_parent_details_filled

#### 08_page_2_counselling_slot_selected
- Meaning: Counseling date and time chosen (qualified only)
- Data Captured: selected_date, selected_slot
- Trigger: Both booking fields filled
- Applies To: Page 2A only
- Next Stage: 09_page_2_parent_details_filled

#### 09_page_2_parent_details_filled
- Meaning: Parent contact information entered
- Data Captured: parent_name, parent_email
- Trigger: Both contact fields filled
- Applies To: All Page 2 forms (2A and 2B)
- Next Stage: 10_form_submit

#### 10_form_submit
- Meaning: Form submitted successfully
- Data Captured: Complete form + all events
- Trigger: Submit button clicked, validation passed, webhook sent
- Applies To: All successful submissions
- Next Stage: None (terminal state)

#### abandoned
- Meaning: User left form without completing
- Data Captured: Partial form data, time spent
- Trigger: beforeunload or timeout (if implemented)
- Next Stage: None (terminal state)

### Funnel Stage Mapping

**Section Name → Funnel Stage:**
```typescript
const funnelStageMap = {
  'student_info_complete': '02_page1_student_info_filled',
  'academic_info_complete': '03_page1_academic_info_filled',
  'preferences_complete': '04_page1_scholarship_info_filled',
  'initial_lead_capture': '01_form_start',
  'form_interaction_started': '01_form_start',
  'contact_details_complete': '09_page_2_parent_details_filled',
  'contact_details_entered': '09_page_2_parent_details_filled',
  'counseling_slot_selected': '08_page_2_counselling_slot_selected',
  'final_submission': '10_form_submit',
  'form_started': '01_form_start'
}
```

**Location:** `src/lib/formTracking.ts`

---

## 10. Incremental Save Logic

### Purpose
Save form data progressively as the user completes sections, enabling:
1. Data recovery if browser crashes
2. Funnel drop-off analysis
3. No data loss from abandonment
4. Session continuity

### Save Trigger Mechanisms

#### useEffect Watchers
**Pattern:**
```typescript
useEffect(() => {
  if (condition_for_section_complete) {
    trackFormSection(sessionId, 'section_name', pageNumber, formData)
  }
}, [field1, field2, field3, ...dependencies])
```

**Example - Student Info Section:**
```typescript
useEffect(() => {
  if (formFillerType && studentName && currentGrade &&
      location && countryCode && phoneNumber) {
    trackFormSection(sessionId, 'student_info_complete', 1, {
      ...storeFormData,
      formFillerType,
      studentName,
      currentGrade,
      location,
      phoneNumber: countryCode + phoneNumber,
      triggeredEvents
    })
  }
}, [formFillerType, studentName, currentGrade, location, countryCode, phoneNumber])
```

#### Button Click Handlers
**Pattern:**
```typescript
const handleContinue = async () => {
  const isValid = await validate()
  if (!isValid) return
  
  const category = determineLeadCategory(...)
  await trackPageCompletion(sessionId, pageNumber, funnelStage, formData)
  proceedToNextStep()
}
```

### Data Accumulation Strategy

**Principle:** Each save includes ALL previously filled data plus new data

**Implementation:**
```typescript
const { formData, triggeredEvents } = useFormStore.getState().getLatestFormData()

const completeSave = {
  ...formData,              // All previous fields
  newField1: value1,       // New fields from this section
  newField2: value2,
  triggeredEvents: [...triggeredEvents, ...newEvents]  // Accumulated events
}

await saveFormDataIncremental(sessionId, pageNumber, funnelStage, completeSave)
```

### triggeredEvents Accumulation

**Pattern:**
1. Event fires (Meta Pixel)
2. Event name added to Zustand triggeredEvents array
3. triggeredEvents included in every database save
4. Database updates triggered_events JSONB field

---

## 11. Meta Pixel Event Tracking

### Overview
Event tracking for Facebook/Instagram ad optimization using custom Meta Pixel events.

**Total Events:** 35 custom events
**Scope:** Form-related events only
**Purpose:** Enable advanced targeting, retargeting, and conversion optimization

### Meta Pixel Setup

#### Initialization
**Timing:** App.tsx component mount
**Function:** `initializeMetaPixel(): void`

**Implementation:**
1. Get Pixel ID from environment: `import.meta.env.VITE_META_PIXEL_ID`
2. Check if Pixel already initialized: `if (window.fbq) return`
3. Inject Facebook Pixel SDK
4. Call `fbq('init', pixelId)`
5. Call `fbq('track', 'PageView')`

#### Environment Suffix
**All events get environment suffix:**
- Staging: `event_name_stg`
- Production: `event_name_prod`

**Implementation:**
```typescript
const getEnvironmentSuffix = (): string => {
  const env = import.meta.env.VITE_ENVIRONMENT?.trim()
  return env === 'prod' ? 'prod' : 'stg'
}

const fullEventName = `${eventName}_${getEnvironmentSuffix()}`
```

### Event Categories

#### Category 1: CTA Click Events (2 events)
- **apply_cta_hero** - Hero section "Request an Evaluation" button clicked
- **apply_cta_header** - Header "Request an Evaluation" button clicked

#### Category 2: Primary Lead Classification Events (8 events)
**Trigger:** Page 1 Continue button clicked, validation passes

**Events:**
- apply_prnt_event
- apply_spam_prnt
- apply_qualfd_prnt
- apply_disqualfd_prnt
- apply_stdnt
- apply_spam_stdnt
- apply_qualfd_stdnt
- apply_disqualfd_stdnt

#### Category 3: General Funnel Events (4 events)
- **apply_page_1_continue** - Page 1 submitted successfully
- **apply_page_2_view** - Navigate to Page 2 (2A or 2B)
- **apply_page_2_submit** - Submit button clicked on Page 2, validation passes
- **apply_form_complete** - Form submission complete (DB + webhook)

#### Category 4: Category-Specific Events (12 events total)
**Pattern:** 4 events per category × 3 categories = 12 events

**BCH Events:**
- apply_bch_page_1_continue
- apply_bch_page_2_view
- apply_bch_page_2_submit
- apply_bch_form_complete

**LUM-L1 Events:**
- apply_lum_l1_page_1_continue
- apply_lum_l1_page_2_view
- apply_lum_l1_page_2_submit
- apply_lum_l1_form_complete

**LUM-L2 Events:**
- apply_lum_l2_page_1_continue
- apply_lum_l2_page_2_view
- apply_lum_l2_page_2_submit
- apply_lum_l2_form_complete

#### Category 5: Qualified Lead Funnel Events (8 events total)
**Pattern:** 4 events per filler type × 2 types = 8 events

**Qualified Parent Events:**
- apply_qualfd_prnt_page_1_continue
- apply_qualfd_prnt_page_2_view
- apply_qualfd_prnt_page_2_submit
- apply_qualfd_prnt_form_complete

**Qualified Student Events:**
- apply_qualfd_stdnt_page_1_continue
- apply_qualfd_stdnt_page_2_view
- apply_qualfd_stdnt_page_2_submit
- apply_qualfd_stdnt_form_complete

### Event Storage & Retrieval

**Storage Flow:**
1. Event fires → Meta Pixel tracks
2. Event name (without suffix) added to Zustand triggeredEvents array
3. triggeredEvents included in every database save
4. Database stores in triggered_events JSONB column
5. Webhook submission includes triggered_events in payload

---

## 12. Webhook Integration

### Purpose
Send complete form data to Make.com webhook for:
- CRM integration
- Email automation
- Further data processing
- Backup data capture

### Webhook Configuration

**URL Source:** Environment variable
```
VITE_REGISTRATION_WEBHOOK_URL=https://hook.us2.make.com/...
```

**Method:** POST
**Content-Type:** application/json
**Timing:** After final database write, before success screen

### Webhook Payload Structure

**Complete payload (all snake_case):**

```typescript
{
  // Core
  session_id: string,
  environment: 'stg' | 'prod',

  // Page 1 - Student Info
  form_filler_type: 'parent' | 'student',
  student_name: string,
  current_grade: string,
  location: string,
  phone_number: string,  // Combined: countryCode + phoneNumber

  // Page 1 - Academic
  curriculum_type: string,
  grade_format: 'gpa' | 'percentage',
  gpa_value: string | null,
  percentage_value: string | null,
  school_name: string,

  // Page 1 - Preferences
  scholarship_requirement: string,
  target_geographies: string[],  // Array

  // Page 2 - Contact
  parent_name: string | null,
  parent_email: string | null,   // Frontend: email, Webhook: parent_email

  // Page 2A - Booking
  selected_date: string | null,
  selected_slot: string | null,

  // System Fields
  lead_category: string,
  is_counselling_booked: boolean,
  is_qualified_lead: boolean,
  page_completed: number,
  triggered_events: string[],    // All accumulated events

  // UTM Parameters
  utm_source: string | null,
  utm_medium: string | null,
  utm_campaign: string | null,
  utm_term: string | null,
  utm_content: string | null,
  utm_id: string | null,

  // Timestamp
  created_at: string  // ISO 8601 format
}
```

### Webhook Submission Logic

**Function:** `submitFormData()`

**Location:** `src/lib/form.ts`

**Implementation:**
1. Get webhook URL from environment
2. Get UTM parameters from Zustand store
3. Calculate derived fields:
   - is_qualified_lead = `['bch', 'lum-l1', 'lum-l2'].includes(lead_category)`
   - is_counselling_booked = `Boolean(selectedDate && selectedSlot)`
4. Validate lead_category (sanitize value)
5. Build payload (all snake_case)
6. Submit via fetch: `fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`
7. Handle response (non-blocking errors)

### Error Handling

**Non-Blocking Errors:**
- Webhook is for integration, not critical to user experience
- Database save is primary source of truth
- User sees success even if webhook fails
- Failed webhooks can be retried manually from database records

**Expected Response:**
- Status: 200 OK
- Body: Not used (webhook can return anything)

---

## Implementation Reference

### Code Locations

**Database Connection:**
- File: `src/lib/database.ts`
- Function: `getSupabaseClient()`
- Export: `supabase`

**Form Tracking:**
- File: `src/lib/formTracking.ts`
- Functions: `saveFormDataIncremental`, `trackFormSection`, `trackPageCompletion`, `trackFormSubmission`
- Types: `FunnelStage`

**Form Submission:**
- File: `src/lib/form.ts`
- Function: `submitFormData()`

**Meta Pixel:**
- File: `src/lib/metaPixelEvents.ts`
- Function: `initializeMetaPixel()`, `trackMetaPixelEvent()`

### Function Signatures

**saveFormDataIncremental:**
```typescript
saveFormDataIncremental(
  sessionId: string,
  pageNumber: number,
  funnelStage: FunnelStage,
  formData: any
): Promise<void>
```

**trackFormSection:**
```typescript
trackFormSection(
  sessionId: string,
  sectionName: string,
  currentPage: number,
  fullFormData: any
): Promise<void>
```

**trackPageCompletion:**
```typescript
trackPageCompletion(
  sessionId: string,
  pageNumber: number,
  pageType: string,
  formData: any
): Promise<void>
```

**trackFormSubmission:**
```typescript
trackFormSubmission(
  sessionId: string,
  formData: any,
  isComplete: boolean = true
): Promise<void>
```

**submitFormData:**
```typescript
submitFormData(
  data: Partial<CompleteFormData>,
  step: number,
  startTime: number,
  isComplete: boolean = false,
  triggeredEvents: string[] = []
): Promise<Response>
```

---

## Default Values

### Database Defaults

- **id:** `gen_random_uuid()`
- **created_at:** `now()`
- **updated_at:** `now()`
- **is_counselling_booked:** `false`
- **funnel_stage:** `'01_form_start'::text` (table default)
- **is_qualified_lead:** `false`
- **page_completed:** `1`
- **triggered_events:** `'[]'::jsonb`

### Function Defaults (upsert_form_session)

- **funnel_stage:** `'initial_capture'` (when p_form_data->>'funnel_stage' is null)
- **is_counselling_booked:** `false`
- **is_qualified_lead:** `false`
- **page_completed:** `1`
- **triggered_events:** `'[]'::jsonb`

### Frontend Defaults

- **countryCode:** `"+91"`
- **gradeFormat:** `'gpa'`

---

## Nullable vs Required

### Always Required (NOT NULL in DB)
- id (auto-generated)
- session_id

### Nullable (can be NULL)
- All form fields (user may not complete)
- All UTM parameters
- parent_name, parent_email (until Page 2)
- selected_date, selected_slot (disqualified leads)
- environment
- created_at, updated_at (have defaults but nullable)

### Validation Requirement vs Database
- Form validation requires fields for submission
- Database allows nulls for partial saves
- This enables incremental saves
