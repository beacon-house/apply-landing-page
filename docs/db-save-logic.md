# Database Save Logic Documentation

## Overview

This document outlines the database save logic for the Beacon House application, including field mappings, funnel stages, lead categories, and data validation rules.

## Database Architecture

### Table: `form_sessions`

The application uses a single table `form_sessions` in Supabase PostgreSQL to store all form data with the following key characteristics:

- **Primary Key**: `id` (UUID, auto-generated)
- **Unique Constraint**: `session_id` (text, unique identifier for each form session)
- **Row Level Security**: Enabled with policies for anonymous, authenticated, and service roles
- **Auto-Updated Timestamps**: `updated_at` field automatically updates on record changes

## Field Mappings

### Frontend to Database Field Mapping

The application uses **camelCase** in the frontend and **snake_case** in the database. Here's the complete mapping:

| Frontend Field | Database Field | Type | Purpose |
|---|---|---|---|
| `formFillerType` | `form_filler_type` | text | Who is filling the form (parent/student) |
| `studentName` | `student_name` | text | Student's full name |
| `currentGrade` | `current_grade` | text | Student's grade level |
| `phoneNumber` | `phone_number` | text | Combined country code + phone number |
| `curriculumType` | `curriculum_type` | text | Type of curriculum (IB, CBSE, etc.) |
| `gradeFormat` | `grade_format` | text | GPA or percentage format |
| `gpaValue` | `gpa_value` | text | GPA score out of 10 |
| `percentageValue` | `percentage_value` | text | Percentage score |
| `schoolName` | `school_name` | text | Name of student's school |
| `scholarshipRequirement` | `scholarship_requirement` | text | Scholarship needs |
| `targetGeographies` | `target_geographies` | jsonb | Array of target countries |
| `parentName` | `parent_name` | text | Parent's full name |
| `email` | `parent_email` | text | Parent's email address |
| `selectedDate` | `selected_date` | text | Chosen counseling date |
| `selectedSlot` | `selected_slot` | text | Chosen counseling time slot |

### System Fields

| Database Field | Type | Purpose | Default Value |
|---|---|---|---|
| `session_id` | text | Unique session identifier | Generated UUID |
| `environment` | text | Deployment environment | 'staging' or 'prod' |
| `lead_category` | text | Categorized lead type | Determined by logic |
| `funnel_stage` | text | Current stage in funnel | 'initial_capture' |
| `is_counselling_booked` | boolean | Whether counseling is scheduled | false |
| `is_qualified_lead` | boolean | Whether lead is qualified | false |
| `page_completed` | integer | Last completed page | 1 |
| `triggered_events` | jsonb | Array of tracking events | [] |
| `created_at` | timestamptz | Record creation time | now() |
| `updated_at` | timestamptz | Last update time | now() |

## Funnel Stages

### Valid Funnel Stage Values

| Stage | Description | Trigger Condition |
|---|---|---|
| `initial_capture` | Initial form data captured | Page 1 completion or any Page 1 section |
| `contact_submitted` | Contact information provided | Page 2 reached or contact details entered |
| `counseling_booked` | Counseling session scheduled | Date and time slot selected |
| `completed` | Form fully submitted | Final submission completed |

### Funnel Stage Logic

```javascript
// Funnel stage determination logic
const funnelStage = pageNumber === 1 ? 'initial_capture' : 
                   isCounsellingBooked ? 'counseling_booked' : 
                   'contact_submitted';
```

## Lead Categories

### Valid Lead Category Values

| Category | Description | Qualification Criteria |
|---|---|---|
| `bch` | Beacon House qualified leads | High-priority qualified leads |
| `lum-l1` | Luminaire Level 1 | Mid-priority qualified leads |
| `lum-l2` | Luminaire Level 2 | Lower-priority qualified leads |
| `nurture` | Nurture leads | Leads requiring development |
| `masters` | Masters applicants | Graduate program seekers |
| `drop` | Dropped leads | Grade 7 and below |

### Lead Qualification Logic

**Qualified Leads** (eligible for counseling booking):
- `bch`, `lum-l1`, `lum-l2`

**Disqualified Leads** (contact info only):
- `nurture`, `masters`, `drop`

## Data Validation Rules

### Required Fields by Form Stage

**Page 1 (Initial Capture)**:
- `form_filler_type` ✓
- `student_name` ✓
- `current_grade` ✓
- `phone_number` ✓
- `curriculum_type` ✓
- `school_name` ✓
- `grade_format` ✓
- `gpa_value` OR `percentage_value` ✓ (based on format)
- `scholarship_requirement` ✓
- `target_geographies` ✓ (array with at least 1 item)

