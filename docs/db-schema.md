# Database Schema Documentation - form_sessions Table

## Overview

This document provides the complete database schema for the `form_sessions` table in the Supabase PostgreSQL database. This schema can be used to recreate the exact same database instance in a different project.

## Table Structure

### Table Name: `public.form_sessions`

| Column Name | Data Type | Nullable | Default Value | Description |
|-------------|-----------|----------|---------------|-------------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key, auto-generated UUID |
| `session_id` | `text` | NOT NULL | - | Unique session identifier for form tracking |
| `environment` | `text` | NULL | - | Deployment environment ('prod', 'stg', etc.) |
| `created_at` | `timestamptz` | NULL | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NULL | `now()` | Last update timestamp |
| `form_filler_type` | `text` | NULL | - | Who is filling the form ('parent', 'student') |
| `student_name` | `text` | NULL | - | Student's full name |
| `current_grade` | `text` | NULL | - | Student's current grade level |
| `phone_number` | `text` | NULL | - | Combined country code + phone number |
| `curriculum_type` | `text` | NULL | - | Type of curriculum (IB, CBSE, IGCSE, etc.) |
| `grade_format` | `text` | NULL | - | Grade format preference ('gpa', 'percentage') |
| `gpa_value` | `text` | NULL | - | GPA score (if grade_format is 'gpa') |
| `percentage_value` | `text` | NULL | - | Percentage score (if grade_format is 'percentage') |
| `school_name` | `text` | NULL | - | Name of student's school |
| `scholarship_requirement` | `text` | NULL | - | Scholarship needs ('full_scholarship', 'partial_scholarship', 'scholarship_optional') |
| `target_geographies` | `jsonb` | NULL | - | Array of target study destinations |
| `parent_name` | `text` | NULL | - | Parent's full name |
| `parent_email` | `text` | NULL | - | Parent's email address |
| `selected_date` | `text` | NULL | - | Selected counseling session date |
| `selected_slot` | `text` | NULL | - | Selected counseling session time slot |
| `lead_category` | `text` | NULL | - | Categorized lead type ('bch', 'lum-l1', 'lum-l2', 'nurture', 'masters', 'drop') |
| `is_counselling_booked` | `boolean` | NULL | `false` | Whether counseling session is booked |
| `funnel_stage` | `text` | NULL | `'01_form_start'` | Current stage in the form funnel |
| `is_qualified_lead` | `boolean` | NULL | `false` | Whether lead qualifies for counseling |
| `page_completed` | `integer` | NULL | `1` | Last completed form page |
| `triggered_events` | `jsonb` | NULL | `'[]'::jsonb` | Array of Meta Pixel events triggered |
| `utm_source` | `text` | NULL | - | UTM Source parameter (campaign tracking) |
| `utm_medium` | `text` | NULL | - | UTM Medium parameter (campaign tracking) |
| `utm_campaign` | `text` | NULL | - | UTM Campaign parameter (campaign tracking) |
| `utm_term` | `text` | NULL | - | UTM Term parameter (campaign tracking) |
| `utm_content` | `text` | NULL | - | UTM Content parameter (campaign tracking) |
| `utm_id` | `text` | NULL | - | UTM ID parameter (campaign tracking) |

## Constraints

### Primary Key
- **Constraint Name:** `form_sessions_pkey`
- **Type:** PRIMARY KEY
- **Column:** `id`

### Unique Constraints
- **Constraint Name:** `form_sessions_session_id_key`
- **Type:** UNIQUE
- **Column:** `session_id`

## Indexes

| Index Name | Type | Column(s) | Description |
|------------|------|-----------|-------------|
| `form_sessions_pkey` | PRIMARY KEY | `id` | Primary key index |
| `form_sessions_session_id_idx` | BTREE | `session_id` | Performance index for session lookups |

## Row Level Security (RLS)

**Status:** ENABLED

### RLS Policies

#### Anonymous User Policies
1. **Policy Name:** `"Anonymous users can create form sessions"`
   - **Operation:** INSERT
   - **Role:** `anon`
   - **Check:** `true`

2. **Policy Name:** `"Anonymous users can update form sessions"`
   - **Operation:** UPDATE
   - **Role:** `anon`
   - **Using:** `true`
   - **Check:** `true`

