/*
  # Add UTM tracking columns to form_sessions table

  1. New Columns Added
     - `utm_source` (text) - UTM Source parameter (e.g., "google", "facebook")
     - `utm_medium` (text) - UTM Medium parameter (e.g., "cpc", "email", "social")
     - `utm_campaign` (text) - UTM Campaign parameter (e.g., "summer_sale", "back_to_school")
     - `utm_term` (text) - UTM Term parameter (search keywords for paid campaigns)
     - `utm_content` (text) - UTM Content parameter (to differentiate similar content/links)
     - `utm_id` (text) - UTM ID parameter (unique campaign identifier)

  2. Purpose
     - Track campaign sources and marketing attribution
     - Understand which channels drive the most qualified leads
     - Measure ROI of different marketing campaigns
     - Enable better budget allocation decisions

  3. Data Usage
     - Captured from URL parameters when users first land on the site
     - Stored with each form session for complete funnel tracking
     - Sent to webhook for external integrations (Google Sheets, CRM)
     - Used for campaign performance analysis and reporting
*/

ALTER TABLE public.form_sessions
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_id TEXT;