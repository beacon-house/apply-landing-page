-- ====================================
-- FUNNEL STAGE LEGACY MIGRATION & WEBHOOK TRIGGER REMOVAL
-- ====================================
-- Migration: 20240826000001_funnel_stage_legacy_migration.sql
-- Description: 
-- 1. Add legacy suffix to existing funnel stages for analytics clarity
-- 2. Remove redundant webhook trigger (frontend handles webhook)
-- 3. Update upsert function to use new default funnel stage
-- Date: August 26, 2024

-- Step 1: Add legacy suffix to existing funnel stages (for analytics clarity)
-- This preserves existing data while making it clear these are old funnel stages
UPDATE public.form_sessions 
SET funnel_stage = CASE 
  WHEN funnel_stage = 'form_start' THEN 'form_start_legacy_26_aug'
  WHEN funnel_stage = 'page1_in_progress' THEN 'page1_in_progress_legacy_26_aug'
  WHEN funnel_stage = 'page1_submitted' THEN 'page1_submitted_legacy_26_aug'
  WHEN funnel_stage = 'lead_evaluated' THEN 'lead_evaluated_legacy_26_aug'
  WHEN funnel_stage = 'page2_view' THEN 'page2_view_legacy_26_aug'
  WHEN funnel_stage = 'counseling_booked' THEN 'counseling_booked_legacy_26_aug'
  WHEN funnel_stage = 'contact_details_entered' THEN 'contact_details_entered_legacy_26_aug'
  WHEN funnel_stage = 'form_complete' THEN 'form_complete_legacy_26_aug'
  WHEN funnel_stage = 'page1_complete' THEN 'page1_complete_legacy_26_aug'
  ELSE funnel_stage
END
WHERE funnel_stage IN (
  'form_start',
  'page1_in_progress', 
  'page1_submitted',
  'lead_evaluated',
  'page2_view',
  'counseling_booked',
  'contact_details_entered',
  'form_complete',
  'page1_complete'
);

-- Step 2: Remove the redundant webhook trigger
-- Frontend now handles webhook triggering on final form submission
DROP TRIGGER IF EXISTS "send-to-google-sheet" ON public.form_sessions;

-- Step 3: Update the upsert function to use new default funnel stage
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

-- Step 4: Update the table default value for new records
ALTER TABLE public.form_sessions 
ALTER COLUMN funnel_stage SET DEFAULT '01_form_start';

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.upsert_form_session(text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_form_session(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_form_session(text, jsonb) TO service_role;
