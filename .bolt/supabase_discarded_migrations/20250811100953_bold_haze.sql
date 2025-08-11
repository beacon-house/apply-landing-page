```sql
    -- Step 1: Drop the existing DEFAULT constraint on the 'environment' column.
    -- This is the root cause of 'staging' being inserted when the incoming value is NULL.
    ALTER TABLE public.form_sessions ALTER COLUMN environment DROP DEFAULT;

    -- Step 2: Recreate or Replace the upsert_form_session function.
    -- This function ensures that the 'environment' value from the input JSONB
    -- is directly used for both INSERT and UPDATE operations, without any COALESCE
    -- that would preserve old values if the new one is NULL.
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
        id,
        session_id,
        environment, -- Explicitly include environment
        created_at,
        updated_at,
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
        COALESCE((p_form_data->>'id')::uuid, gen_random_uuid()),
        p_session_id,
        p_form_data->>'environment', -- Use environment from input data directly
        COALESCE((p_form_data->>'created_at')::timestamp with time zone, now()),
        COALESCE((p_form_data->>'updated_at')::timestamp with time zone, now()),
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
        COALESCE(p_form_data->'page_completed', '1')::integer, -- Ensure page_completed is integer and defaults to 1 if not provided
        COALESCE(p_form_data->'triggered_events', '[]'::jsonb),
        p_form_data->>'student_name'
      )
      ON CONFLICT (session_id)
      DO UPDATE SET
        environment = EXCLUDED.environment, -- CRITICAL: Directly use the excluded value, even if NULL
        form_filler_type = EXCLUDED.form_filler_type,
        current_grade = EXCLUDED.current_grade,
        phone_number = EXCLUDED.phone_number,
        curriculum_type = EXCLUDED.curriculum_type,
        grade_format = EXCLUDED.grade_format,
        gpa_value = EXCLUDED.gpa_value,
        percentage_value = EXCLUDED.percentage_value,
        school_name = EXCLUDED.school_name,
        scholarship_requirement = EXCLUDED.scholarship_requirement,
        target_geographies = EXCLUDED.target_geographies,
        parent_name = EXCLUDED.parent_name,
        parent_email = EXCLUDED.parent_email,
        selected_date = EXCLUDED.selected_date,
        selected_slot = EXCLUDED.selected_slot,
        lead_category = EXCLUDED.lead_category,
        is_counselling_booked = EXCLUDED.is_counselling_booked,
        funnel_stage = EXCLUDED.funnel_stage,
        is_qualified_lead = EXCLUDED.is_qualified_lead,
        page_completed = EXCLUDED.page_completed,
        triggered_events = EXCLUDED.triggered_events,
        student_name = EXCLUDED.student_name,
        updated_at = now(); -- Let the trigger handle this, or explicitly set now()
      
      GET DIAGNOSTICS v_id = ROW_COUNT; -- This line is not needed for returning ID, but for debugging
      RETURN (SELECT id FROM public.form_sessions WHERE session_id = p_session_id); -- Return the ID of the upserted row
    END;
    $$;
    ```