3. **Policy Name:** `"Anonymous users can view form sessions"`
   - **Operation:** SELECT
   - **Role:** `anon`
   - **Using:** `true`

#### Authenticated User Policies
4. **Policy Name:** `"Authenticated users can insert form sessions"`
   - **Operation:** INSERT
   - **Role:** `authenticated`
   - **Check:** `true`

5. **Policy Name:** `"Authenticated users can update form sessions"`
   - **Operation:** UPDATE
   - **Role:** `authenticated`
   - **Using:** `true`
   - **Check:** `true`

6. **Policy Name:** `"Authenticated users can view form sessions"`
   - **Operation:** SELECT
   - **Role:** `authenticated`
   - **Using:** `true`

#### Service Role Policy
7. **Policy Name:** `"Service role can access all form sessions"`
   - **Operation:** ALL
   - **Role:** `service_role`
   - **Using:** `true`
   - **Check:** `true`

## Functions

### 1. update_timestamp()

```sql
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Purpose:** Automatically updates the `updated_at` timestamp when a record is modified.

### 2. upsert_form_session()

```sql
CREATE OR REPLACE FUNCTION public.upsert_form_session(
  p_session_id text,
  p_form_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
```

**Purpose:** Inserts a new form session or updates an existing one based on `session_id`. Uses COALESCE to preserve existing data on updates.

**Parameters:**
- `p_session_id`: Unique session identifier
- `p_form_data`: JSONB object containing all form fields

**Returns:** UUID of the inserted/updated record

**Key Features:**
- Handles INSERT and UPDATE operations atomically
- Uses ON CONFLICT clause with session_id
- Preserves existing data using COALESCE where appropriate
- Automatically updates `updated_at` timestamp

## Triggers

### update_form_sessions_timestamp

- **Trigger Name:** `update_form_sessions_timestamp`
- **Event:** BEFORE UPDATE
- **For Each:** ROW
- **Function:** `public.update_timestamp()`

**Purpose:** Automatically sets `updated_at` to current timestamp when any row is updated.

## Business Logic & Data Validation

### Lead Categorization Logic

Leads are categorized into the following types based on form data:

#### Qualified Categories (eligible for counseling booking):
- **`bch`** - High priority leads
  - Grades 8-10 + parent + optional/partial scholarship
  - Grade 11 + parent + optional/partial scholarship + US target
  
- **`lum-l1`** - Luminaire Level 1 leads
  - Grade 11 + parent + optional scholarship + (UK/Rest of World/Need Guidance)
  - Grade 12 + parent + optional scholarship
  
- **`lum-l2`** - Luminaire Level 2 leads
  - Grade 11 + parent + partial scholarship + (UK/Rest of World/Need Guidance)
  - Grade 12 + parent + partial scholarship

#### Disqualified Categories (contact info only):
- **`nurture`** - Default category for development, also used for:
  - Student form fillers
  - Full scholarship requirements
  - Leads that don't meet qualified criteria
  
- **`drop`** - Grade 7 and below
- **`masters`** - Graduate program applicants

### Spam Detection
- GPA = "10" OR percentage = "100"
- Spam leads are categorized as `nurture`

### Funnel Stages

Valid funnel stage values (in chronological order):
1. `01_form_start` - User has landed on the form page
2. `02_page1_student_info_filled` - Student information completed
3. `03_page1_academic_info_filled` - Academic information completed
4. `04_page1_scholarship_info_filled` - Scholarship preferences completed
5. `05_page1_complete` - Page 1 submitted
6. `06_lead_evaluated` - Lead profile evaluated (qualified leads only)
7. `07_page_2_view` - User reached Page 2
8. `08_page_2_counselling_slot_selected` - Counseling slot selected
9. `09_page_2_parent_details_filled` - Parent contact info provided
10. `10_form_submit` - Form fully submitted
11. `abandoned` - User left without completing

### UTM Parameter Tracking

The system captures standard UTM parameters for campaign attribution:
- `utm_source` - Traffic source (google, facebook, email, etc.)
- `utm_medium` - Marketing medium (cpc, email, social, etc.)
- `utm_campaign` - Specific campaign name
- `utm_term` - Search keywords (paid campaigns)
- `utm_content` - Content variation (A/B testing)
- `utm_id` - Unique campaign identifier

## Complete Table Creation Script

```sql
-- Create the update_timestamp function
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the main table
CREATE TABLE IF NOT EXISTS public.form_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    environment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    form_filler_type text,
    student_name text,
    current_grade text,
    phone_number text,
    curriculum_type text,
    grade_format text,
    gpa_value text,
    percentage_value text,
    school_name text,
    scholarship_requirement text,
    target_geographies jsonb,
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

-- Add constraints
ALTER TABLE public.form_sessions ADD CONSTRAINT form_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.form_sessions ADD CONSTRAINT form_sessions_session_id_key UNIQUE (session_id);

-- Create indexes
CREATE INDEX form_sessions_session_id_idx ON public.form_sessions USING btree (session_id);

-- Enable RLS
ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anonymous users can create form sessions"
    ON public.form_sessions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anonymous users can update form sessions"
    ON public.form_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anonymous users can view form sessions"
    ON public.form_sessions FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated users can insert form sessions"
    ON public.form_sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update form sessions"
    ON public.form_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view form sessions"
    ON public.form_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can access all form sessions"
    ON public.form_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create trigger
CREATE TRIGGER update_form_sessions_timestamp
    BEFORE UPDATE ON public.form_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

-- Create upsert function
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
  INSERT INTO public.form_sessions (
    session_id, environment, form_filler_type, student_name, current_grade,
    phone_number, curriculum_type, grade_format, gpa_value, percentage_value,
    school_name, scholarship_requirement, target_geographies, parent_name,
    parent_email, selected_date, selected_slot, lead_category,
    is_counselling_booked, funnel_stage, is_qualified_lead, page_completed,
    triggered_events, utm_source, utm_medium, utm_campaign, utm_term,
    utm_content, utm_id
  )
  VALUES (
    p_session_id, p_form_data->>'environment', p_form_data->>'form_filler_type',
    p_form_data->>'student_name', p_form_data->>'current_grade',
    p_form_data->>'phone_number', p_form_data->>'curriculum_type',
    p_form_data->>'grade_format', p_form_data->>'gpa_value',
    p_form_data->>'percentage_value', p_form_data->>'school_name',
    p_form_data->>'scholarship_requirement', p_form_data->'target_geographies',
    p_form_data->>'parent_name', p_form_data->>'parent_email',
    p_form_data->>'selected_date', p_form_data->>'selected_slot',
    p_form_data->>'lead_category',
    COALESCE((p_form_data->>'is_counselling_booked')::boolean, false),
    COALESCE(p_form_data->>'funnel_stage', '01_form_start'),
    COALESCE((p_form_data->>'is_qualified_lead')::boolean, false),
    COALESCE((p_form_data->>'page_completed')::integer, 1),
    COALESCE(p_form_data->'triggered_events', '[]'::jsonb),
    p_form_data->>'utm_source', p_form_data->>'utm_medium',
    p_form_data->>'utm_campaign', p_form_data->>'utm_term',
    p_form_data->>'utm_content', p_form_data->>'utm_id'
  )
  ON CONFLICT (session_id) DO UPDATE SET
    environment = COALESCE(EXCLUDED.environment, form_sessions.environment),
    form_filler_type = COALESCE(EXCLUDED.form_filler_type, form_sessions.form_filler_type),
    student_name = COALESCE(EXCLUDED.student_name, form_sessions.student_name),
    current_grade = COALESCE(EXCLUDED.current_grade, form_sessions.current_grade),
    phone_number = COALESCE(EXCLUDED.phone_number, form_sessions.phone_number),
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

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.form_sessions TO anon;
GRANT ALL ON public.form_sessions TO authenticated;
GRANT ALL ON public.form_sessions TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_form_session(text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_form_session(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_form_session(text, jsonb) TO service_role;
```

## Migration History

This schema has been built through several migrations:
- Initial table creation and baseline structure
- Environment field handling updates
- UTM parameter additions for campaign tracking
- Funnel stage modernization and webhook trigger removal
- RLS policies and security enhancements

## Notes

- The webhook trigger was intentionally removed as the frontend now handles webhook calls
- Legacy funnel stages from before August 26, 2024 have been suffixed with `_legacy_26_aug`
- The environment field has no default value to ensure explicit environment specification
- All UTM parameters are optional and support campaign attribution tracking
- The triggered_events field stores Meta Pixel event names as a JSON array