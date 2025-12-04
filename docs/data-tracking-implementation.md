# Data Persistence & Event Tracking Guide

**Version:** 2.0
**Last Updated:** 2025-12-04
**Purpose:** Complete guide to database writes, funnel tracking, and Meta Pixel event implementation for Beacon House application form

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Database Schema](#database-schema)
3. [Database Write Operations](#database-write-operations)
4. [Funnel Stages](#funnel-stages)
5. [Incremental Save Logic](#incremental-save-logic)
6. [Meta Pixel Event Tracking](#meta-pixel-event-tracking)
7. [Webhook Integration](#webhook-integration)
8. [Field Mapping Reference](#field-mapping-reference)

---

## Database Architecture

### Technology
**Supabase PostgreSQL** - Fully managed PostgreSQL database

### Connection Method
- **Library:** `@supabase/supabase-js`
- **Client Type:** Supabase Client (JavaScript SDK)
- **Authentication:** Anon key (public key for client-side operations)

### Connection Configuration

**Environment Variables Required:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (JWT token)
```

**Client Initialization:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Connection Testing:**
```typescript
// Test query on mount or health check
const { data, error } = await supabase
  .from('form_sessions')
  .select('count')
  .limit(1)
```

---

### Data Persistence Strategy

**Incremental Saves:**
- Form data saved at every section completion
- Uses UPSERT pattern (INSERT or UPDATE)
- Single session_id tracks entire user journey
- No data loss if user abandons mid-form

**Upsert Behavior:**
```
On every save:
  1. Try INSERT with session_id
  2. If session_id exists:
     - UPDATE existing record
     - Use COALESCE to keep existing non-null values
     - Only update changed/new fields
  3. Return record UUID
```

**Write Frequency:**
- Page 1: 5 writes (form start + 3 section completes + page complete)
- Page 2A: 3 writes (slot selection + contact entry + final submit)
- Page 2B: 2 writes (contact entry + final submit)
- **Total:** 7-8 database writes per complete form submission

---

## Database Schema

### Table: form_sessions

**Primary Table:** Stores all form session data with complete user journey

---

### Column Definitions (35 Total)

#### Core Session Columns (4)

**id**
- Type: `uuid`
- Constraint: PRIMARY KEY
- Default: `gen_random_uuid()`
- Purpose: Unique identifier for database record
- Usage: Auto-generated, never set manually

**session_id**
- Type: `text`
- Constraint: UNIQUE, NOT NULL
- Purpose: User session identifier (manually generated UUID)
- Usage: Generated on form start, used for all upserts
- Example: "abc123-def456-ghi789"

**created_at**
- Type: `timestamp with time zone`
- Default: `now()`
- Purpose: Record creation timestamp
- Usage: Auto-set on INSERT

**updated_at**
- Type: `timestamp with time zone`
- Default: `now()`
- Purpose: Last update timestamp
- Usage: Auto-updated on every UPDATE

---

#### Environment & Config (1)

**environment**
- Type: `text`
- Values: 'stg' | 'prod'
- Purpose: Track which environment form was submitted from
- Source: `VITE_ENVIRONMENT` env variable
- Usage: For separating staging vs production data

---

#### Page 1: Student Information (5)

**form_filler_type**
- Type: `text`
- Values: 'parent' | 'student'
- Nullable: Yes
- Purpose: Who filled the form
- Usage: Critical for lead categorization

**student_name**
- Type: `text`
- Nullable: Yes
- Purpose: Student's full name
- Usage: Personalization, record keeping

**current_grade**
- Type: `text`
- Values: '7_below' | '8' | '9' | '10' | '11' | '12' | 'masters'
- Nullable: Yes
- Purpose: Student's grade level
- Usage: Lead categorization, program eligibility

**location**
- Type: `text`
- Nullable: Yes
- Purpose: City/town/place of residence
- Usage: Geographic analysis

**phone_number**
- Type: `text`
- Nullable: Yes
- Format: Combined country code + number (e.g., "+919876543210")
- Purpose: Parent contact number
- Usage: Follow-up calls

---

#### Page 1: Academic Information (7)

**curriculum_type**
- Type: `text`
- Values: 'IB' | 'IGCSE' | 'CBSE' | 'ICSE' | 'State_Boards' | 'Others'
- Nullable: Yes
- Purpose: Student's education system
- Usage: Academic context

**grade_format**
- Type: `text`
- Values: 'gpa' | 'percentage'
- Nullable: Yes
- Purpose: Which grading system used
- Usage: Determines which score field to check

**gpa_value**
- Type: `text` (stored as text, not numeric)
- Range: "1" to "10"
- Nullable: Yes (null if percentage format)
- Purpose: Student's GPA score
- Usage: Academic performance indicator, spam detection

**percentage_value**
- Type: `text`
- Range: "1" to "100"
- Nullable: Yes (null if GPA format)
- Purpose: Student's percentage score
- Usage: Academic performance indicator, spam detection

**school_name**
- Type: `text`
- Nullable: Yes
- Purpose: Current school name
- Usage: Academic context, prestige analysis

---

#### Page 1: Study Preferences (2)

**scholarship_requirement**
- Type: `text`
- Values: 'scholarship_optional' | 'partial_scholarship' | 'full_scholarship'
- Nullable: Yes
- Purpose: Financial support needed
- Usage: Lead categorization (critical field)

**target_geographies**
- Type: `jsonb` (array)
- Values: Array of strings ['US', 'UK', 'Rest of World', 'Need Guidance']
- Nullable: Yes
- Default: `[]` (empty array)
- Purpose: Preferred study destinations
- Usage: Lead categorization
- Example: `["US", "UK"]`

---

#### Page 2: Parent Contact (2)

**parent_name**
- Type: `text`
- Nullable: Yes (null until Page 2)
- Purpose: Parent's full name
- Usage: Primary contact

**parent_email**
- Type: `text`
- Nullable: Yes (null until Page 2)
- Purpose: Parent's email address
- Usage: Primary contact, confirmation emails
- Note: Frontend field name is `email`, database is `parent_email`

---

#### Page 2A: Counseling Booking (2)

**selected_date**
- Type: `text`
- Format: "Weekday, Month Date, Year" (e.g., "Monday, December 4, 2025")
- Nullable: Yes (null for disqualified leads)
- Purpose: Chosen counseling date
- Usage: Calendar booking

**selected_slot**
- Type: `text`
- Format: Time string (e.g., "10 AM", "3 PM")
- Nullable: Yes (null for disqualified leads)
- Purpose: Chosen counseling time
- Usage: Calendar booking

---

#### System & Tracking Fields (6)

**lead_category**
- Type: `text`
- Values: 'bch' | 'lum-l1' | 'lum-l2' | 'nurture' | 'masters' | 'drop'
- Nullable: Yes (set after Page 1 categorization)
- Purpose: Lead qualification category
- Usage: Routing, prioritization, counselor assignment

**is_counselling_booked**
- Type: `boolean`
- Default: `false`
- Calculated: `true` if selected_date AND selected_slot are not null
- Purpose: Flag for qualified leads who booked
- Usage: Filtering, reporting

**funnel_stage**
- Type: `text`
- Values: See Funnel Stages section
- Default: '01_form_start'
- Purpose: Track user progress through form
- Usage: Funnel analysis, abandonment tracking

**is_qualified_lead**
- Type: `boolean`
- Default: `false`
- Calculated: `true` if lead_category IN ['bch', 'lum-l1', 'lum-l2']
- Purpose: Quick filter for qualified leads
- Usage: Reporting, prioritization

**page_completed**
- Type: `integer`
- Values: 1 | 2
- Default: 1
- Purpose: Track which page user completed
- Usage: Completion analysis

**triggered_events**
- Type: `jsonb` (array)
- Values: Array of Meta Pixel event name strings
- Default: `[]`
- Purpose: Store all Meta Pixel events fired for this session
- Usage: Event audit, debugging, analysis
- Example: `["apply_cta_hero", "apply_prnt_event", "apply_page_1_continue"]`

---

#### UTM Parameters (6)

**utm_source**
- Type: `text`
- Nullable: Yes
- Purpose: Traffic source (e.g., 'facebook', 'google')
- Usage: Attribution

**utm_medium**
- Type: `text`
- Nullable: Yes
- Purpose: Marketing medium (e.g., 'cpc', 'email')
- Usage: Attribution

**utm_campaign**
- Type: `text`
- Nullable: Yes
- Purpose: Campaign name
- Usage: Attribution

**utm_term**
- Type: `text`
- Nullable: Yes
- Purpose: Search term
- Usage: Attribution

**utm_content**
- Type: `text`
- Nullable: Yes
- Purpose: Ad variation
- Usage: Attribution

**utm_id**
- Type: `text`
- Nullable: Yes
- Purpose: Campaign ID
- Usage: Attribution

---

### Database Function: upsert_form_session

**Purpose:** Handle INSERT or UPDATE logic for form sessions with intelligent field merging

**Signature:**
```sql
upsert_form_session(
  p_session_id text,
  p_form_data jsonb
) RETURNS uuid
```

**Parameters:**

**p_session_id** (text):
- The unique session identifier
- Used as conflict key
- Example: "abc-123-def-456"

**p_form_data** (jsonb):
- Complete form data object
- All fields in snake_case
- Can contain null values
- Example:
  ```json
  {
    "session_id": "abc-123",
    "environment": "stg",
    "form_filler_type": "parent",
    "student_name": "John Doe",
    "current_grade": "11",
    ...all other fields
  }
  ```

**Return Value:**
- Type: `uuid`
- The `id` (primary key) of the inserted or updated record

---

### Function Logic

**Step 1: INSERT Attempt**
```sql
INSERT INTO form_sessions (
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
) VALUES (...)
```

**Step 2: ON CONFLICT Handling**
```sql
ON CONFLICT (session_id)
DO UPDATE SET
  environment = COALESCE(EXCLUDED.environment, form_sessions.environment),
  form_filler_type = COALESCE(EXCLUDED.form_filler_type, form_sessions.form_filler_type),
  student_name = COALESCE(EXCLUDED.student_name, form_sessions.student_name),
  [... all fields ...]
  updated_at = now()
```

**COALESCE Logic:**
```
COALESCE(new_value, existing_value)
  - If new_value is NOT NULL → Use new_value
  - If new_value is NULL → Keep existing_value
  - Result: Never overwrites existing data with nulls
```

**Step 3: Return ID**
```sql
RETURNING id INTO v_id
RETURN v_id
```

---

### Field Extraction from JSONB

**Text Fields:**
```sql
p_form_data->>'field_name'
-- Double arrow ->> returns text
-- Example: p_form_data->>'student_name' → "John Doe"
```

**JSONB Fields:**
```sql
p_form_data->'field_name'
-- Single arrow -> returns JSONB
-- Used for: target_geographies, triggered_events
-- Example: p_form_data->'target_geographies' → ["US", "UK"]
```

**Boolean Fields:**
```sql
(p_form_data->>'field_name')::boolean
-- Cast text to boolean
-- Must wrap in COALESCE with default
-- Example: COALESCE((p_form_data->>'is_qualified_lead')::boolean, false)
```

**Integer Fields:**
```sql
(p_form_data->>'field_name')::integer
-- Cast text to integer
-- Must wrap in COALESCE with default
-- Example: COALESCE((p_form_data->>'page_completed')::integer, 1)
```

---

### Database Constraints & Indexes

**Primary Key:**
- Column: `id`
- Type: uuid
- Auto-generated

**Unique Constraint:**
- Column: `session_id`
- Allows upsert logic

**Recommended Indexes:**
```sql
-- Query by session_id (most common)
CREATE INDEX idx_form_sessions_session_id ON form_sessions(session_id);

-- Query by lead_category
CREATE INDEX idx_form_sessions_lead_category ON form_sessions(lead_category);

-- Query by funnel_stage
CREATE INDEX idx_form_sessions_funnel_stage ON form_sessions(funnel_stage);

-- Query by created_at (time-based queries)
CREATE INDEX idx_form_sessions_created_at ON form_sessions(created_at);

-- Query qualified leads
CREATE INDEX idx_form_sessions_is_qualified ON form_sessions(is_qualified_lead);
```

---

## Database Write Operations

### Overview
The form performs **11 database write operations** across the user journey. Each write is an upsert (INSERT or UPDATE) using the same session_id.

---

### Write Operation 1: Form Start

**Trigger:** FormContainer component mounts (useEffect)

**Timing:** Immediate (as soon as form page loads)

**Funnel Stage:** `'01_form_start'`

**Data Included:**
```typescript
{
  session_id: string,           // Generated UUID
  environment: string,           // 'stg' or 'prod'
  funnel_stage: '01_form_start',
  page_completed: 1,
  triggered_events: [],          // Empty initially
  created_at: string (ISO 8601)
}
```

**Function Called:**
```typescript
saveFormDataIncremental(
  sessionId,
  1,                         // Page number
  '01_form_start',           // Funnel stage
  { /* minimal data */ }
)
```

**Purpose:**
- Create initial record for session tracking
- Start funnel analysis
- Enable recovery if user abandons

---

### Write Operation 2: Student Info Complete

**Trigger:** All student info fields filled (useEffect watch)

**Watch Fields:**
- formFillerType
- studentName
- currentGrade
- location
- countryCode
- phoneNumber

**Timing:** When all 6 fields have values

**Funnel Stage:** `'02_page1_student_info_filled'`

**Data Included:**
```typescript
{
  session_id,
  environment,
  form_filler_type: string,
  student_name: string,
  current_grade: string,
  location: string,
  phone_number: string,        // Combined countryCode + phoneNumber
  funnel_stage: '02_page1_student_info_filled',
  page_completed: 1,
  triggered_events: string[],  // Accumulated events
  created_at: string
}
```

**Function Called:**
```typescript
trackFormSection(
  sessionId,
  'student_info_complete',   // Section name
  1,                         // Page number
  fullFormData              // All current form data
)
```

**Implementation:**
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
      phoneNumber: countryCode + phoneNumber
    })
  }
}, [formFillerType, studentName, currentGrade, location, countryCode, phoneNumber])
```

---

### Write Operation 3: Academic Info Complete

**Trigger:** All academic fields filled (useEffect watch)

**Watch Fields:**
- curriculumType
- schoolName
- gradeFormat
- gpaValue OR percentageValue (based on gradeFormat)

**Timing:** When all 4 required fields have values

**Funnel Stage:** `'03_page1_academic_info_filled'`

**Data Included:**
```typescript
{
  ...previous fields from Operation 2,
  curriculum_type: string,
  grade_format: string,
  gpa_value: string | null,
  percentage_value: string | null,
  school_name: string,
  funnel_stage: '03_page1_academic_info_filled',
  triggered_events: string[]
}
```

**Function Called:**
```typescript
trackFormSection(
  sessionId,
  'academic_info_complete',
  1,
  fullFormData
)
```

**Implementation:**
```typescript
useEffect(() => {
  const gradeValueFilled =
    (gradeFormat === 'gpa' && gpaValue) ||
    (gradeFormat === 'percentage' && percentageValue)

  if (curriculumType && schoolName && gradeFormat && gradeValueFilled) {
    trackFormSection(sessionId, 'academic_info_complete', 1, {
      ...storeFormData,
      curriculumType,
      schoolName,
      gradeFormat,
      gpaValue: gradeFormat === 'gpa' ? gpaValue : null,
      percentageValue: gradeFormat === 'percentage' ? percentageValue : null
    })
  }
}, [curriculumType, schoolName, gradeFormat, gpaValue, percentageValue])
```

---

### Write Operation 4: Preferences Complete

**Trigger:** All preference fields filled (useEffect watch)

**Watch Fields:**
- scholarshipRequirement
- targetGeographies (array length > 0)

**Timing:** When both fields have values

**Funnel Stage:** `'04_page1_scholarship_info_filled'`

**Data Included:**
```typescript
{
  ...all previous Page 1 fields,
  scholarship_requirement: string,
  target_geographies: string[],
  funnel_stage: '04_page1_scholarship_info_filled',
  triggered_events: string[]
}
```

**Function Called:**
```typescript
trackFormSection(
  sessionId,
  'preferences_complete',
  1,
  fullFormData
)
```

**Implementation:**
```typescript
useEffect(() => {
  if (scholarshipRequirement && targetGeographies.length > 0) {
    trackFormSection(sessionId, 'preferences_complete', 1, {
      ...storeFormData,
      scholarshipRequirement,
      targetGeographies
    })
  }
}, [scholarshipRequirement, targetGeographies])
```

---

### Write Operation 5: Page 1 Complete

**Trigger:** Continue button clicked AND validation passes

**Timing:** After Zod validation, before lead categorization

**Funnel Stage:** `'05_page1_complete'`

**Data Included:**
```typescript
{
  ...all Page 1 fields (complete),
  lead_category: string,         // Determined by categorization
  is_qualified_lead: boolean,    // Calculated
  funnel_stage: '05_page1_complete',
  page_completed: 1,
  triggered_events: string[],    // Includes page_1_complete events
  utm_source: string | null,
  utm_medium: string | null,
  utm_campaign: string | null,
  utm_term: string | null,
  utm_content: string | null,
  utm_id: string | null
}
```

**Function Called:**
```typescript
trackPageCompletion(
  sessionId,
  1,                         // Page number
  '05_page1_complete',       // Funnel stage
  formDataWithCategory       // Includes lead_category
)
```

**Execution Flow:**
```typescript
1. Validation passes
2. Run lead categorization
3. Update Zustand store with lead_category
4. Fire Meta Pixel events (5-8 events)
5. Add events to triggeredEvents array
6. Save to database with all accumulated data
7. Check routing logic
```

---

### Write Operation 6: Lead Evaluated (Qualified Only)

**Trigger:** After 10-second evaluation animation completes

**Timing:** Before navigating to Page 2A

**Applies To:** BCH, LUM-L1, LUM-L2 leads only

**Funnel Stage:** `'06_lead_evaluated'`

**Data Included:**
```typescript
{
  ...all Page 1 fields,
  lead_category,
  is_qualified_lead: true,
  funnel_stage: '06_lead_evaluated',
  page_completed: 2,             // Entering Page 2
  triggered_events: string[]     // Includes page_2_view events
}
```

**Function Called:**
```typescript
saveFormDataIncremental(
  sessionId,
  2,
  '06_lead_evaluated',
  {
    ...storeFormData,
    triggeredEvents
  }
)
```

**Purpose:**
- Mark transition from Page 1 to Page 2A
- Capture that evaluation happened
- Include page_2_view events

---

### Write Operation 7: Page 2 View (Disqualified Only)

**Trigger:** Navigate to Page 2B (disqualified leads)

**Timing:** When currentStep changes to 2

**Applies To:** NURTURE, MASTERS leads only (not DROP - they submit at Page 1)

**Funnel Stage:** `'07_page_2_view'`

**Data Included:**
```typescript
{
  ...all Page 1 fields,
  lead_category,
  is_qualified_lead: false,
  funnel_stage: '07_page_2_view',
  page_completed: 2,
  triggered_events: string[]     // Includes page_2_view events
}
```

**Function Called:**
```typescript
saveFormDataIncremental(
  sessionId,
  2,
  '07_page_2_view',
  formData
)
```

**Note:** Operations 6 and 7 are mutually exclusive - only one happens per session

---

### Write Operation 8: Counseling Slot Selected (Page 2A Only)

**Trigger:** Both selectedDate AND selectedSlot filled (useEffect watch)

**Timing:** When both booking fields have values

**Applies To:** Qualified leads on Page 2A only

**Funnel Stage:** `'08_page_2_counselling_slot_selected'`

**Data Included:**
```typescript
{
  ...all Page 1 fields,
  selected_date: string,
  selected_slot: string,
  is_counselling_booked: true,    // Calculated
  funnel_stage: '08_page_2_counselling_slot_selected',
  page_completed: 2,
  triggered_events: string[]
}
```

**Function Called:**
```typescript
trackFormSection(
  sessionId,
  'counseling_slot_selected',
  2,
  {
    ...storeFormData,
    selectedDate,
    selectedSlot,
    counselorName,              // Additional tracking
    leadCategory
  }
)
```

**Implementation:**
```typescript
useEffect(() => {
  if (formSelectedDate && selectedSlot) {
    trackFormSection(sessionId, 'counseling_slot_selected', 2, {
      ...storeFormData,
      selectedDate: formSelectedDate,
      selectedSlot,
      counselorName,
      leadCategory
    })
  }
}, [formSelectedDate, selectedSlot])
```

---

### Write Operation 9: Contact Details Entered (Page 2A & 2B)

**Trigger:** Both parentName AND email filled (useEffect watch)

**Timing:** When both contact fields have values

**Applies To:** All Page 2 forms (2A and 2B)

**Funnel Stage:** `'09_page_2_parent_details_filled'`

**Data Included:**
```typescript
{
  ...all previous fields,
  parent_name: string,
  parent_email: string,          // Frontend field: email
  funnel_stage: '09_page_2_parent_details_filled',
  page_completed: 2,
  triggered_events: string[]
}
```

**Function Called:**
```typescript
trackFormSection(
  sessionId,
  'contact_details_entered',     // Or 'contact_details_complete'
  2,
  {
    ...storeFormData,
    parentName,
    email
  }
)
```

**Implementation:**
```typescript
useEffect(() => {
  if (parentName && email) {
    trackFormSection(sessionId, 'contact_details_entered', 2, {
      ...storeFormData,
      parentName,
      email
    })
  }
}, [parentName, email])
```

---

### Write Operation 10: Form Submit

**Trigger:** Submit button clicked on Page 2 AND validation passes

**Timing:** Immediately before webhook submission

**Applies To:** All Page 2 submissions (2A and 2B)

**Funnel Stage:** `'10_form_submit'`

**Data Included:**
```typescript
{
  ...ALL form fields (complete form),
  lead_category,
  is_counselling_booked: boolean,
  is_qualified_lead: boolean,
  funnel_stage: '10_form_submit',
  page_completed: 2,
  triggered_events: string[],    // All accumulated events
  is_final_submission: true,     // Additional flag
  utm_parameters: {...},
  created_at: string,
  updated_at: string
}
```

**Function Called:**
```typescript
trackFormSubmission(
  sessionId,
  completeFormData,
  true                           // isComplete flag
)
```

**Execution Flow:**
```typescript
1. Page 2 validation passes
2. Update store with final data
3. Fire page_2_submit events
4. Fire form_complete events
5. Save to database (funnel_stage: 10_form_submit)
6. Submit to webhook
7. Show success screen
```

---

### Write Operation 11: Immediate Submission (Grade 7/Student)

**Trigger:** Page 1 completion for Grade 7_below OR Student form filler

**Timing:** After lead categorization, instead of navigation to Page 2

**Funnel Stage:** `'10_form_submit'` (skips Page 2)

**Data Included:**
```typescript
{
  ...all Page 1 fields,
  lead_category: 'drop' | 'nurture',
  is_qualified_lead: false,
  funnel_stage: '10_form_submit',
  page_completed: 1,             // Only completed Page 1
  parent_name: null,             // No Page 2 data
  parent_email: null,
  selected_date: null,
  selected_slot: null,
  is_counselling_booked: false,
  triggered_events: string[],    // Includes form_complete events
  is_final_submission: true
}
```

**Function Called:**
```typescript
trackFormSubmission(
  sessionId,
  formData,
  true
)
```

**Purpose:**
- Skip Page 2 for non-viable leads
- Reduce friction and data collection time
- Still capture lead for future nurturing

---

### Database Write Implementation

**Core Function: saveFormDataIncremental**

**Location:** `/src/lib/formTracking.ts`

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
```typescript
1. Calculate is_counselling_booked:
   Boolean(formData.selectedDate && formData.selectedSlot)

2. Calculate is_qualified_lead:
   ['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category)

3. Get UTM parameters from Zustand store

4. Prepare database payload (all snake_case):
   {
     session_id: sessionId,
     environment: VITE_ENVIRONMENT,
     // All form fields in snake_case
     form_filler_type,
     student_name,
     current_grade,
     ...etc,
     // System fields
     lead_category,
     is_counselling_booked,
     funnel_stage,
     is_qualified_lead,
     page_completed: pageNumber,
     triggered_events: formData.triggeredEvents || [],
     // UTM fields
     utm_source,
     utm_medium,
     ...etc,
     created_at: new Date().toISOString()
   }

5. Call Supabase RPC:
   supabase.rpc('upsert_form_session', {
     p_session_id: sessionId,
     p_form_data: dbFormData
   })

6. If RPC fails, fallback to direct upsert:
   supabase.from('form_sessions')
     .upsert([dbFormData], {
       onConflict: 'session_id',
       ignoreDuplicates: false
     })

7. Log success or error
8. Don't throw errors (form should continue even if save fails)
```

**Error Handling:**
```typescript
try {
  // RPC attempt
  const { data, error } = await supabase.rpc(...)
  if (error) throw error
  debugLog('Save successful')
} catch (error) {
  errorLog('RPC failed', error)
  try {
    // Fallback direct upsert
    const { data, error } = await supabase.from(...).upsert(...)
    if (error) throw error
    debugLog('Fallback successful')
  } catch (fallbackError) {
    errorLog('Both methods failed', fallbackError)
    // Don't throw - form continues
  }
}
```

---

## Funnel Stages

### Overview
Funnel stages track user progress through the form with 10 predefined stages plus an abandoned state.

### Stage List (11 Total)

#### 01_form_start
- **Meaning:** User landed on form page, component mounted
- **Data Captured:** Minimal (session_id, environment, start_time)
- **Trigger:** FormContainer mount (useEffect)
- **Next Stage:** 02_page1_student_info_filled

#### 02_page1_student_info_filled
- **Meaning:** Student information section completed
- **Data Captured:** Student info fields (5 fields)
- **Trigger:** All student fields filled (useEffect watch)
- **Next Stage:** 03_page1_academic_info_filled

#### 03_page1_academic_info_filled
- **Meaning:** Academic information section completed
- **Data Captured:** Academic fields (curriculum, school, grades)
- **Trigger:** All academic fields filled (useEffect watch)
- **Next Stage:** 04_page1_scholarship_info_filled

#### 04_page1_scholarship_info_filled
- **Meaning:** Study preferences section completed
- **Data Captured:** Scholarship requirement, target geographies
- **Trigger:** All preference fields filled (useEffect watch)
- **Next Stage:** 05_page1_complete

#### 05_page1_complete
- **Meaning:** Page 1 submitted successfully
- **Data Captured:** All Page 1 fields + lead_category + events
- **Trigger:** Continue button clicked, validation passed
- **Next Stage:** 06_lead_evaluated OR 07_page_2_view OR 10_form_submit

#### 06_lead_evaluated
- **Meaning:** Evaluation animation completed (qualified leads only)
- **Data Captured:** Same as previous + page_2_view events
- **Trigger:** After 10-second animation
- **Applies To:** BCH, LUM-L1, LUM-L2 only
- **Next Stage:** 08_page_2_counselling_slot_selected

#### 07_page_2_view
- **Meaning:** Page 2B loaded (disqualified leads only)
- **Data Captured:** Same as 05 + page_2_view events
- **Trigger:** Navigate to Page 2B
- **Applies To:** NURTURE, MASTERS only
- **Next Stage:** 09_page_2_parent_details_filled

#### 08_page_2_counselling_slot_selected
- **Meaning:** Counseling date and time chosen (qualified only)
- **Data Captured:** selected_date, selected_slot
- **Trigger:** Both booking fields filled
- **Applies To:** Page 2A only
- **Next Stage:** 09_page_2_parent_details_filled

#### 09_page_2_parent_details_filled
- **Meaning:** Parent contact information entered
- **Data Captured:** parent_name, parent_email
- **Trigger:** Both contact fields filled
- **Applies To:** All Page 2 forms (2A and 2B)
- **Next Stage:** 10_form_submit

#### 10_form_submit
- **Meaning:** Form submitted successfully
- **Data Captured:** Complete form + all events
- **Trigger:** Submit button clicked, validation passed, webhook sent
- **Applies To:** All successful submissions
- **Next Stage:** None (terminal state)

#### abandoned
- **Meaning:** User left form without completing
- **Data Captured:** Partial form data, time spent
- **Trigger:** beforeunload or timeout (if implemented)
- **Purpose:** Identify drop-off points for optimization
- **Next Stage:** None (terminal state)

---

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

**Usage:**
```typescript
const trackFormSection = async (
  sessionId: string,
  sectionName: string,
  currentPage: number,
  fullFormData: any
) => {
  const funnelStage = funnelStageMap[sectionName] || '01_form_start'
  await saveFormDataIncremental(sessionId, currentPage, funnelStage, fullFormData)
}
```

---

### Funnel Analysis Queries

**Count leads by stage:**
```sql
SELECT funnel_stage, COUNT(*) as count
FROM form_sessions
GROUP BY funnel_stage
ORDER BY funnel_stage;
```

**Abandonment rate:**
```sql
SELECT
  COUNT(CASE WHEN funnel_stage != '10_form_submit' THEN 1 END)::float /
  COUNT(*)::float * 100 as abandonment_rate
FROM form_sessions
WHERE created_at > '2025-01-01';
```

**Conversion by lead category:**
```sql
SELECT
  lead_category,
  COUNT(*) as total,
  COUNT(CASE WHEN funnel_stage = '10_form_submit' THEN 1 END) as completed,
  COUNT(CASE WHEN funnel_stage = '10_form_submit' THEN 1 END)::float /
    COUNT(*)::float * 100 as completion_rate
FROM form_sessions
WHERE lead_category IS NOT NULL
GROUP BY lead_category;
```

---

## Incremental Save Logic

### Purpose
Save form data progressively as the user completes sections, enabling:
1. Data recovery if browser crashes
2. Funnel drop-off analysis
3. No data loss from abandonment
4. Session continuity

---

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

**Key Points:**
- Watch specific fields that define section completion
- Check ALL required fields are filled
- Include ALL current form data in save (not just new fields)
- Include accumulated triggeredEvents array

---

#### Button Click Handlers

**Pattern:**
```typescript
const handleContinue = async () => {
  // Validation
  const isValid = await validate()
  if (!isValid) return

  // Lead categorization (Page 1 only)
  const category = determineLeadCategory(...)

  // Save to database
  await trackPageCompletion(sessionId, pageNumber, funnelStage, formData)

  // Navigate or submit
  proceedToNextStep()
}
```

**Example - Page 1 Continue:**
```typescript
const handleContinue = async () => {
  setIsSubmitting(true)

  try {
    // Validate
    const result = await handleSubmit(async (data) => {
      // Determine category
      const category = determineLeadCategory(
        data.currentGrade,
        data.formFillerType,
        data.scholarshipRequirement,
        ...other params
      )

      // Update store
      updateFormData({ lead_category: category })

      // Fire events
      const events = fireFormProgressionEvents('page_1_complete', {
        ...data,
        lead_category: category
      })
      addTriggeredEvents(events)

      // Save to DB
      await trackPageCompletion(sessionId, 1, '05_page1_complete', {
        ...data,
        lead_category: category,
        triggeredEvents: [...triggeredEvents, ...events]
      })

      // Route based on category
      if (category === 'drop' || data.formFillerType === 'student') {
        // Immediate submission
        await submitForm()
      } else if (['bch', 'lum-l1', 'lum-l2'].includes(category)) {
        // Show animation, then Page 2A
        showEvaluationAnimation()
      } else {
        // Go to Page 2B
        setStep(2)
      }
    })()
  } finally {
    setIsSubmitting(false)
  }
}
```

---

### Data Accumulation Strategy

**Principle:** Each save includes ALL previously filled data plus new data

**Implementation:**
```typescript
// Get latest state
const { formData, triggeredEvents } = useFormStore.getState().getLatestFormData()

// Merge with new section data
const completeSave = {
  ...formData,              // All previous fields
  newField1: value1,       // New fields from this section
  newField2: value2,
  triggeredEvents: [...triggeredEvents, ...newEvents]  // Accumulated events
}

// Save complete snapshot
await saveFormDataIncremental(sessionId, pageNumber, funnelStage, completeSave)
```

**Why Complete Snapshots:**
- Database upsert handles deduplication automatically
- Ensures no field is lost if save fails
- Makes recovery easier (latest record has all data)
- Simplifies debugging (each record is self-contained)

---

### triggeredEvents Accumulation

**Pattern:**
```typescript
1. Event fires (Meta Pixel)
2. Event name added to Zustand triggeredEvents array
3. triggeredEvents included in every database save
4. Database updates triggered_events JSONB field
```

**Example Flow:**
```typescript
// CTA Click
const events1 = fireCTAClickEvent('hero')  // ['apply_cta_hero']
addTriggeredEvents(events1)
// Store: triggeredEvents = ['apply_cta_hero']

// Save student info
await saveFormData({...data, triggeredEvents})
// DB: triggered_events = ["apply_cta_hero"]

// Page 1 Complete
const events2 = fireFormProgressionEvents('page_1_complete', data)
// Returns: ['apply_prnt_event', 'apply_qualfd_prnt', ...]
addTriggeredEvents(events2)
// Store: triggeredEvents = ['apply_cta_hero', 'apply_prnt_event', ...]

// Save Page 1 complete
await saveFormData({...data, triggeredEvents})
// DB: triggered_events = ["apply_cta_hero", "apply_prnt_event", ...]

// Final submission
// DB: triggered_events = [all 15+ events accumulated]
```

---

### Error Handling in Saves

**Non-Blocking Errors:**
```typescript
try {
  await saveFormDataIncremental(...)
  debugLog('Save successful')
} catch (error) {
  errorLog('Save failed', error)
  // DO NOT throw
  // DO NOT show error to user
  // Form continues normally
}
```

**Rationale:**
- Database saves are for tracking, not critical to user flow
- User should never be blocked by save failures
- Webhook submission at the end is primary data capture
- Failed saves can be investigated via logs

---

## Meta Pixel Event Tracking

### Overview
Comprehensive event tracking for Facebook/Instagram ad optimization using custom Meta Pixel events.

**Total Events:** 35 custom events
**Scope:** Form-related events only (no landing page events beyond CTAs)
**Purpose:** Enable advanced targeting, retargeting, and conversion optimization

---

### Meta Pixel Setup

#### Initialization

**Timing:** App.tsx component mount

**Function:**
```typescript
initializeMetaPixel(): void
```

**Implementation:**
```typescript
1. Get Pixel ID from environment:
   const pixelId = import.meta.env.VITE_META_PIXEL_ID

2. Check if Pixel already initialized:
   if (window.fbq) return

3. Inject Facebook Pixel SDK:
   - Create script element
   - Add Facebook Pixel initialization code
   - Call fbq('init', pixelId)
   - Call fbq('track', 'PageView')
   - Append script to document.head

4. Log initialization:
   debugLog('Meta Pixel initialized with ID:', pixelId)
```

**Script Content:**
```javascript
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
```

---

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

**Example:**
- Event: `apply_page_1_continue`
- Staging: `apply_page_1_continue_stg`
- Production: `apply_page_1_continue_prod`

---

#### Console Logging (Staging Only)

**Implementation:**
```typescript
const trackMetaPixelEvent = (eventName: string, parameters?: object) => {
  const envSuffix = getEnvironmentSuffix()
  const fullEventName = `${eventName}_${envSuffix}`

  if (envSuffix === 'stg') {
    debugLog('🎯 Meta Pixel Event Fired:', {
      eventName: fullEventName,
      parameters: parameters || {},
      timestamp: new Date().toISOString()
    })
  }

  if (window.fbq) {
    window.fbq('trackCustom', fullEventName, parameters || {})
  }
}
```

**Purpose:**
- Debug events in staging without checking Facebook dashboard
- Verify event parameters
- Trace event firing sequence

---

### Event Categories

#### Category 1: CTA Click Events (2 events)

**Event 1: apply_cta_hero**
- **Trigger:** Hero section "Request an Evaluation" button clicked
- **Location:** LandingPage.tsx → handleScrollToForm()
- **Parameters:** None
- **Storage:** Added to triggeredEvents array

**Event 2: apply_cta_header**
- **Trigger:** Header "Request an Evaluation" button clicked
- **Location:** Header.tsx → handleCTAClick()
- **Parameters:** None
- **Storage:** Added to triggeredEvents array

---

#### Category 2: Primary Lead Classification Events (8 events)

**Trigger:** Page 1 Continue button clicked, validation passes

**Function:** `fireLeadClassificationEvents(formData)`

**Logic Tree:**

```
IF formFillerType === 'parent':
  Fire: apply_prnt_event

  Check spam: gpaValue === "10" OR percentageValue === "100"
  IF spam:
    Fire: apply_spam_prnt
  ELSE IF qualified (lead_category IN ['bch', 'lum-l1', 'lum-l2']):
    Fire: apply_qualfd_prnt
  ELSE:
    Fire: apply_disqualfd_prnt

ELSE IF formFillerType === 'student':
  Fire: apply_stdnt

  Check spam: gpaValue === "10" OR percentageValue === "100"
  IF spam:
    Fire: apply_spam_stdnt
  ELSE:
    Simulate qualification as if parent filled:
      simulatedCategory = determineLeadCategory(..., 'parent', ...)

      IF simulatedCategory IN ['bch', 'lum-l1', 'lum-l2']:
        Fire: apply_qualfd_stdnt
      ELSE:
        Fire: apply_disqualfd_stdnt
```

**Events Fired Per Submission:**
- Parent + Spam: 2 events (apply_prnt_event, apply_spam_prnt)
- Parent + Qualified: 2 events (apply_prnt_event, apply_qualfd_prnt)
- Parent + Disqualified: 2 events (apply_prnt_event, apply_disqualfd_prnt)
- Student + Spam: 2 events (apply_stdnt, apply_spam_stdnt)
- Student + Would-Qualify: 2 events (apply_stdnt, apply_qualfd_stdnt)
- Student + Would-Not-Qualify: 2 events (apply_stdnt, apply_disqualfd_stdnt)

**Parameters:** Complete formData object

---

#### Category 3: General Funnel Events (4 events)

**Event: apply_page_1_continue**
- **Trigger:** Page 1 submitted successfully
- **Function:** `firePage1ContinueEvent(formData)`
- **Parameters:** formData
- **Applies To:** ALL leads

**Event: apply_page_2_view**
- **Trigger:** Navigate to Page 2 (2A or 2B)
- **Function:** `firePage2ViewEvent(formData)`
- **Parameters:** formData
- **Applies To:** ALL leads who reach Page 2

**Event: apply_page_2_submit**
- **Trigger:** Submit button clicked on Page 2, validation passes
- **Function:** `firePage2SubmitEvent(formData)`
- **Parameters:** formData
- **Applies To:** ALL Page 2 submissions

**Event: apply_form_complete**
- **Trigger:** Form submission complete (DB + webhook)
- **Function:** `fireFormCompleteEvent(formData)`
- **Parameters:** formData
- **Applies To:** ALL successful submissions

---

#### Category 4: Category-Specific Events (12 events total)

**Pattern:** 4 events per category × 3 categories = 12 events

**BCH Events:**
1. **apply_bch_page_1_continue** - Page 1 complete (BCH only)
2. **apply_bch_page_2_view** - Page 2A loaded (BCH only)
3. **apply_bch_page_2_submit** - Page 2A submitted (BCH only)
4. **apply_bch_form_complete** - Form complete (BCH only)

**LUM-L1 Events:**
1. **apply_lum_l1_page_1_continue**
2. **apply_lum_l1_page_2_view**
3. **apply_lum_l1_page_2_submit**
4. **apply_lum_l1_form_complete**

**LUM-L2 Events:**
1. **apply_lum_l2_page_1_continue**
2. **apply_lum_l2_page_2_view**
3. **apply_lum_l2_page_2_submit**
4. **apply_lum_l2_form_complete**

**Trigger Logic:**
```typescript
fireCategorySpecificEvents(
  eventType: 'page_1_continue' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  leadCategory: string,
  formData: any
): string[]

Logic:
  IF leadCategory IN ['bch', 'lum-l1', 'lum-l2']:
    categoryPrefix = leadCategory.replace('-', '_')  // lum-l1 → lum_l1
    eventName = `apply_${categoryPrefix}_${eventType}`
    trackMetaPixelEvent(eventName, formData)
    return [eventName]
  ELSE:
    return []  // No category-specific event for disqualified leads
```

**Parameters:** formData object

---

#### Category 5: Qualified Lead Funnel Events (8 events total)

**Pattern:** 4 events per filler type × 2 types = 8 events

**Qualified Parent Events:**
1. **apply_qualfd_prnt_page_1_continue**
2. **apply_qualfd_prnt_page_2_view**
3. **apply_qualfd_prnt_page_2_submit**
4. **apply_qualfd_prnt_form_complete**

**Qualified Student Events (Would-Be-Qualified):**
1. **apply_qualfd_stdnt_page_1_continue**
2. **apply_qualfd_stdnt_page_2_view**
3. **apply_qualfd_stdnt_page_2_submit**
4. **apply_qualfd_stdnt_form_complete**

**Trigger Logic:**
```typescript
fireQualifiedLeadEvents(
  eventType: 'page_1_continue' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  formData: any
): string[]

Logic:
  isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category)
  isParent = formData.formFillerType === 'parent'
  isStudent = formData.formFillerType === 'student'

  IF isParent AND isQualified:
    eventName = `apply_qualfd_prnt_${eventType}`
    trackMetaPixelEvent(eventName, formData)
    return [eventName]

  ELSE IF isStudent:
    simulatedCategory = simulateStudentQualification(formData)
    wouldBeQualified = ['bch', 'lum-l1', 'lum-l2'].includes(simulatedCategory)

    IF wouldBeQualified:
      eventName = `apply_qualfd_stdnt_${eventType}`
      trackMetaPixelEvent(eventName, formData)
      return [eventName]

  return []
```

**Parameters:** formData object

---

### Event Firing Sequences

#### Sequence 1: Page 1 Complete (5-8 events)

**Trigger:** Continue button → Validation passes

**Function:** `fireFormProgressionEvents('page_1_complete', formData)`

**Events Fired (in order):**
```typescript
1. Primary Classification Events (2 events)
   - apply_prnt_event OR apply_stdnt
   - apply_spam_prnt OR apply_qualfd_prnt OR apply_disqualfd_prnt
     OR apply_spam_stdnt OR apply_qualfd_stdnt OR apply_disqualfd_stdnt

2. General Funnel Event (1 event)
   - apply_page_1_continue

3. Category-Specific Event (0-1 event)
   - apply_bch_page_1_continue (if BCH)
   - apply_lum_l1_page_1_continue (if LUM-L1)
   - apply_lum_l2_page_1_continue (if LUM-L2)
   - [none] (if disqualified)

4. Qualified Lead Event (0-1 event)
   - apply_qualfd_prnt_page_1_continue (if qualified parent)
   - apply_qualfd_stdnt_page_1_continue (if would-be-qualified student)
   - [none] (if disqualified or spam)
```

**Total:** 3-5 events depending on lead type

---

#### Sequence 2: Page 2 View (1-3 events)

**Trigger:** Navigate to Page 2A or 2B

**Function:** `fireFormProgressionEvents('page_2_view', formData)`

**Events Fired (in order):**
```typescript
1. General Funnel Event (1 event)
   - apply_page_2_view

2. Category-Specific Event (0-1 event)
   - apply_bch_page_2_view (if BCH)
   - apply_lum_l1_page_2_view (if LUM-L1)
   - apply_lum_l2_page_2_view (if LUM-L2)
   - [none] (if disqualified)

3. Qualified Lead Event (0-1 event)
   - apply_qualfd_prnt_page_2_view (if qualified parent)
   - apply_qualfd_stdnt_page_2_view (if would-be-qualified student)
   - [none] (if disqualified)
```

**Total:** 1-3 events depending on lead type

---

#### Sequence 3: Page 2 Submit (1-3 events)

**Trigger:** Submit button → Validation passes

**Function:** `fireFormProgressionEvents('page_2_submit', formData)`

**Events Fired (in order):**
```typescript
1. General Funnel Event (1 event)
   - apply_page_2_submit

2. Category-Specific Event (0-1 event)
   - apply_bch_page_2_submit (if BCH)
   - apply_lum_l1_page_2_submit (if LUM-L1)
   - apply_lum_l2_page_2_submit (if LUM-L2)
   - [none] (if disqualified)

3. Qualified Lead Event (0-1 event)
   - apply_qualfd_prnt_page_2_submit (if qualified parent)
   - apply_qualfd_stdnt_page_2_submit (if would-be-qualified student)
   - [none] (if disqualified)
```

**Total:** 1-3 events depending on lead type

---

#### Sequence 4: Form Complete (1-3 events)

**Trigger:** Database write + webhook submission complete

**Function:** `fireFormProgressionEvents('form_complete', formData)`

**Events Fired (in order):**
```typescript
1. General Funnel Event (1 event)
   - apply_form_complete

2. Category-Specific Event (0-1 event)
   - apply_bch_form_complete (if BCH)
   - apply_lum_l1_form_complete (if LUM-L1)
   - apply_lum_l2_form_complete (if LUM-L2)
   - [none] (if disqualified)

3. Qualified Lead Event (0-1 event)
   - apply_qualfd_prnt_form_complete (if qualified parent)
   - apply_qualfd_stdnt_form_complete (if would-be-qualified student)
   - [none] (if disqualified)
```

**Total:** 1-3 events depending on lead type

---

### Complete Event Flow Examples

#### Example 1: Qualified Parent (BCH)

**User Journey:**
1. Clicks hero CTA
2. Completes Page 1 (qualified as BCH)
3. Views Page 2A
4. Submits Page 2A

**Events Fired:**

**CTA Click (1 event):**
- apply_cta_hero_stg

**Page 1 Complete (5 events):**
- apply_prnt_event_stg
- apply_qualfd_prnt_stg
- apply_page_1_continue_stg
- apply_bch_page_1_continue_stg
- apply_qualfd_prnt_page_1_continue_stg

**Page 2 View (3 events):**
- apply_page_2_view_stg
- apply_bch_page_2_view_stg
- apply_qualfd_prnt_page_2_view_stg

**Page 2 Submit (3 events):**
- apply_page_2_submit_stg
- apply_bch_page_2_submit_stg
- apply_qualfd_prnt_page_2_submit_stg

**Form Complete (3 events):**
- apply_form_complete_stg
- apply_bch_form_complete_stg
- apply_qualfd_prnt_form_complete_stg

**Total: 15 events**

---

#### Example 2: Disqualified Parent (NURTURE)

**User Journey:**
1. Clicks header CTA
2. Completes Page 1 (categorized as NURTURE)
3. Views Page 2B
4. Submits Page 2B

**Events Fired:**

**CTA Click (1 event):**
- apply_cta_header_stg

**Page 1 Complete (3 events):**
- apply_prnt_event_stg
- apply_disqualfd_prnt_stg
- apply_page_1_continue_stg

**Page 2 View (1 event):**
- apply_page_2_view_stg

**Page 2 Submit (1 event):**
- apply_page_2_submit_stg

**Form Complete (1 event):**
- apply_form_complete_stg

**Total: 7 events**

---

#### Example 3: Student (Would-Be-Qualified)

**User Journey:**
1. Completes Page 1 as student (immediate submission)

**Events Fired:**

**Page 1 Complete (4 events):**
- apply_stdnt_stg
- apply_qualfd_stdnt_stg  (simulated qualification)
- apply_page_1_continue_stg
- apply_qualfd_stdnt_page_1_continue_stg

**Form Complete (2 events):**
- apply_form_complete_stg
- apply_qualfd_stdnt_form_complete_stg

**Total: 6 events**

---

### Event Storage & Retrieval

**Storage Flow:**
```typescript
1. Event fires → Meta Pixel tracks
2. Event name (without suffix) added to Zustand triggeredEvents array
3. triggeredEvents included in every database save
4. Database stores in triggered_events JSONB column
5. Webhook submission includes triggered_events in payload
```

**Retrieval:**
```sql
-- Get all events for a session
SELECT triggered_events
FROM form_sessions
WHERE session_id = 'abc-123';

-- Count leads by event
SELECT event, COUNT(DISTINCT session_id) as lead_count
FROM form_sessions,
     jsonb_array_elements_text(triggered_events) as event
GROUP BY event
ORDER BY lead_count DESC;

-- Find leads who saw page 2 but didn't submit
SELECT session_id, lead_category
FROM form_sessions
WHERE triggered_events @> '["apply_page_2_view"]'
  AND NOT triggered_events @> '["apply_form_complete"]';
```

---

### Event Parameters

**All events receive formData as parameters:**
```typescript
{
  // Page 1 fields
  formFillerType: string,
  studentName: string,
  currentGrade: string,
  location: string,
  phoneNumber: string,
  curriculumType: string,
  gradeFormat: string,
  gpaValue: string | undefined,
  percentageValue: string | undefined,
  schoolName: string,
  scholarshipRequirement: string,
  targetGeographies: string[],

  // Page 2 fields (if applicable)
  parentName: string | undefined,
  email: string | undefined,
  selectedDate: string | undefined,
  selectedSlot: string | undefined,

  // System fields
  lead_category: string,
  sessionId: string,

  // UTM parameters
  utmParameters: {
    utm_source: string | undefined,
    utm_medium: string | undefined,
    ...
  }
}
```

**Usage by Meta Pixel:**
- Create custom audiences based on field values
- Set up dynamic retargeting
- Optimize for specific lead categories
- Track conversion paths

---

## Webhook Integration

### Purpose
Send complete form data to Make.com webhook for:
- CRM integration
- Email automation
- Further data processing
- Backup data capture

---

### Webhook Configuration

**URL Source:** Environment variable
```
VITE_REGISTRATION_WEBHOOK_URL=https://hook.us2.make.com/...
```

**Method:** POST

**Content-Type:** application/json

**Timing:** After final database write, before success screen

---

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

---

### Webhook Submission Logic

**Function:** `submitFormData()`

**Location:** `/src/lib/form.ts`

**Implementation:**
```typescript
1. Get webhook URL from environment
   IF not configured: throw error

2. Get UTM parameters from Zustand store

3. Calculate derived fields:
   - is_qualified_lead = ['bch', 'lum-l1', 'lum-l2'].includes(lead_category)
   - is_counselling_booked = Boolean(selectedDate && selectedSlot)

4. Validate lead_category:
   - Sanitize value (ensure it's valid)
   - Log if invalid
   - Continue anyway (don't block submission)

5. Build payload (all snake_case):
   {
     session_id,
     environment,
     // All form fields mapped to snake_case
     form_filler_type: formFillerType,
     student_name: studentName,
     ...etc,
     // System fields
     lead_category,
     is_counselling_booked,
     is_qualified_lead,
     page_completed,
     triggered_events,
     // UTM fields
     utm_source,
     ...etc,
     created_at: new Date().toISOString()
   }

6. Submit via fetch:
   fetch(webhookUrl, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
   })

7. Handle response:
   IF response.ok:
     debugLog('Webhook submission successful')
     return response
   ELSE:
     errorLog('Webhook submission failed', status, error)
     throw error (but catch in caller, don't block user)
```

---

### Error Handling

**Non-Blocking Errors:**
```typescript
try {
  const response = await submitFormData(...)
  // Success
} catch (error) {
  errorLog('Webhook submission failed:', error)
  // DO NOT show error to user
  // DO NOT block success screen
  // User sees success even if webhook fails
}
```

**Rationale:**
- Webhook is for integration, not critical to user experience
- Database save is primary source of truth
- User should see success if they completed form correctly
- Failed webhooks can be retried manually from database records

---

### Webhook Response Handling

**Expected Response:**
- Status: 200 OK
- Body: Not used (webhook can return anything)

**Error Responses:**
- Any non-200 status triggers error logging
- Error message includes status code and response text
- Form still proceeds to success screen

---

## Field Mapping Reference

### Frontend ↔ Database Field Names

**All database/webhook fields use snake_case. Frontend uses camelCase.**

| Frontend (camelCase) | Database (snake_case) | Type | Notes |
|---------------------|----------------------|------|-------|
| formFillerType | form_filler_type | text | 'parent' or 'student' |
| studentName | student_name | text | |
| currentGrade | current_grade | text | '7_below' to 'masters' |
| location | location | text | |
| countryCode | [combined] | text | Combined into phone_number |
| phoneNumber | phone_number | text | Combined with countryCode |
| curriculumType | curriculum_type | text | |
| gradeFormat | grade_format | text | 'gpa' or 'percentage' |
| gpaValue | gpa_value | text | |
| percentageValue | percentage_value | text | |
| schoolName | school_name | text | |
| scholarshipRequirement | scholarship_requirement | text | |
| targetGeographies | target_geographies | jsonb | Array of strings |
| parentName | parent_name | text | |
| email | parent_email | text | **Field name changes** |
| selectedDate | selected_date | text | |
| selectedSlot | selected_slot | text | |
| lead_category | lead_category | text | Same name |
| sessionId | session_id | text | |

---

### Special Field Handling

**Phone Number:**
- Frontend: Two separate fields (countryCode, phoneNumber)
- Storage: One combined string
- Example: countryCode="+91", phoneNumber="9876543210" → phone_number="+919876543210"
- No separation on retrieval (stored as-is)

**Email:**
- Frontend field name: `email`
- Database field name: `parent_email`
- Webhook field name: `parent_email`
- Reason: Database schema predates frontend implementation

**Target Geographies:**
- Frontend: Array of strings (JavaScript)
- Database: JSONB array (PostgreSQL)
- Example: `['US', 'UK']` stored as JSONB array

**Triggered Events:**
- Frontend: Array of strings (Zustand state)
- Database: JSONB array (PostgreSQL)
- Accumulates throughout session
- Example: `['apply_cta_hero', 'apply_prnt_event', ...]`

---

### Calculated Fields

**These fields are calculated, never set directly by user:**

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

### Default Values

**Fields with defaults in database:**

- **environment:** No default (must be provided)
- **is_counselling_booked:** false
- **is_qualified_lead:** false
- **page_completed:** 1
- **funnel_stage:** '01_form_start' (on INSERT)
- **target_geographies:** `[]` (empty array)
- **triggered_events:** `[]` (empty array)
- **countryCode:** "+91" (frontend only)
- **gradeFormat:** 'gpa' (frontend only)

---

### Nullable vs Required

**Always Required (NOT NULL in DB):**
- id (auto-generated)
- session_id
- created_at
- updated_at

**Nullable (can be NULL):**
- All form fields (user may not complete)
- All UTM parameters
- parent_name, parent_email (until Page 2)
- selected_date, selected_slot (disqualified leads)

**Validation Requirement vs Database:**
- Form validation requires fields for submission
- Database allows nulls for partial saves
- This enables incremental saves

---

## Implementation Checklist

### Database Setup
- [ ] Create Supabase project and get credentials
- [ ] Create form_sessions table with all 35 columns
- [ ] Set up primary key (id) and unique constraint (session_id)
- [ ] Create upsert_form_session function with COALESCE logic
- [ ] Add recommended indexes for performance
- [ ] Test upsert function with sample data

### Database Integration
- [ ] Install @supabase/supabase-js package
- [ ] Create database.ts with Supabase client
- [ ] Implement connection testing function
- [ ] Create formTracking.ts with save functions
- [ ] Implement saveFormDataIncremental with RPC call
- [ ] Add fallback direct upsert on RPC failure
- [ ] Add error handling (non-blocking)

### Incremental Saves
- [ ] Add useEffect watchers for each section
- [ ] Implement trackFormSection function
- [ ] Add trackPageCompletion for page transitions
- [ ] Add trackFormSubmission for final submit
- [ ] Test each save trigger point
- [ ] Verify COALESCE behavior (no data overwrites)

### Funnel Stages
- [ ] Define FunnelStage type with 11 stages
- [ ] Create stage mapping object
- [ ] Implement funnel_stage setting in each save
- [ ] Add abandonment tracking (optional)
- [ ] Create funnel analysis queries

### Meta Pixel Setup
- [ ] Get Meta Pixel ID from Facebook
- [ ] Add VITE_META_PIXEL_ID to environment
- [ ] Create metaPixelEvents.ts
- [ ] Implement initializeMetaPixel function
- [ ] Add environment suffix logic
- [ ] Add console logging for staging
- [ ] Call initialization in App.tsx mount

### Meta Pixel Events
- [ ] Implement all 35 event functions
- [ ] Add spam detection logic
- [ ] Add student simulation logic
- [ ] Create fireFormProgressionEvents orchestrator
- [ ] Test event firing at each trigger point
- [ ] Verify events added to triggeredEvents array
- [ ] Verify events saved to database
- [ ] Check Facebook Events Manager for event receipt

### Webhook Integration
- [ ] Get webhook URL from Make.com
- [ ] Add VITE_REGISTRATION_WEBHOOK_URL to environment
- [ ] Create submitFormData function in form.ts
- [ ] Build complete payload (snake_case)
- [ ] Implement fetch with error handling
- [ ] Test webhook with staging environment
- [ ] Verify data received in Make.com
- [ ] Add non-blocking error handling

### Field Mapping
- [ ] Document all field name transformations
- [ ] Implement phone number combining
- [ ] Handle email → parent_email mapping
- [ ] Convert arrays to JSONB format
- [ ] Calculate derived fields (is_qualified_lead, etc.)
- [ ] Test field mapping in both directions

### Testing & Verification
- [ ] Test complete qualified lead flow (BCH)
- [ ] Test complete disqualified lead flow (NURTURE)
- [ ] Test student immediate submission
- [ ] Test Grade 7 immediate submission
- [ ] Verify all 10 funnel stages saved correctly
- [ ] Verify all Meta Pixel events fire
- [ ] Check database records for completeness
- [ ] Verify webhook payload correctness
- [ ] Test error recovery (database/webhook failures)
- [ ] Test with real Meta Pixel ID in staging

---

**END OF DATA PERSISTENCE & EVENT TRACKING GUIDE**

This document provides complete specifications for implementing database writes, funnel tracking, and Meta Pixel event tracking. Refer to the companion document "Form Flow & Implementation Guide" for UI and form logic details.
