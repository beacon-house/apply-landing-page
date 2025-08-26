-- ====================================
-- VERIFICATION MIGRATION FOR FUNNEL STAGE CHANGES
-- ====================================
-- Migration: 20240826000002_verify_funnel_stage_migration.sql
-- Description: Verification queries to ensure funnel stage migration worked correctly
-- Date: August 26, 2024

-- This migration contains verification queries that can be run to check the migration status
-- These are informational queries and don't make any changes to the database

-- Query 1: Check current funnel stage distribution
-- Expected: Should show legacy stages with _legacy_26_aug suffix
SELECT 
  'Current funnel stage distribution' as check_type,
  funnel_stage, 
  COUNT(*) as count
FROM public.form_sessions 
GROUP BY funnel_stage 
ORDER BY funnel_stage;

-- Query 2: Verify no old funnel stage names exist (should return 0 rows)
-- Expected: Should return 0 rows if migration was successful
SELECT 
  'Old funnel stage names found' as check_type,
  funnel_stage, 
  COUNT(*) as count
FROM public.form_sessions 
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
)
GROUP BY funnel_stage;

-- Query 3: Check if webhook trigger was removed (should return 0 rows)
-- Expected: Should return 0 rows if trigger was successfully removed
SELECT 
  'Webhook trigger status' as check_type,
  trigger_name, 
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'form_sessions' 
  AND trigger_name = 'send-to-google-sheet';

-- Query 4: Verify upsert function exists and has correct default
-- Expected: Should return the function definition
SELECT 
  'Upsert function status' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'upsert_form_session' 
  AND routine_schema = 'public';

-- Query 5: Check table default value for new records
-- Expected: Should show '01_form_start' as default
SELECT 
  'Table default value' as check_type,
  column_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'form_sessions' 
  AND column_name = 'funnel_stage';

-- Query 6: Summary of migration status
-- This provides a quick overview of what should be verified
SELECT 
  'Migration Summary' as check_type,
  'Legacy funnel stages should have _legacy_26_aug suffix' as expected_1,
  'No old funnel stage names should exist' as expected_2,
  'Webhook trigger should be removed' as expected_3,
  'Upsert function should exist with new default' as expected_4,
  'Table default should be 01_form_start' as expected_5;
