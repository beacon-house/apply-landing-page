-- Migration: Fix upsert_form_session RPC + drop dead CRM/WhatsApp tables
-- Date: 2026-06-08

-- ============================================================
-- 1. Fix upsert_form_session RPC
--    - Add 6 missing booking columns (booking_status, booking_failure_type,
--      booking_failure_reason, last_attempted_date, last_attempted_slot,
--      needs_manual_followup)
--    - Fix funnel_stage default from 'initial_capture' to '01_form_start'
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."upsert_form_session"("p_session_id" "text", "p_form_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
    utm_id,
    booking_status,
    booking_failure_type,
    booking_failure_reason,
    last_attempted_date,
    last_attempted_slot,
    needs_manual_followup
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
    p_form_data->>'utm_id',
    p_form_data->>'booking_status',
    p_form_data->>'booking_failure_type',
    p_form_data->>'booking_failure_reason',
    p_form_data->>'last_attempted_date',
    p_form_data->>'last_attempted_slot',
    COALESCE((p_form_data->>'needs_manual_followup')::boolean, false)
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
    booking_status = COALESCE(EXCLUDED.booking_status, form_sessions.booking_status),
    booking_failure_type = COALESCE(EXCLUDED.booking_failure_type, form_sessions.booking_failure_type),
    booking_failure_reason = COALESCE(EXCLUDED.booking_failure_reason, form_sessions.booking_failure_reason),
    last_attempted_date = COALESCE(EXCLUDED.last_attempted_date, form_sessions.last_attempted_date),
    last_attempted_slot = COALESCE(EXCLUDED.last_attempted_slot, form_sessions.last_attempted_slot),
    needs_manual_followup = COALESCE(EXCLUDED.needs_manual_followup, form_sessions.needs_manual_followup),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 2. Drop auto_assign_new_lead trigger and function
--    CRM is dead, this trigger writes to tables we're dropping
-- ============================================================

DROP TRIGGER IF EXISTS "trigger_auto_assign_new_lead" ON "public"."form_sessions";
DROP FUNCTION IF EXISTS "public"."auto_assign_new_lead"();

-- ============================================================
-- 3. Drop tables (dependency order)
-- ============================================================

DROP TABLE IF EXISTS "public"."crm_comments" CASCADE;
DROP TABLE IF EXISTS "public"."crm_leads" CASCADE;
DROP TABLE IF EXISTS "public"."assignment_rules" CASCADE;
DROP TABLE IF EXISTS "public"."whatsapp_leads" CASCADE;
DROP TABLE IF EXISTS "public"."counselors" CASCADE;

-- ============================================================
-- 4. Cleanup
--    CASCADE on DROP TABLE automatically removes:
--    - RLS policies on dropped tables
--    - GRANTs on dropped tables
--    - Indexes on dropped tables
--    - Foreign keys referencing dropped tables
--    DROP FUNCTION also auto-removes grants on the function
-- ============================================================

-- Revoke grants on the auto_assign function (already dropped, but be safe)
-- Note: DROP FUNCTION IF EXISTS already handles this
