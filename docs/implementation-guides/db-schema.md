-- =============================================================================
-- BEACON HOUSE FORM SESSIONS - COMPLETE DATABASE SCHEMA
-- =============================================================================
-- Copy and paste this entire file into your Supabase SQL editor to replicate
-- the form_sessions table with all triggers, functions, RLS policies, and indexes
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
-- 7. CREATE FUNCTION: auto_assign_new_lead()
-- -----------------------------------------------------------------------------
-- Purpose: Automatically creates CRM leads and assigns counselors on new form submissions
-- Trigger: AFTER INSERT on form_sessions
-- Logic:
--   - Creates crm_leads entry for all new form submissions
--   - Assigns 'bch' category leads to vishy@beaconhouse.com
--   - Assigns 'lum-l1' and 'lum-l2' category leads to karthik@beaconhouse.com
--   - Leaves other categories unassigned
--   - Creates audit comment in crm_comments
-- Note: Requires counselors and crm_leads tables to exist

CREATE OR REPLACE FUNCTION public.auto_assign_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_system_counselor_id uuid := '00000000-0000-0000-0000-000000000000';
    v_assigned_counselor_id uuid;
    v_crm_lead_exists boolean := FALSE;
    v_counselor_name text;
BEGIN
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;

    RAISE NOTICE 'Auto-assignment triggered for session_id: % (lead_category: %, is_qualified: %)',
        NEW.session_id, NEW.lead_category, NEW.is_qualified_lead;

    SELECT EXISTS (
        SELECT 1 FROM public.crm_leads
        WHERE session_id = NEW.session_id
    ) INTO v_crm_lead_exists;

    IF NOT v_crm_lead_exists THEN
        IF NEW.lead_category = 'bch' THEN
            SELECT id INTO v_assigned_counselor_id FROM public.counselors WHERE email = 'vishy@beaconhouse.com';
        ELSIF NEW.lead_category IN ('lum-l1', 'lum-l2') THEN
            SELECT id INTO v_assigned_counselor_id FROM public.counselors WHERE email = 'karthik@beaconhouse.com';
        ELSE
            v_assigned_counselor_id := NULL;
        END IF;

        INSERT INTO public.crm_leads (
            session_id,
            lead_status,
            assigned_to,
            created_at,
            updated_at
        ) VALUES (
            NEW.session_id,
            '01_yet_to_contact',
            v_assigned_counselor_id,
            now(),
            now()
        );

        RAISE NOTICE 'Created crm_leads entry for lead: % (category: %, assigned: %)',
            NEW.session_id, NEW.lead_category,
            CASE WHEN v_assigned_counselor_id IS NOT NULL THEN 'Yes' ELSE 'No' END;
    ELSE
        RAISE NOTICE 'crm_leads entry already exists for session: %', NEW.session_id;
    END IF;

    IF v_assigned_counselor_id IS NOT NULL THEN
        SELECT name INTO v_counselor_name FROM public.counselors WHERE id = v_assigned_counselor_id;

        INSERT INTO public.crm_comments (
            session_id,
            counselor_id,
            comment_text,
            lead_status_at_comment,
            created_at
        ) VALUES (
            NEW.session_id,
            v_system_counselor_id,
            format('Auto-assigned to %s (Category: %s, Qualified: %s)',
                v_counselor_name,
                COALESCE(NEW.lead_category, 'Unknown'),
                CASE WHEN NEW.is_qualified_lead THEN 'Yes' ELSE 'No' END
            ),
            '01_yet_to_contact',
            now()
        );
    ELSE
        INSERT INTO public.crm_comments (
            session_id,
            counselor_id,
            comment_text,
            lead_status_at_comment,
            created_at
        ) VALUES (
            NEW.session_id,
            v_system_counselor_id,
            format('Lead added to CRM as unassigned (Category: %s, Qualified: %s)',
                COALESCE(NEW.lead_category, 'Unknown'),
                CASE WHEN NEW.is_qualified_lead THEN 'Yes' ELSE 'No' END
            ),
            '01_yet_to_contact',
            now()
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Auto-assignment failed for session %: % %', NEW.session_id, SQLSTATE, SQLERRM;
        RETURN NEW;
END;
$function$;

-- -----------------------------------------------------------------------------
-- 8. CREATE TRIGGERS (2 triggers)
-- -----------------------------------------------------------------------------

-- Trigger 1: Auto-update updated_at timestamp on every UPDATE
CREATE TRIGGER update_form_sessions_timestamp
BEFORE UPDATE ON public.form_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- Trigger 2: Auto-assign new leads to counselors on INSERT
-- Note: This trigger requires counselors, crm_leads, and crm_comments tables
-- If those tables don't exist, this trigger will fail silently due to exception handling
CREATE TRIGGER trigger_auto_assign_new_lead
AFTER INSERT ON public.form_sessions
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_new_lead();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

-- WHEN DATABASE WRITES HAPPEN (Frontend Form Flow):
--
-- 1. Form Start (01_form_start)
--    - Triggered when form component mounts
--    - Creates initial session_id using crypto.randomUUID()
--    - First database write with minimal data
--
-- 2. Section Completions (Incremental Saves)
--    - 02_page1_student_info_filled: After name, grade, phone entered
--    - 03_page1_academic_info_filled: After school, curriculum, grades entered
--    - 04_page1_scholarship_info_filled: After scholarship needs entered
--
-- 3. Page 1 Complete (05_page1_complete)
--    - Triggered on Page 1 form submission
--    - All Page 1 data saved including lead categorization
--
-- 4. Lead Evaluation (06_lead_evaluated)
--    - Only for qualified leads after evaluation animation
--
-- 5. Page 2 View (07_page_2_view)
--    - When user reaches Page 2 (qualified or disqualified)
--
-- 6. Counseling Slot Selected (08_page_2_counselling_slot_selected)
--    - Only for qualified leads after date/time selection
--
-- 7. Parent Details Filled (09_page_2_parent_details_filled)
--    - When parent name and email entered
--
-- 8. Form Complete (10_form_submit)
--    - Final submission with all data
--    - Triggers auto_assign_new_lead() function via AFTER INSERT trigger
--
-- All saves use: supabase.rpc('upsert_form_session', { p_session_id, p_form_data })
-- Fallback: Direct upsert to form_sessions table if RPC fails
