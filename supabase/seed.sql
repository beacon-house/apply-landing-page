-- Seed data for local development testing
-- 5 test leads matching production column formats and values
-- session_id: UUID format (crypto.randomUUID())
-- environment: 'stg' (matches VITE_ENVIRONMENT in .env)
-- triggered_events: JSON array of event strings (production format)
-- target_geographies: JSON array of country codes

-- 1. Qualified BCH lead (completed, booked)
INSERT INTO public.form_sessions (
  session_id, environment, form_filler_type, student_name, current_grade,
  phone_number, location, curriculum_type, grade_format, gpa_value,
  school_name, scholarship_requirement, target_geographies,
  parent_name, parent_email, selected_date, selected_slot,
  lead_category, is_counselling_booked, funnel_stage, is_qualified_lead,
  page_completed, triggered_events, booking_status
) VALUES (
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'stg', 'parent', 'Aarav Sharma', '10',
  '+919876543210', 'Mumbai', 'IB', 'gpa', '6.5',
  'Dhirubhai Ambani International School', 'scholarship_optional', '["US","UK"]'::jsonb,
  'Rajesh Sharma', 'rajesh.seed@test.com', 'Tuesday, June 10, 2026', '4 PM',
  'bch', true, '10_form_submit', true,
  2, '["apply_cta_hero","apply_prnt_event","apply_qualfd_prnt","apply_nonspam_prnt","apply_tam_prnt","apply_page_1_continue","apply_bch_page_1_continue","apply_qualfd_prnt_page_1_continue","apply_page_2_view","apply_bch_page_2_view","apply_qualfd_prnt_page_2_view","apply_booking_confirmed"]'::jsonb, 'confirmed'
);

-- 2. Qualified Lum-L1 lead (completed, booked)
INSERT INTO public.form_sessions (
  session_id, environment, form_filler_type, student_name, current_grade,
  phone_number, location, curriculum_type, grade_format, percentage_value,
  school_name, scholarship_requirement, target_geographies,
  parent_name, parent_email, selected_date, selected_slot,
  lead_category, is_counselling_booked, funnel_stage, is_qualified_lead,
  page_completed, triggered_events, booking_status
) VALUES (
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'stg', 'parent', 'Priya Patel', '11',
  '+919876543211', 'Bangalore', 'IGCSE', 'percentage', '88',
  'Inventure Academy', 'scholarship_optional', '["UK","Canada"]'::jsonb,
  'Meera Patel', 'meera.seed@test.com', 'Wednesday, June 11, 2026', '2 PM',
  'lum-l1', true, '10_form_submit', true,
  2, '["apply_cta_hero","apply_prnt_event","apply_qualfd_prnt","apply_nonspam_prnt","apply_tam_prnt","apply_page_1_continue","apply_page_2_view","apply_booking_confirmed"]'::jsonb, 'confirmed'
);

-- 3. Unqualified nurture lead (partial - stopped at page 1 scholarship info)
INSERT INTO public.form_sessions (
  session_id, environment, form_filler_type, student_name, current_grade,
  phone_number, location, curriculum_type, grade_format, percentage_value,
  school_name, scholarship_requirement, target_geographies,
  funnel_stage, is_qualified_lead, page_completed, lead_category, triggered_events
) VALUES (
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'stg', 'parent', 'Rohan Kumar', '10',
  '+919876543212', 'Delhi', 'CBSE', 'percentage', '72',
  'Delhi Public School RKPuram', 'scholarship_optional', '["US"]'::jsonb,
  '04_page1_scholarship_info_filled', false,
  1, 'nurture', '["apply_cta_hero","apply_prnt_event","apply_page_1_continue"]'::jsonb
);

-- 4. Abandoned lead (early exit after student info)
INSERT INTO public.form_sessions (
  session_id, environment, form_filler_type, student_name, current_grade,
  phone_number, location, curriculum_type,
  funnel_stage, is_qualified_lead, page_completed, triggered_events
) VALUES (
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'stg', 'student', 'Ananya Iyer', '9',
  '+919876543213', 'Chennai', 'ICSE',
  '02_page1_student_info_filled', false,
  1, '["apply_cta_header"]'::jsonb
);

-- 5. Booking failure lead (qualified but calendar failed)
INSERT INTO public.form_sessions (
  session_id, environment, form_filler_type, student_name, current_grade,
  phone_number, location, curriculum_type, grade_format, gpa_value,
  school_name, scholarship_requirement, target_geographies,
  parent_name, parent_email, lead_category, is_counselling_booked,
  funnel_stage, is_qualified_lead, page_completed, triggered_events,
  booking_status, booking_failure_type, booking_failure_reason,
  last_attempted_date, last_attempted_slot, needs_manual_followup
) VALUES (
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'stg', 'parent', 'Vikram Nair', '12',
  '+919876543214', 'Chennai', 'IB', 'gpa', '7.0',
  'American International School Chennai', 'full_scholarship', '["US"]'::jsonb,
  'Suresh Nair', 'suresh.seed@test.com', 'bch', false,
  '09_page_2_parent_details_filled', true, 2,
  '["apply_cta_hero","apply_prnt_event","apply_qualfd_prnt","apply_nonspam_prnt","apply_tam_prnt","apply_page_1_continue","apply_bch_page_1_continue","apply_qualfd_prnt_page_1_continue","apply_page_2_view","apply_bch_page_2_view","apply_qualfd_prnt_page_2_view"]'::jsonb,
  'failed', 'calendar_error', 'Google Calendar API returned 503',
  'Tuesday, June 10, 2026', '11 AM', true
);
