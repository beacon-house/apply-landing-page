

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_assign_new_lead"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_system_counselor_id uuid := '00000000-0000-0000-0000-000000000000';
    v_assigned_counselor_id uuid;
    v_crm_lead_exists boolean := FALSE;
    v_counselor_name text;
BEGIN
    -- Only process on INSERT (new form submissions)
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;

    RAISE NOTICE 'Auto-assignment triggered for session_id: % (lead_category: %, is_qualified: %)', 
        NEW.session_id, NEW.lead_category, NEW.is_qualified_lead;

    -- Check if crm_leads entry already exists
    SELECT EXISTS (
        SELECT 1 FROM public.crm_leads 
        WHERE session_id = NEW.session_id
    ) INTO v_crm_lead_exists;

    -- Create crm_leads entry for ALL leads (qualified and unqualified)
    IF NOT v_crm_lead_exists THEN
        -- Determine assignment based on lead_category
        IF NEW.lead_category = 'bch' THEN
            SELECT id INTO v_assigned_counselor_id FROM public.counselors WHERE email = 'vishy@beaconhouse.com';
        ELSIF NEW.lead_category IN ('lum-l1', 'lum-l2') THEN
            SELECT id INTO v_assigned_counselor_id FROM public.counselors WHERE email = 'karthik@beaconhouse.com';
        ELSE
            v_assigned_counselor_id := NULL; -- Unqualified leads remain unassigned
        END IF;

        -- Create crm_leads entry
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

    -- Add system comment for audit trail
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
        -- Log error but don't fail the original form_sessions insert
        RAISE WARNING 'Auto-assignment failed for session %: % %', NEW.session_id, SQLSTATE, SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_assign_new_lead"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_form_session"("p_session_id" "text", "p_form_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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
    COALESCE(p_form_data->>'funnel_stage', 'initial_capture'),
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


ALTER FUNCTION "public"."upsert_form_session"("p_session_id" "text", "p_form_data" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assignment_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "rule_priority" integer DEFAULT 100 NOT NULL,
    "trigger_lead_category" "text",
    "trigger_lead_status" "text",
    "assigned_counselor_id" "uuid" NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "end_date" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assignment_rules_priority_positive" CHECK (("rule_priority" >= 0)),
    CONSTRAINT "assignment_rules_valid_date_range" CHECK ((("end_date" IS NULL) OR ("end_date" >= "start_date")))
);


ALTER TABLE "public"."assignment_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."counselors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "counselors_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'senior_counselor'::"text", 'junior_counselor'::"text"])))
);


ALTER TABLE "public"."counselors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "counselor_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "lead_status_at_comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_comments_lead_status_at_comment_check" CHECK (("lead_status_at_comment" = ANY (ARRAY['01_yet_to_contact'::"text", '02_failed_to_contact'::"text", '03_counselling_call_booked'::"text", '04_counselling_call_rescheduled'::"text", '05_counselling_call_no_show'::"text", '06_counselling_call_done'::"text", '07_followup_call_requested'::"text", '05b_to_be_rescheduled'::"text", '07a_followup_call_requested_vishy'::"text", '07b_followup_call_requested_karthik'::"text", '07c_followup_call_requested_matt'::"text", '08_interest_exploration'::"text", '09_price_negotiation'::"text", '10_converted'::"text", '11_drop'::"text", '12_conversion_followup'::"text"])))
);


ALTER TABLE "public"."crm_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "lead_status" "text" DEFAULT '01_yet_to_contact'::"text" NOT NULL,
    "assigned_to" "uuid",
    "last_contacted" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "crm_leads_lead_status_check" CHECK (("lead_status" = ANY (ARRAY['01_yet_to_contact'::"text", '02_failed_to_contact'::"text", '03_counselling_call_booked'::"text", '04_counselling_call_rescheduled'::"text", '05_counselling_call_no_show'::"text", '06_counselling_call_done'::"text", '07_followup_call_requested'::"text", '05b_to_be_rescheduled'::"text", '07a_followup_call_requested_vishy'::"text", '07b_followup_call_requested_karthik'::"text", '07c_followup_call_requested_matt'::"text", '08_interest_exploration'::"text", '09_price_negotiation'::"text", '10_converted'::"text", '11_drop'::"text", '12_conversion_followup'::"text"])))
);


