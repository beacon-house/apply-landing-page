/*
# Baseline Migration: Form Sessions Table and Related Objects

This migration creates the complete form_sessions table structure with all associated
database objects including:

1. Table Structure
   - `form_sessions` table with all 25 columns
   - Primary key constraint on `id`
   - Unique constraint on `session_id`

2. Indexes
   - Primary key index on `id`
   - Index on `session_id` for performance
   - Unique index on `session_id`

3. Row Level Security (RLS)
   - Policies for anonymous users (INSERT, UPDATE, SELECT)
   - Policies for authenticated users (INSERT, UPDATE, SELECT)  
   - Policy for service role (ALL operations)

4. Triggers and Functions
   - `update_timestamp()` function for automatic timestamp updates
   - Trigger to update `updated_at` field on row changes

5. Database Functions
   - `upsert_form_session()` function for application data operations
*/

-- Create the update_timestamp function first
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the form_sessions table
CREATE TABLE IF NOT EXISTS public.form_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    environment text DEFAULT 'staging'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    form_filler_type text,
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
    funnel_stage text DEFAULT 'initial_capture'::text,
    is_qualified_lead boolean DEFAULT false,
    page_completed integer DEFAULT 1,
    triggered_events jsonb DEFAULT '[]'::jsonb,
    student_name text
);

-- Add primary key constraint
ALTER TABLE public.form_sessions DROP CONSTRAINT IF EXISTS form_sessions_pkey;
ALTER TABLE public.form_sessions ADD CONSTRAINT form_sessions_pkey PRIMARY KEY (id);

-- Add unique constraint on session_id
ALTER TABLE public.form_sessions DROP CONSTRAINT IF EXISTS form_sessions_session_id_key;
ALTER TABLE public.form_sessions ADD CONSTRAINT form_sessions_session_id_key UNIQUE (session_id);

-- Create indexes
DROP INDEX IF EXISTS public.form_sessions_session_id_idx;
CREATE INDEX form_sessions_session_id_idx ON public.form_sessions USING btree (session_id);

-- Enable Row Level Security
ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anonymous users can create form sessions" ON public.form_sessions;
DROP POLICY IF EXISTS "Anonymous users can update form sessions" ON public.form_sessions;
DROP POLICY IF EXISTS "Anonymous users can view form sessions" ON public.form_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert form sessions" ON public.form_sessions;
DROP POLICY IF EXISTS "Authenticated users can update form sessions" ON public.form_sessions;
DROP POLICY IF EXISTS "Authenticated users can view form sessions" ON public.form_sessions;
DROP POLICY IF EXISTS "Service role can access all form sessions" ON public.form_sessions;

-- Create RLS policies for anonymous users
CREATE POLICY "Anonymous users can create form sessions"
    ON public.form_sessions
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anonymous users can update form sessions"
    ON public.form_sessions
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anonymous users can view form sessions"
    ON public.form_sessions
    FOR SELECT
    TO anon
    USING (true);

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can insert form sessions"
    ON public.form_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update form sessions"
    ON public.form_sessions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view form sessions"
    ON public.form_sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- Create RLS policy for service role
CREATE POLICY "Service role can access all form sessions"
    ON public.form_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create trigger for updating timestamp
DROP TRIGGER IF EXISTS update_form_sessions_timestamp ON public.form_sessions;
CREATE TRIGGER update_form_sessions_timestamp
    BEFORE UPDATE ON public.form_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

-- Create the upsert_form_session function
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
        current_grade,
        phone_number,
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
        student_name
    )
    VALUES (
        p_session_id,
        COALESCE(p_form_data->>'environment', 'staging'),
        p_form_data->>'form_filler_type',
        p_form_data->>'current_grade',
        p_form_data->>'phone_number',
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
        p_form_data->>'student_name'
    )
    ON CONFLICT (session_id)
    DO UPDATE SET
        environment = COALESCE(EXCLUDED.environment, form_sessions.environment),
        form_filler_type = COALESCE(EXCLUDED.form_filler_type, form_sessions.form_filler_type),
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
        student_name = COALESCE(EXCLUDED.student_name, form_sessions.student_name),
        updated_at = now()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;