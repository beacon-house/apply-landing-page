-- Remove the hardcoded 'staging' default from environment column
-- This migration fixes the root cause of environment always being 'staging'

ALTER TABLE public.form_sessions ALTER COLUMN environment DROP DEFAULT;

-- Update the upsert function to properly handle environment values
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
    p_form_data->>'environment', -- Direct assignment, no defaults
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
    (p_form_data->>'is_counselling_booked')::boolean,
    COALESCE(p_form_data->>'funnel_stage', 'initial_capture'),
    COALESCE((p_form_data->>'is_qualified_lead')::boolean, false),
    COALESCE((p_form_data->>'page_completed')::integer, 1),
    COALESCE(p_form_data->'triggered_events', '[]'::jsonb),
    p_form_data->>'student_name'
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    environment = EXCLUDED.environment, -- Force update, no COALESCE
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