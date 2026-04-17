-- Add booking status fields to form_sessions table
-- These track slot availability failures so the team can proactively reach out
-- All columns are nullable so existing rows are not impacted

ALTER TABLE form_sessions
  ADD COLUMN IF NOT EXISTS booking_status TEXT,
  ADD COLUMN IF NOT EXISTS booking_failure_type TEXT,
  ADD COLUMN IF NOT EXISTS booking_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_attempted_date TEXT,
  ADD COLUMN IF NOT EXISTS last_attempted_slot TEXT,
  ADD COLUMN IF NOT EXISTS needs_manual_followup BOOLEAN DEFAULT FALSE;

-- booking_status values: 'success' | 'failed' | 'no_attempt'
-- booking_failure_type values: 'availability_fetch_failed' | 'no_slots_available' | NULL
-- needs_manual_followup: TRUE when booking_status = 'failed', signals Make.com to route to proactive follow-up