ALTER TABLE "public"."crm_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "environment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "form_filler_type" "text",
    "current_grade" "text",
    "phone_number" "text",
    "curriculum_type" "text",
    "grade_format" "text",
    "gpa_value" "text",
    "percentage_value" "text",
    "school_name" "text",
    "scholarship_requirement" "text",
    "target_geographies" "jsonb",
    "parent_name" "text",
    "parent_email" "text",
    "selected_date" "text",
    "selected_slot" "text",
    "lead_category" "text",
    "is_counselling_booked" boolean DEFAULT false,
    "funnel_stage" "text" DEFAULT '01_form_start'::"text",
    "is_qualified_lead" boolean DEFAULT false,
    "page_completed" integer DEFAULT 1,
    "triggered_events" "jsonb" DEFAULT '[]'::"jsonb",
    "student_name" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "utm_id" "text",
    "location" "text",
    "booking_status" "text",
    "booking_failure_type" "text",
    "booking_failure_reason" "text",
    "last_attempted_date" "text",
    "last_attempted_slot" "text",
    "needs_manual_followup" boolean DEFAULT false
);


ALTER TABLE "public"."form_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "whatsapp_status" "text" DEFAULT 'not_exported'::"text" NOT NULL,
    "export_date" timestamp with time zone,
    "last_message_date" timestamp with time zone,
    "exported_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "whatsapp_leads_whatsapp_status_check" CHECK (("whatsapp_status" = ANY (ARRAY['not_exported'::"text", 'exported'::"text", 'message_sent'::"text"])))
);


ALTER TABLE "public"."whatsapp_leads" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assignment_rules"
    ADD CONSTRAINT "assignment_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counselors"
    ADD CONSTRAINT "counselors_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."counselors"
    ADD CONSTRAINT "counselors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_comments"
    ADD CONSTRAINT "crm_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."form_sessions"
    ADD CONSTRAINT "form_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_sessions"
    ADD CONSTRAINT "form_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."whatsapp_leads"
    ADD CONSTRAINT "whatsapp_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_leads"
    ADD CONSTRAINT "whatsapp_leads_session_id_key" UNIQUE ("session_id");



CREATE INDEX "assignment_rules_active_idx" ON "public"."assignment_rules" USING "btree" ("is_active");



CREATE INDEX "assignment_rules_category_idx" ON "public"."assignment_rules" USING "btree" ("trigger_lead_category");



CREATE INDEX "assignment_rules_counselor_idx" ON "public"."assignment_rules" USING "btree" ("assigned_counselor_id");



CREATE INDEX "assignment_rules_dates_idx" ON "public"."assignment_rules" USING "btree" ("start_date", "end_date");



CREATE INDEX "assignment_rules_priority_idx" ON "public"."assignment_rules" USING "btree" ("rule_priority");



CREATE INDEX "assignment_rules_status_idx" ON "public"."assignment_rules" USING "btree" ("trigger_lead_status");



CREATE INDEX "counselors_email_idx" ON "public"."counselors" USING "btree" ("email");



CREATE INDEX "counselors_role_active_idx" ON "public"."counselors" USING "btree" ("role", "is_active");



CREATE INDEX "crm_comments_counselor_id_idx" ON "public"."crm_comments" USING "btree" ("counselor_id");



CREATE INDEX "crm_comments_created_at_idx" ON "public"."crm_comments" USING "btree" ("created_at");



CREATE INDEX "crm_comments_session_id_idx" ON "public"."crm_comments" USING "btree" ("session_id");



CREATE INDEX "crm_leads_assigned_to_idx" ON "public"."crm_leads" USING "btree" ("assigned_to");



CREATE INDEX "crm_leads_last_contacted_idx" ON "public"."crm_leads" USING "btree" ("last_contacted");



CREATE INDEX "crm_leads_session_id_idx" ON "public"."crm_leads" USING "btree" ("session_id");



CREATE INDEX "crm_leads_status_idx" ON "public"."crm_leads" USING "btree" ("lead_status");



CREATE INDEX "form_sessions_session_id_idx" ON "public"."form_sessions" USING "btree" ("session_id");



CREATE INDEX "whatsapp_leads_export_date_idx" ON "public"."whatsapp_leads" USING "btree" ("export_date");



CREATE INDEX "whatsapp_leads_session_id_idx" ON "public"."whatsapp_leads" USING "btree" ("session_id");



CREATE INDEX "whatsapp_leads_status_idx" ON "public"."whatsapp_leads" USING "btree" ("whatsapp_status");



CREATE OR REPLACE TRIGGER "trigger_auto_assign_new_lead" AFTER INSERT ON "public"."form_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."auto_assign_new_lead"();



CREATE OR REPLACE TRIGGER "update_assignment_rules_timestamp" BEFORE UPDATE ON "public"."assignment_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_counselors_timestamp" BEFORE UPDATE ON "public"."counselors" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_crm_leads_timestamp" BEFORE UPDATE ON "public"."crm_leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_form_sessions_timestamp" BEFORE UPDATE ON "public"."form_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_whatsapp_leads_timestamp" BEFORE UPDATE ON "public"."whatsapp_leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