**Page 2A (Qualified Leads)**:
- `parent_name` ✓
- `parent_email` ✓
- `selected_date` ✓
- `selected_slot` ✓

**Page 2B (Disqualified Leads)**:
- `parent_name` ✓
- `parent_email` ✓

### Data Type Validation

| Field Type | Validation Rules |
|---|---|
| **Email** | Must be valid email format |
| **Phone** | Must be 10 digits (after country code) |
| **GPA** | Must be between 1-10, allows decimals |
| **Percentage** | Must be between 1-100, allows decimals |
| **Target Geographies** | Must be array with valid options |
| **Grade Level** | Must be from predefined enum |
| **Curriculum** | Must be from predefined enum |

## Database Save Operations

### Incremental Save Strategy

The application uses an **incremental save** approach:

1. **Section-Level Saves**: Data is saved as users complete form sections
2. **Page-Level Saves**: Complete page data is saved on page transitions
3. **Final Save**: All data is consolidated on form submission

### Save Functions

#### `saveFormDataIncremental(sessionId, pageNumber, funnelStage, formData)`

Primary function for saving form data with upsert logic:

```javascript
// Example usage
await saveFormDataIncremental(
  sessionId,
  1,
  'initial_capture',
  {
    form_filler_type: 'parent',
    student_name: 'John Doe',
    current_grade: '11',
    // ... other fields
  }
);
```

#### Database RPC Function: `upsert_form_session`

Custom PostgreSQL function that handles:
- **Insert**: Creates new record if session doesn't exist
- **Update**: Updates existing record if session exists
- **Conflict Resolution**: Uses `session_id` as unique constraint

### Error Handling

**Primary Save Method**:
- Uses Supabase RPC function `upsert_form_session`
- Handles data validation and conflicts

**Fallback Method**:
- Direct table upsert using Supabase client
- Activates if RPC function fails
- Ensures form continues working even with database issues

## Data Flow Architecture

### Save Sequence

1. **Form Section Completion** → `trackFormSection()` → `saveFormDataIncremental()`
2. **Page Completion** → `trackPageCompletion()` → `saveFormDataIncremental()`
3. **Form Submission** → `trackFormSubmission()` → `saveFormDataIncremental()`

### Dual-Save Architecture

The application maintains **two data repositories**:

1. **Supabase Database** (Primary)
   - Real-time application data
   - Form tracking and analytics
   - Lead categorization

2. **Make.com Webhook** (Secondary)
   - Email notifications
   - External integrations
   - Google Sheets backup

## Security Considerations

### Row Level Security (RLS)

**Enabled Policies**:
- **Anonymous users**: Can create, read, and update form sessions
- **Authenticated users**: Full access to form sessions
- **Service role**: Complete administrative access

### Data Protection

**Field Sanitization**:
- Lead categories are validated and sanitized
- Phone numbers are combined with country codes
- Email addresses are validated for format

**Access Control**:
- All database operations go through RLS policies
- Environment-specific data isolation
- Audit trail through timestamps

## Environment Configuration

### Environment-Specific Settings

| Environment | Database Project | Table | Webhook Scenario |
|---|---|---|---|
| **Staging** | `apply-new-adms-lp-v2-staging` | `form_sessions` | `04.stg-apply-bch page v2` |
| **Production** | `apply-new-adms-lp-v2-prod` | `form_sessions` | `04.prod-apply-bch page v2` |

### Environment Variables Required

```bash
VITE_SUPABASE_URL=<project-specific-url>
VITE_SUPABASE_ANON_KEY=<project-specific-key>
VITE_ENVIRONMENT=stg|prod
VITE_REGISTRATION_WEBHOOK_URL=<make.com-webhook-url>
```

## Monitoring and Debugging

### Database Health Checks

**Available Functions**:
- `testDatabaseConnection()` - Verifies basic connectivity
- `testUpsertFunction()` - Tests RPC function availability
- `checkDatabaseHealth()` - Comprehensive health check

### Logging Strategy

**Debug Logs** (staging only):
- Form section completions
- Database save attempts
- Lead categorization decisions

**Error Logs** (always active):
- Database connection failures
- Validation errors
- RPC function failures

### Common Issues and Solutions

| Issue | Symptoms | Solution |
|---|---|---|
| **RPC Function Missing** | Fallback saves only | Deploy `upsert_form_session` to Supabase |
| **Environment Variables** | Connection errors | Verify all `VITE_` prefixed variables |
| **RLS Policy Conflicts** | Permission denied errors | Review and update RLS policies |
| **Data Type Mismatches** | Validation failures | Check field mappings and types |

This documentation provides a comprehensive overview of the database save logic, field specifications, and operational considerations for the Beacon House application.