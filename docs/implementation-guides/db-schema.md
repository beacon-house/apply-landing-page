-- =============================================================================
-- FORM_SESSIONS TABLE - COMPLETE SCHEMA
-- =============================================================================
-- Everything needed to replicate the form_sessions table exactly
-- Copy and paste this entire file into your Supabase SQL editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE TABLE: form_sessions
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. CREATE RLS POLICIES (7 policies)
-- -----------------------------------------------------------------------------

-- Policy 1: Anonymous users can view form sessions
CREATE POLICY "Anonymous users can view form sessions"
ON public.form_sessions
FOR SELECT
TO anon
USING (true);

-- Policy 2: Anonymous users can create form sessions
CREATE POLICY "Anonymous users can create form sessions"
ON public.form_sessions
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy 3: Anonymous users can update form sessions
CREATE POLICY "Anonymous users can update form sessions"
ON public.form_sessions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Policy 4: Authenticated users can view form sessions
CREATE POLICY "Authenticated users can view form sessions"
ON public.form_sessions
FOR SELECT
TO authenticated
USING (true);

-- Policy 5: Authenticated users can insert form sessions
CREATE POLICY "Authenticated users can insert form sessions"
ON public.form_sessions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 6: Authenticated users can update form sessions
CREATE POLICY "Authenticated users can update form sessions"
ON public.form_sessions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 7: Service role can access all form sessions
CREATE POLICY "Service role can access all form sessions"
ON public.form_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. CREATE INDEXES (7 indexes for performance)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_form_sessions_session_id ON public.form_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_form_sessions_lead_category ON public.form_sessions(lead_category);
CREATE INDEX IF NOT EXISTS idx_form_sessions_funnel_stage ON public.form_sessions(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_form_sessions_created_at ON public.form_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_sessions_is_qualified ON public.form_sessions(is_qualified_lead) WHERE is_qualified_lead = true;
CREATE INDEX IF NOT EXISTS idx_form_sessions_is_booked ON public.form_sessions(is_counselling_booked) WHERE is_counselling_booked = true;
CREATE INDEX IF NOT EXISTS idx_form_sessions_environment ON public.form_sessions(environment);

-- -----------------------------------------------------------------------------
-- 5. CREATE FUNCTION: update_timestamp()
-- -----------------------------------------------------------------------------
-- Purpose: Automatically updates the updated_at column on row updates
-- Used by: update_form_sessions_timestamp trigger

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- -----------------------------------------------------------------------------
-- 6. CREATE FUNCTION: upsert_form_session()
-- -----------------------------------------------------------------------------
-- Purpose: Insert or update form session data with intelligent COALESCE merging
-- Parameters:
--   - p_session_id: Unique session identifier
--   - p_form_data: JSONB object with all form fields in snake_case
-- Returns: UUID of the inserted/updated record
-- Used by: Frontend via supabase.rpc('upsert_form_session', {...})

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
$function$;

-- -----------------------------------------------------------------------------
-- 7. CREATE TRIGGER: update_form_sessions_timestamp
-- -----------------------------------------------------------------------------
-- Purpose: Auto-update updated_at timestamp on every UPDATE to form_sessions

CREATE TRIGGER update_form_sessions_timestamp
BEFORE UPDATE ON public.form_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

-- =============================================================================
-- WHEN DATABASE WRITES HAPPEN (Frontend Form Flow)
-- =============================================================================
--
-- All database writes to form_sessions happen via:
--   supabase.rpc('upsert_form_session', { p_session_id, p_form_data })
--
-- Fallback if RPC fails:
--   supabase.from('form_sessions').upsert([data], { onConflict: 'session_id' })
--
-- Write Trigger Points:
--
-- 1. Form Start (01_form_start)
--    When: Form component mounts and loads
--    File: src/components/FormPage.tsx
--    Data: session_id, environment, utm_params
--
-- 2. Student Info Section (02_page1_student_info_filled)
--    When: After name, grade, phone entered
--    File: src/components/forms/InitialLeadCaptureForm.tsx
--    Data: form_filler_type, student_name, current_grade, phone_number, location
--
-- 3. Academic Info Section (03_page1_academic_info_filled)
--    When: After school, curriculum, grades entered
--    File: src/components/forms/InitialLeadCaptureForm.tsx
--    Data: school_name, curriculum_type, grade_format, gpa_value/percentage_value
--
-- 4. Scholarship Info Section (04_page1_scholarship_info_filled)
--    When: After scholarship needs and target countries entered
--    File: src/components/forms/InitialLeadCaptureForm.tsx
--    Data: scholarship_requirement, target_geographies
--
-- 5. Page 1 Complete (05_page1_complete)
--    When: Page 1 form validation passes and user clicks "Next"
--    File: src/components/forms/InitialLeadCaptureForm.tsx
--    Data: All Page 1 fields + lead_category, is_qualified_lead, page_completed=1
--
-- 6. Lead Evaluated (06_lead_evaluated)
--    When: Evaluation animation completes (qualified leads only)
--    File: src/components/forms/FormContainer.tsx
--    Data: funnel_stage updated to '06_lead_evaluated'
--
-- 7. Page 2 View (07_page_2_view)
--    When: User reaches Page 2 (qualified or disqualified)
--    File: src/components/forms/FormContainer.tsx
--    Data: funnel_stage updated to '07_page_2_view', page_completed=2
--
-- 8. Counseling Slot Selected (08_page_2_counselling_slot_selected)
--    When: Date and time slot selected (qualified leads only)
--    File: src/components/forms/QualifiedLeadForm.tsx
--    Data: selected_date, selected_slot, is_counselling_booked=true
--
-- 9. Parent Details Filled (09_page_2_parent_details_filled)
--    When: Parent name and email entered
--    File: src/components/forms/QualifiedLeadForm.tsx or DisqualifiedLeadForm.tsx
--    Data: parent_name, parent_email
--
-- 10. Form Submit (10_form_submit)
--     When: Final form submission (all validation passed)
--     File: src/components/forms/FormContainer.tsx
--     Data: All fields complete, funnel_stage='10_form_submit'
--
-- =============================================================================
-- DATA FLOW LOGIC
-- =============================================================================
--
-- Session ID Generation:
--   - Generated on form load: crypto.randomUUID()
--   - Stored in browser: useFormStore (Zustand)
--   - Unique constraint: session_id column
--
-- Lead Categorization Logic (src/lib/leadCategorization.ts):
--   - Happens after Page 1 completion
--   - Categories: 'bch', 'lum-l1', 'lum-l2', 'nurture', 'masters', 'drop'
--   - Qualified leads: 'bch', 'lum-l1', 'lum-l2' (get counseling booking)
--   - Disqualified leads: 'nurture', 'masters', 'drop' (contact form only)
--
-- Upsert Logic:
--   - Uses COALESCE to preserve existing non-null values
--   - New values only update if not null
--   - updated_at automatically set by trigger
--
-- Field Name Conversion:
--   - Frontend: camelCase (formFillerType, studentName, etc.)
--   - Database: snake_case (form_filler_type, student_name, etc.)
--   - Conversion happens in: src/lib/formTracking.ts (saveFormDataIncremental)
--
-- =============================================================================