ALTER TABLE ONLY "public"."assignment_rules"
    ADD CONSTRAINT "assignment_rules_assigned_counselor_id_fkey" FOREIGN KEY ("assigned_counselor_id") REFERENCES "public"."counselors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_comments"
    ADD CONSTRAINT "crm_comments_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "public"."counselors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "crm_leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."counselors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_comments"
    ADD CONSTRAINT "fk_crm_comments_session_id" FOREIGN KEY ("session_id") REFERENCES "public"."form_sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_leads"
    ADD CONSTRAINT "fk_crm_leads_session_id" FOREIGN KEY ("session_id") REFERENCES "public"."form_sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_leads"
    ADD CONSTRAINT "fk_whatsapp_leads_session_id" FOREIGN KEY ("session_id") REFERENCES "public"."form_sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_leads"
    ADD CONSTRAINT "whatsapp_leads_exported_by_fkey" FOREIGN KEY ("exported_by") REFERENCES "public"."counselors"("id");



CREATE POLICY "Active counselors can view all leads" ON "public"."crm_leads" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true)))));



CREATE POLICY "Admins can manage assignment rules" ON "public"."assignment_rules" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND ("c"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND ("c"."role" = 'admin'::"text")))));



CREATE POLICY "Anonymous users can create form sessions" ON "public"."form_sessions" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anonymous users can update form sessions" ON "public"."form_sessions" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Anonymous users can view form sessions" ON "public"."form_sessions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anyone can manage counselors" ON "public"."counselors" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can view counselors" ON "public"."counselors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can insert form sessions" ON "public"."form_sessions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can update form sessions" ON "public"."form_sessions" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can view form sessions" ON "public"."form_sessions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Counselors can insert comments on accessible leads" ON "public"."crm_comments" FOR INSERT TO "authenticated" WITH CHECK ((("counselor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND (("c"."role" = ANY (ARRAY['admin'::"text", 'senior_counselor'::"text"])) OR (("c"."role" = 'junior_counselor'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."crm_leads" "cl"
          WHERE (("cl"."session_id" = "crm_comments"."session_id") AND ("cl"."assigned_to" = "c"."id")))))))))));



CREATE POLICY "Counselors can insert leads" ON "public"."crm_leads" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true)))));



CREATE POLICY "Counselors can manage whatsapp leads" ON "public"."whatsapp_leads" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true)))));



CREATE POLICY "Counselors can view assignment rules" ON "public"."assignment_rules" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true)))));



CREATE POLICY "Counselors can view comments based on role" ON "public"."crm_comments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND (("c"."role" = ANY (ARRAY['admin'::"text", 'senior_counselor'::"text"])) OR (("c"."role" = 'junior_counselor'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."crm_leads" "cl"
          WHERE (("cl"."session_id" = "crm_comments"."session_id") AND ("cl"."assigned_to" = "c"."id"))))))))));



CREATE POLICY "Counselors can view whatsapp leads" ON "public"."whatsapp_leads" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true)))));



CREATE POLICY "Junior counselors can update assigned leads" ON "public"."crm_leads" FOR UPDATE TO "authenticated" USING ((("assigned_to" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND ("c"."role" = 'junior_counselor'::"text")))))) WITH CHECK ((("assigned_to" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND ("c"."role" = 'junior_counselor'::"text"))))));



CREATE POLICY "Senior counselors and admins can update leads" ON "public"."crm_leads" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND ("c"."role" = ANY (ARRAY['admin'::"text", 'senior_counselor'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."counselors" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."is_active" = true) AND ("c"."role" = ANY (ARRAY['admin'::"text", 'senior_counselor'::"text"]))))));



CREATE POLICY "Service role can access all form sessions" ON "public"."form_sessions" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."assignment_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counselors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crm_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_leads" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."auto_assign_new_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_new_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_new_lead"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_form_session"("p_session_id" "text", "p_form_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_form_session"("p_session_id" "text", "p_form_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_form_session"("p_session_id" "text", "p_form_data" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."assignment_rules" TO "anon";
GRANT ALL ON TABLE "public"."assignment_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_rules" TO "service_role";



GRANT ALL ON TABLE "public"."counselors" TO "anon";
GRANT ALL ON TABLE "public"."counselors" TO "authenticated";
GRANT ALL ON TABLE "public"."counselors" TO "service_role";



GRANT ALL ON TABLE "public"."crm_comments" TO "anon";
GRANT ALL ON TABLE "public"."crm_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_comments" TO "service_role";



GRANT ALL ON TABLE "public"."crm_leads" TO "anon";
GRANT ALL ON TABLE "public"."crm_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_leads" TO "service_role";



GRANT ALL ON TABLE "public"."form_sessions" TO "anon";
GRANT ALL ON TABLE "public"."form_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_leads" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_leads" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























