# Database Schema Documentation

**Version:** 2.0
**Last Updated:** 2025-12-04
**Purpose:** Complete database schema specification for exact replication

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Table: form_sessions](#table-form_sessions)
3. [Database Function: upsert_form_session](#database-function-upsert_form_session)
4. [Indexes](#indexes)
5. [Example Queries](#example-queries)

---

## Database Overview

### Platform
**Supabase** (PostgreSQL)

### Connection
- **Library:** @supabase/supabase-js
- **Environment Variables:**
  - `VITE_SUPABASE_URL` - Project URL
  - `VITE_SUPABASE_ANON_KEY` - Public anon key

### Tables
- `form_sessions` - Main table storing all form submissions and progress

### Functions
- `upsert_form_session(p_session_id text, p_form_data jsonb)` - Insert or update form data

---

## Table: form_sessions

### Table Purpose
Stores complete form session data including:
- User progress through form funnel
- All form field values
- Lead categorization
- Meta Pixel event tracking
- UTM parameters

### Table Definition

```sql
CREATE TABLE public.form_sessions (
  -- Primary Key & Session
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Environment
  environment text,

  -- Page 1: Student Information
  form_filler_type text,
  student_name text,
  current_grade text,
  location text,
  phone_number text,

  -- Page 1: Academic Information
  curriculum_type text,
  grade_format text,
  gpa_value text,
  percentage_value text,
  school_name text,

  -- Page 1: Study Preferences
  scholarship_requirement text,
  target_geographies jsonb DEFAULT '[]'::jsonb,

  -- Page 2: Parent Contact
  parent_name text,
  parent_email text,

  -- Page 2A: Counseling Booking
  selected_date text,
  selected_slot text,

  -- System & Tracking Fields
  lead_category text,
  is_counselling_booked boolean DEFAULT false,
  funnel_stage text DEFAULT '01_form_start',
  is_qualified_lead boolean DEFAULT false,
  page_completed integer DEFAULT 1,
  triggered_events jsonb DEFAULT '[]'::jsonb,

  -- UTM Parameters
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  utm_id text
);
```

---

### Column Specifications

#### Core Columns

**id**
- Type: `uuid`
- Constraint: `PRIMARY KEY`
- Default: `gen_random_uuid()`
- Purpose: Unique record identifier
- Usage: Auto-generated, never set manually

**session_id**
- Type: `text`
- Constraint: `UNIQUE NOT NULL`
- Purpose: User session tracking across multiple saves
- Usage: Generated as UUID on form start (crypto.randomUUID())
- Example: `"abc123-def456-ghi789-jkl012"`

**created_at**
- Type: `timestamptz` (timestamp with timezone)
- Default: `now()`
- Purpose: Record creation time
- Usage: Auto-set on INSERT

**updated_at**
- Type: `timestamptz`
- Default: `now()`
- Purpose: Last modification time
- Usage: Updated on every UPDATE

---

#### Environment

**environment**
- Type: `text`
- Constraint: Nullable
- Values: `'stg'` | `'prod'`
- Purpose: Track environment for data segmentation
- Source: `VITE_ENVIRONMENT` environment variable

---

#### Page 1: Student Information

**form_filler_type**
- Type: `text`
- Constraint: Nullable
- Values: `'parent'` | `'student'`
- Purpose: Identify who filled the form
- Critical: Used in lead categorization

**student_name**
- Type: `text`
- Constraint: Nullable
- Purpose: Student's full name
- Example: `"John Doe"`

**current_grade**
- Type: `text`
- Constraint: Nullable
- Values: `'7_below'` | `'8'` | `'9'` | `'10'` | `'11'` | `'12'` | `'masters'`
- Purpose: Student's current grade level
- Critical: Used in lead categorization

**location**
- Type: `text`
- Constraint: Nullable
- Purpose: City/town/place of residence
- Example: `"Mumbai"`, `"London"`

**phone_number**
- Type: `text`
- Constraint: Nullable
- Format: Combined country code + number
- Example: `"+919876543210"`
- Note: Frontend has separate fields (countryCode, phoneNumber), combined before storage

---

#### Page 1: Academic Information

**curriculum_type**
- Type: `text`
- Constraint: Nullable
- Values: `'IB'` | `'IGCSE'` | `'CBSE'` | `'ICSE'` | `'State_Boards'` | `'Others'`
- Purpose: Student's education system

**grade_format**
- Type: `text`
- Constraint: Nullable
- Values: `'gpa'` | `'percentage'`
- Purpose: Grading system used

**gpa_value**
- Type: `text` (not numeric to preserve input)
- Constraint: Nullable
- Range: `"1"` to `"10"`
- Purpose: Student's GPA score
- Note: NULL if grade_format is 'percentage'
- Spam Detection: Value of `"10"` triggers nurture categorization

**percentage_value**
- Type: `text`
- Constraint: Nullable
- Range: `"1"` to `"100"`
- Purpose: Student's percentage score
- Note: NULL if grade_format is 'gpa'
- Spam Detection: Value of `"100"` triggers nurture categorization

**school_name**
- Type: `text`
- Constraint: Nullable
- Purpose: Current school name
- Example: `"Delhi Public School"`

---

#### Page 1: Study Preferences

**scholarship_requirement**
- Type: `text`
- Constraint: Nullable
- Values: `'scholarship_optional'` | `'partial_scholarship'` | `'full_scholarship'`
- Purpose: Financial support needed
- Critical: Used in lead categorization

**target_geographies**
- Type: `jsonb` (array)
- Constraint: Nullable
- Default: `'[]'::jsonb`
- Values: Array containing `'US'` | `'UK'` | `'Rest of World'` | `'Need Guidance'`
- Purpose: Preferred study destinations
- Example: `["US", "UK"]`
- Critical: Used in lead categorization

---

#### Page 2: Parent Contact

**parent_name**
- Type: `text`
- Constraint: Nullable (NULL until Page 2)
- Purpose: Parent's full name
- Example: `"Jane Doe"`

**parent_email**
- Type: `text`
- Constraint: Nullable (NULL until Page 2)
- Purpose: Parent's email address
- Example: `"jane@example.com"`
- Note: Frontend field name is `email`, database is `parent_email`

---

#### Page 2A: Counseling Booking (Qualified Leads Only)

**selected_date**
- Type: `text`
- Constraint: Nullable (NULL for disqualified leads)
- Format: `"Weekday, Month Date, Year"`
- Example: `"Monday, December 4, 2025"`
- Purpose: Chosen counseling date

**selected_slot**
- Type: `text`
- Constraint: Nullable (NULL for disqualified leads)
- Format: Time string
- Values: `"10 AM"`, `"11 AM"`, ..., `"8 PM"` (excluding `"2 PM"`)
- Purpose: Chosen counseling time

---

#### System & Tracking Fields

**lead_category**
- Type: `text`
- Constraint: Nullable (set after Page 1 categorization)
- Values: `'bch'` | `'lum-l1'` | `'lum-l2'` | `'nurture'` | `'masters'` | `'drop'`
- Purpose: Lead qualification category
- Usage: Routing, prioritization, counselor assignment

**is_counselling_booked**
- Type: `boolean`
- Constraint: NOT NULL
- Default: `false`
- Purpose: Quick filter for booked counseling sessions
- Calculation: `true` if selected_date AND selected_slot are not NULL

**funnel_stage**
- Type: `text`
- Constraint: Nullable
- Default: `'01_form_start'`
- Values: See Funnel Stages section below
- Purpose: Track user progress through form

**is_qualified_lead**
- Type: `boolean`
- Constraint: NOT NULL
- Default: `false`
- Purpose: Quick filter for qualified leads
- Calculation: `true` if lead_category IN `['bch', 'lum-l1', 'lum-l2']`

**page_completed**
- Type: `integer`
- Constraint: NOT NULL
- Default: `1`
- Values: `1` | `2`
- Purpose: Highest page number completed

**triggered_events**
- Type: `jsonb` (array)
- Constraint: Nullable
- Default: `'[]'::jsonb`
- Purpose: Store all Meta Pixel events fired for this session
- Example: `["apply_cta_hero", "apply_prnt_event", "apply_page_1_continue"]`
- Usage: Event audit, debugging, analysis

---

#### UTM Parameters

**utm_source**
- Type: `text`
- Constraint: Nullable
- Purpose: Traffic source (e.g., 'facebook', 'google')

**utm_medium**
- Type: `text`
- Constraint: Nullable
- Purpose: Marketing medium (e.g., 'cpc', 'email')

**utm_campaign**
- Type: `text`
- Constraint: Nullable
- Purpose: Campaign name

**utm_term**
- Type: `text`
- Constraint: Nullable
- Purpose: Search term

**utm_content**
- Type: `text`
- Constraint: Nullable
- Purpose: Ad variation

**utm_id**
- Type: `text`
- Constraint: Nullable
- Purpose: Campaign ID

---

### Funnel Stages

Valid values for `funnel_stage` column:

1. `'01_form_start'` - Form loaded, component mounted
2. `'02_page1_student_info_filled'` - Student info section complete
3. `'03_page1_academic_info_filled'` - Academic info section complete
4. `'04_page1_scholarship_info_filled'` - Preferences section complete
5. `'05_page1_complete'` - Page 1 submitted successfully
6. `'06_lead_evaluated'` - Evaluation animation complete (qualified only)
7. `'07_page_2_view'` - Page 2B loaded (disqualified only)
8. `'08_page_2_counselling_slot_selected'` - Counseling booking chosen (qualified only)
9. `'09_page_2_parent_details_filled'` - Parent contact info entered
10. `'10_form_submit'` - Form submitted successfully
11. `'abandoned'` - User left without completing (optional)

---

## Database Function: upsert_form_session

### Purpose
Handle INSERT or UPDATE operations with intelligent field merging using COALESCE logic.

### Function Definition

```sql
CREATE OR REPLACE FUNCTION public.upsert_form_session(
  p_session_id text,
  p_form_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Insert or update the form session
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
    COALESCE(p_form_data->>'funnel_stage', '01_form_start'),
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
$$;
```

---

### Function Parameters

**p_session_id** (text)
- User's unique session identifier
- Used as conflict key for upsert
- Example: `"abc-123-def-456"`

**p_form_data** (jsonb)
- Complete form data object
- All fields in snake_case
- Can contain NULL values for fields not yet filled
- Example:
  ```json
  {
    "session_id": "abc-123",
    "environment": "stg",
    "form_filler_type": "parent",
    "student_name": "John Doe",
    "current_grade": "11",
    "location": "Mumbai",
    "phone_number": "+919876543210",
    "curriculum_type": "IB",
    "grade_format": "gpa",
    "gpa_value": "8.5",
    "percentage_value": null,
    "school_name": "Delhi Public School",
    "scholarship_requirement": "scholarship_optional",
    "target_geographies": ["US", "UK"],
    "parent_name": null,
    "parent_email": null,
    "selected_date": null,
    "selected_slot": null,
    "lead_category": "bch",
    "is_counselling_booked": false,
    "funnel_stage": "05_page1_complete",
    "is_qualified_lead": true,
    "page_completed": 1,
    "triggered_events": ["apply_cta_hero", "apply_prnt_event"],
    "utm_source": "facebook",
    "utm_medium": "cpc",
    "utm_campaign": "winter",
    "utm_term": null,
    "utm_content": null,
    "utm_id": null
  }
  ```

---

### Function Behavior

**INSERT (New Session):**
- Extracts all fields from JSONB
- Creates new record with session_id
- Sets defaults for boolean/integer fields using COALESCE
- Returns newly created record's id (uuid)

**UPDATE (Existing Session):**
- Matches on session_id (UNIQUE constraint)
- Uses COALESCE to preserve existing non-NULL values
- Only updates fields that have new non-NULL values
- Updates updated_at timestamp
- Returns existing record's id (uuid)

**COALESCE Logic:**
```
COALESCE(new_value, existing_value)
  - If new_value is NOT NULL → Use new_value
  - If new_value is NULL → Keep existing_value
  - Result: Never overwrites existing data with nulls
```

**Example:**
```
Existing record: { student_name: "John Doe", phone_number: "+919876543210" }
New save: { student_name: "John Doe", phone_number: null, location: "Mumbai" }
Result: { student_name: "John Doe", phone_number: "+919876543210", location: "Mumbai" }
```

---

### JSONB Field Extraction

**Text Fields (->>'field_name'):**
```sql
p_form_data->>'student_name'
-- Double arrow returns text
-- Result: "John Doe"
```

**JSONB Fields (->'field_name'):**
```sql
p_form_data->'target_geographies'
-- Single arrow returns JSONB
-- Result: ["US", "UK"] as JSONB
-- Used for: target_geographies, triggered_events
```

**Boolean Fields (Cast + COALESCE):**
```sql
COALESCE((p_form_data->>'is_qualified_lead')::boolean, false)
-- 1. Extract as text: ->>'is_qualified_lead'
-- 2. Cast to boolean: ::boolean
-- 3. Default to false if NULL: COALESCE(..., false)
```

**Integer Fields (Cast + COALESCE):**
```sql
COALESCE((p_form_data->>'page_completed')::integer, 1)
-- 1. Extract as text
-- 2. Cast to integer
-- 3. Default to 1 if NULL
```

---

### Function Call Example

**From Application:**
```typescript
const { data, error } = await supabase.rpc('upsert_form_session', {
  p_session_id: sessionId,
  p_form_data: {
    session_id: sessionId,
    environment: 'stg',
    form_filler_type: 'parent',
    student_name: 'John Doe',
    current_grade: '11',
    // ... all other fields
  }
})

if (error) {
  console.error('RPC failed:', error)
} else {
  console.log('Saved with ID:', data)
}
```

**Fallback Direct Upsert (if RPC fails):**
```typescript
const { data, error } = await supabase
  .from('form_sessions')
  .upsert([formData], {
    onConflict: 'session_id',
    ignoreDuplicates: false
  })
  .select()
```

---

## Indexes

### Recommended Indexes

**Performance optimization for common queries:**

```sql
-- Primary lookup by session_id (most common query)
CREATE INDEX IF NOT EXISTS idx_form_sessions_session_id
ON form_sessions(session_id);

-- Filter by lead category
CREATE INDEX IF NOT EXISTS idx_form_sessions_lead_category
ON form_sessions(lead_category);

-- Filter by funnel stage (for funnel analysis)
CREATE INDEX IF NOT EXISTS idx_form_sessions_funnel_stage
ON form_sessions(funnel_stage);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_form_sessions_created_at
ON form_sessions(created_at DESC);

-- Filter qualified leads
CREATE INDEX IF NOT EXISTS idx_form_sessions_is_qualified
ON form_sessions(is_qualified_lead)
WHERE is_qualified_lead = true;

-- Filter counseling bookings
CREATE INDEX IF NOT EXISTS idx_form_sessions_is_booked
ON form_sessions(is_counselling_booked)
WHERE is_counselling_booked = true;

-- Environment-based queries
CREATE INDEX IF NOT EXISTS idx_form_sessions_environment
ON form_sessions(environment);
```

---

## Example Queries

### Common Query Patterns

**Get session data:**
```sql
SELECT * FROM form_sessions
WHERE session_id = 'abc-123-def-456';
```

**Get all qualified leads:**
```sql
SELECT session_id, student_name, lead_category, created_at
FROM form_sessions
WHERE is_qualified_lead = true
ORDER BY created_at DESC;
```

**Count leads by category:**
```sql
SELECT lead_category, COUNT(*) as count
FROM form_sessions
WHERE lead_category IS NOT NULL
GROUP BY lead_category
ORDER BY count DESC;
```

**Funnel conversion rate:**
```sql
SELECT
  COUNT(*) as total_starts,
  COUNT(CASE WHEN funnel_stage = '10_form_submit' THEN 1 END) as completions,
  ROUND(
    COUNT(CASE WHEN funnel_stage = '10_form_submit' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as completion_rate_percent
FROM form_sessions
WHERE created_at >= '2025-01-01';
```

**Drop-off analysis:**
```sql
SELECT
  funnel_stage,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM form_sessions
WHERE funnel_stage != '10_form_submit'
GROUP BY funnel_stage
ORDER BY count DESC;
```

**Counseling bookings today:**
```sql
SELECT
  session_id,
  student_name,
  parent_name,
  parent_email,
  selected_date,
  selected_slot,
  lead_category
FROM form_sessions
WHERE is_counselling_booked = true
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

**UTM attribution:**
```sql
SELECT
  utm_source,
  utm_medium,
  COUNT(*) as leads,
  COUNT(CASE WHEN is_qualified_lead THEN 1 END) as qualified_leads,
  ROUND(
    COUNT(CASE WHEN is_qualified_lead THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as qualification_rate
FROM form_sessions
WHERE utm_source IS NOT NULL
GROUP BY utm_source, utm_medium
ORDER BY leads DESC;
```

**Events analysis:**
```sql
-- Get all unique events fired
SELECT DISTINCT jsonb_array_elements_text(triggered_events) as event
FROM form_sessions
WHERE triggered_events IS NOT NULL
ORDER BY event;

-- Count sessions by event
SELECT
  jsonb_array_elements_text(triggered_events) as event,
  COUNT(DISTINCT session_id) as session_count
FROM form_sessions
WHERE triggered_events IS NOT NULL
GROUP BY event
ORDER BY session_count DESC;

-- Find incomplete journeys
SELECT
  session_id,
  lead_category,
  funnel_stage,
  triggered_events
FROM form_sessions
WHERE triggered_events @> '["apply_page_2_view"]'::jsonb
  AND NOT triggered_events @> '["apply_form_complete"]'::jsonb;
```

---

## Row Level Security (RLS)

### Note on Security

**Current Setup:**
- RLS is NOT enabled on form_sessions table
- Table is accessible via anon key (public access)
- This is intentional for client-side form submissions

**If RLS Required:**
```sql
-- Enable RLS
ALTER TABLE form_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts (form submissions)
CREATE POLICY "Allow public form submissions"
ON form_sessions
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role full access"
ON form_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: No public reads (admin only)
-- (No policy = no access for anon role)
```

---

## Migration Script

### Complete Migration

```sql
-- Create table
CREATE TABLE IF NOT EXISTS public.form_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  environment text,
  form_filler_type text,
  student_name text,
  current_grade text,
  location text,
  phone_number text,
  curriculum_type text,
  grade_format text,
  gpa_value text,
  percentage_value text,
  school_name text,
  scholarship_requirement text,
  target_geographies jsonb DEFAULT '[]'::jsonb,
  parent_name text,
  parent_email text,
  selected_date text,
  selected_slot text,
  lead_category text,
  is_counselling_booked boolean DEFAULT false,
  funnel_stage text DEFAULT '01_form_start',
  is_qualified_lead boolean DEFAULT false,
  page_completed integer DEFAULT 1,
  triggered_events jsonb DEFAULT '[]'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  utm_id text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_form_sessions_session_id ON form_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_form_sessions_lead_category ON form_sessions(lead_category);
CREATE INDEX IF NOT EXISTS idx_form_sessions_funnel_stage ON form_sessions(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_form_sessions_created_at ON form_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_sessions_is_qualified ON form_sessions(is_qualified_lead) WHERE is_qualified_lead = true;
CREATE INDEX IF NOT EXISTS idx_form_sessions_is_booked ON form_sessions(is_counselling_booked) WHERE is_counselling_booked = true;
CREATE INDEX IF NOT EXISTS idx_form_sessions_environment ON form_sessions(environment);

-- Create upsert function
-- (See complete function definition above)
```

---

**END OF DATABASE SCHEMA DOCUMENTATION**

This schema can be replicated exactly on any Supabase project. All column types, defaults, and constraints are specified.
