# Form Structure & Branching Logic

**Version:** 2.1
**Last Updated:** 2026-01-13
**Purpose:** Quick reference for form fields and branching logic

---

## Form Overview

**2-Page Progressive Form** with conditional routing based on lead qualification.

**Pages:**
- Page 1: Initial Lead Capture (11 fields)
- Page 2A: Qualified Lead Form (4 fields) - For BCH, LUM-L1, LUM-L2
- Page 2B: Disqualified Lead Form (2 fields) - For NURTURE, MASTERS

**Special Cases:**
- Grade 7 or below → Submit immediately after Page 1 (no Page 2)
- Student form filler → Submit immediately after Page 1 (no Page 2)

---

## Page 1: Initial Lead Capture

### Section 1: Student Information (5 fields)

**1. Form Filler Type** (Select)
- Frontend: `formFillerType`
- Database: `form_filler_type`
- Options: `'parent'` | `'student'`
- Required: Yes
- Validation: Must select one

**2. Student's Name** (Text)
- Frontend: `studentName`
- Database: `student_name`
- Required: Yes
- Validation: Min 2 characters

**3. Grade in Academic Year 25-26** (Select)
- Frontend: `currentGrade`
- Database: `current_grade`
- Options: `'12'` | `'11'` | `'10'` | `'9'` | `'8'` | `'7_below'` | `'masters'`
- Required: Yes
- Validation: Must select one

**4. Current City/Town/Place of Residence** (Text)
- Frontend: `location`
- Database: `location`
- Required: Yes
- Validation: Min 2 characters

**5. Parent Phone Number** (Two-part: Country Code + Number)
- Frontend: `countryCode` + `phoneNumber`
- Database: `phone_number` (combined)
- Country Code Default: `"+91"`
- Phone Number Validation: Exactly 10 digits `/^[0-9]{10}$/`
- Required: Yes
- Storage: Combined as single string (e.g., "+919876543210")

---

### Section 2: Academic Information (5 fields)

**6. Curriculum Type** (Select)
- Frontend: `curriculumType`
- Database: `curriculum_type`
- Options: `'IB'` | `'IGCSE'` | `'CBSE'` | `'ICSE'` | `'State_Boards'` | `'Others'`
- Required: Yes
- Validation: Must select one

**7. School Name** (Text)
- Frontend: `schoolName`
- Database: `school_name`
- Required: Yes
- Validation: Min 2 characters

**8. Grade Format** (Toggle: GPA or Percentage)
- Frontend: `gradeFormat`
- Database: `grade_format`
- Options: `'gpa'` | `'percentage'`
- Default: `'gpa'`
- Required: Yes

**9a. GPA Value** (Text with decimal, shown if gradeFormat = 'gpa')
- Frontend: `gpaValue`
- Database: `gpa_value`
- Range: 1.0 to 10.0
- Pattern: `/^\d*\.?\d*$/`
- Required: Yes (if GPA format selected)
- Spam Detection: Value of "10" triggers NURTURE category

**9b. Percentage Value** (Text with decimal, shown if gradeFormat = 'percentage')
- Frontend: `percentageValue`
- Database: `percentage_value`
- Range: 1 to 100
- Pattern: `/^\d*\.?\d*$/`
- Required: Yes (if Percentage format selected)
- Spam Detection: Value of "100" triggers NURTURE category

---

### Section 3: Study Preferences (2 fields)

**10. Level of Scholarship Needed** (Radio cards)
- Frontend: `scholarshipRequirement`
- Database: `scholarship_requirement`
- Options:
  - `'full_scholarship'` - "Full scholarship needed"
  - `'partial_scholarship'` - "Partial scholarship needed"
  - `'scholarship_optional'` - "Scholarship optional"
- Required: Yes
- Validation: Must select one
- Critical: Used in lead categorization

**11. Target Geographies** (Checkbox group)
- Frontend: `targetGeographies` (array)
- Database: `target_geographies` (JSONB array)
- Options: `'US'` | `'UK'` | `'Rest of World'` | `'Need Guidance'`
- Required: Yes, minimum 1 selection
- Can select multiple
- Critical: Used in lead categorization

---

## Page 2A: Qualified Lead Form

**Shown To:** BCH, LUM-L1, LUM-L2 leads only

**After:** 10-second evaluation animation

### Fields (4 total)

**1. Selected Date** (Calendar picker - 7 days)
- Frontend: `selectedDate`
- Database: `selected_date`
- Format: "Weekday, Month Date, Year" (e.g., "Monday, December 4, 2025")
- Required: Yes
- Default: Today auto-selected
- Validation: Must select a date

**2. Selected Time Slot** (Dropdown on mobile, Buttons on desktop)
- Frontend: `selectedSlot`
- Database: `selected_slot`
- Options: "10 AM" to "8 PM" (excluding "2 PM")
- Required: Yes
- Validation: Must select a slot
- Filtering:
  - Today: Current hour + 2 minimum
  - Karthik (LUM-L1/LUM-L2): Mon-Sat only, 11AM-2PM & 4PM-8PM
  - Vishy (BCH): All days, all slots

**3. Parent's Name** (Text)
- Frontend: `parentName`
- Database: `parent_name`
- Required: Yes
- Validation: Min 2 characters

**4. Parent's Email** (Email)
- Frontend: `email`
- Database: `parent_email` ⚠️ Note: Field name changes
- Required: Yes
- Validation: Valid email format

---

## Page 2B: Disqualified Lead Form

**Shown To:** NURTURE, MASTERS leads

**No Animation:** Direct navigation from Page 1

### Fields (2 total)

**1. Parent's Name** (Text)
- Same as Page 2A Field 3

**2. Parent's Email** (Email)
- Same as Page 2A Field 4

---

## Form Branching Logic

### After Page 1 Submission

**Step 1: Lead Categorization**
- Runs automatically after Page 1 validation passes
- Determines one of 6 categories: BCH, LUM-L1, LUM-L2, NURTURE, MASTERS, DROP

**Step 2: Routing Decision**

```
IF currentGrade === '7_below':
  → Set lead_category = 'drop'
  → Submit form immediately (no Page 2)
  → Show success screen

ELSE IF formFillerType === 'student':
  → Set lead_category = 'nurture'
  → Submit form immediately (no Page 2)
  → Show success screen

ELSE IF lead_category IN ['bch', 'lum-l1', 'lum-l2']:
  → Show 10-second evaluation animation
  → Navigate to Page 2A (Qualified Lead Form)
  → Assign counselor:
      - BCH → Viswanathan Ramakrishnan
      - LUM-L1, LUM-L2 → Karthik Lakshman

ELSE IF lead_category IN ['nurture', 'masters']:
  → Navigate to Page 2B (Disqualified Lead Form)
  → Show category-specific messaging
```

---

## Lead Categorization Rules

### 6 Categories

1. **BCH** - Beacon House (highest priority)
2. **LUM-L1** - Luminaire Level 1
3. **LUM-L2** - Luminaire Level 2
4. **NURTURE** - Default for disqualified/spam
5. **MASTERS** - Masters program applicants
6. **DROP** - Too early for program (Grade 7 or below)

---

### Global Override Rules (Checked First)

**Rule 1: Student Form Filler → NURTURE**
```
IF formFillerType === 'student'
THEN return 'nurture'
```

**Rule 2: Spam Detection → NURTURE**
```
IF gpaValue === "10" OR percentageValue === "100"
THEN return 'nurture'
```

**Rule 3: Full Scholarship → NURTURE**
```
IF scholarshipRequirement === 'full_scholarship'
THEN return 'nurture'
```

**Rule 4: Grade 7 or Below → DROP**
```
IF currentGrade === '7_below'
THEN return 'drop'
```

**Rule 5: Masters Grade → MASTERS**
```
IF currentGrade === 'masters'
THEN return 'masters'
```

---

### Indian Curriculum Rules (CBSE, ICSE, State_Boards)

These curriculums have stricter qualification criteria. Checked before standard qualified lead rules.

**Indian Curriculum Rule 1: Grades 8-10 + Partial Scholarship → NURTURE**
```
IF curriculumType IN ['CBSE', 'ICSE', 'State_Boards']
AND currentGrade IN ['8', '9', '10']
AND scholarshipRequirement === 'partial_scholarship'
THEN return 'nurture'
```
Note: `scholarship_optional` still qualifies for BCH.

**Indian Curriculum Rule 2: Grades 11-12 → BCH (bypasses Luminaire)**
```
IF curriculumType IN ['CBSE', 'ICSE', 'State_Boards']
AND currentGrade IN ['11', '12']
AND scholarshipRequirement IN ['scholarship_optional', 'partial_scholarship']
THEN return 'bch'
```
Note: This overrides Luminaire L1/L2 categorization for Indian curriculums.

**International Curriculums (IB, IGCSE, Others)**
- Keep existing logic unchanged
- "Others" often represents American/British curriculum = high-paying families

---

### Qualified Lead Rules (Only if formFillerType === 'parent')

#### BCH Rules

**BCH Rule 1:**
```
IF currentGrade IN ['8', '9', '10']
AND scholarshipRequirement IN ['scholarship_optional', 'partial_scholarship']
THEN return 'bch'
```

**BCH Rule 2:**
```
IF currentGrade === '11'
AND scholarshipRequirement IN ['scholarship_optional', 'partial_scholarship']
AND targetGeographies includes 'US'
THEN return 'bch'
```

---

#### LUM-L1 Rules

**LUM-L1 Rule 1:**
```
IF currentGrade === '11'
AND scholarshipRequirement === 'scholarship_optional'
AND targetGeographies includes ANY OF ['UK', 'Rest of World', 'Need Guidance']
THEN return 'lum-l1'
```

**LUM-L1 Rule 2:**
```
IF currentGrade === '12'
AND scholarshipRequirement === 'scholarship_optional'
THEN return 'lum-l1'
```

---

#### LUM-L2 Rules

**LUM-L2 Rule 1:**
```
IF currentGrade === '11'
AND scholarshipRequirement === 'partial_scholarship'
AND targetGeographies includes ANY OF ['UK', 'Rest of World', 'Need Guidance']
THEN return 'lum-l2'
```

**LUM-L2 Rule 2:**
```
IF currentGrade === '12'
AND scholarshipRequirement === 'partial_scholarship'
THEN return 'lum-l2'
```

---

### Default Fallback

```
IF none of the above rules match
THEN return 'nurture'
```

---

## Counselor Assignment (Page 2A Only)

### Logic

```
IF lead_category === 'bch':
  → Show Viswanathan Ramakrishnan
  → All time slots available (10 AM - 8 PM, except 2 PM)
  → All days available

ELSE IF lead_category IN ['lum-l1', 'lum-l2']:
  → Show Karthik Lakshman
  → Restricted availability:
      - Monday-Saturday: 11 AM - 2 PM, 4 PM - 8 PM
      - Sunday: No availability
```

### Counselor Details

**Viswanathan Ramakrishnan (BCH)**
- Title: "Managing Partner"
- Image: "/vishy.png"
- LinkedIn: "https://www.linkedin.com/in/viswanathan-r-8504182/"
- Bio: "IIT-IIM alum with 20+ yrs in education..."

**Karthik Lakshman (LUM-L1, LUM-L2)**
- Title: "Managing Partner"
- Image: "/karthik.png"
- LinkedIn: "https://www.linkedin.com/in/karthiklakshman/"
- Bio: "Georgia Tech Masters graduate..."

---

## Validation Schemas

### Page 1 Schema (Zod)

```
- formFillerType: enum (required)
- studentName: string min 2 (required)
- currentGrade: enum (required)
- location: string min 2 (required)
- curriculumType: enum (required)
- gradeFormat: enum (required)
- gpaValue: string (required if gradeFormat = 'gpa')
- percentageValue: string (required if gradeFormat = 'percentage')
- schoolName: string min 2 (required)
- scholarshipRequirement: enum (required)
- targetGeographies: array min 1 (required)
- countryCode: string min 1, default "+91" (required)
- phoneNumber: string regex /^[0-9]{10}$/ (required)

Cross-field validation:
  - If gradeFormat = 'gpa' → gpaValue must be filled
  - If gradeFormat = 'percentage' → percentageValue must be filled
```

### Page 2A Schema (Zod)

```
- parentName: string min 2 (required)
- email: string email format (required)
- selectedDate: string min 1 (required)
- selectedSlot: string min 1 (required)
```

### Page 2B Schema (Zod)

```
- parentName: string min 2 (required)
- email: string email format (required)
```

---

## Error Handling

### Error Focus Order

When validation fails, focus first error field in this order:

**Page 1:**
1. formFillerType
2. studentName
3. currentGrade
4. location
5. countryCode
6. phoneNumber
7. curriculumType
8. schoolName
9. gradeFormat
10. gpaValue
11. percentageValue
12. scholarshipRequirement
13. targetGeographies

**Page 2A:**
1. selectedDate
2. selectedSlot
3. parentName
4. email

**Page 2B:**
1. parentName
2. email

---

## Field Mapping Reference

### Frontend → Database

| Frontend (camelCase) | Database (snake_case) |
|---------------------|----------------------|
| formFillerType | form_filler_type |
| studentName | student_name |
| currentGrade | current_grade |
| location | location |
| countryCode + phoneNumber | phone_number (combined) |
| curriculumType | curriculum_type |
| gradeFormat | grade_format |
| gpaValue | gpa_value |
| percentageValue | percentage_value |
| schoolName | school_name |
| scholarshipRequirement | scholarship_requirement |
| targetGeographies | target_geographies |
| parentName | parent_name |
| email | parent_email ⚠️ |
| selectedDate | selected_date |
| selectedSlot | selected_slot |

**Note:** Email field name changes from `email` (frontend) to `parent_email` (database/webhook).

---

## Success Messages

### Grade 7 or Below (DROP)
"Thank you for your interest. We'll reach out with guidance on preparing for university applications when the time is right."

### Student Form Filler (NURTURE)
"Thank you for your interest. Our team will review your profile and provide personalized guidance."

### Qualified Leads (Page 2A Submission)
"We've scheduled your counselling session for {date} at {time}. Our team will contact you soon to confirm."

### Disqualified Leads (Page 2B Submission)

**MASTERS:**
"Our Masters specialists will contact you within 48 hours to discuss your specific goals and create a customized application strategy."

**NURTURE:**
"Our admissions counsellors shall get back to you to discuss your specific needs and create a personalized roadmap for your university applications."

---

## Database Write Logic for form_sessions Table

### Field Population Types

**1. Direct Form Fields** (written as-is from form inputs):
- `student_name`, `current_grade`, `location`, `phone_number`
- `curriculum_type`, `grade_format`, `gpa_value`, `percentage_value`, `school_name`
- `scholarship_requirement`, `target_geographies`
- `parent_name`, `parent_email`
- `selected_date`, `selected_slot`
- `form_filler_type`

**2. System-Generated Fields** (computed before writing):
- `funnel_stage`, `lead_category`, `is_qualified_lead`, `is_counselling_booked`
- `page_completed`, `triggered_events`
- `session_id`, `environment`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`

---

### Computed Field Logic

#### 1. lead_category
**File:** `src/lib/leadCategorization.ts`
**Function:** `categorizeLeadByProgram()`
**When:** After Page 1 submission, before navigation
**Values:** `'bch'` | `'lum-l1'` | `'lum-l2'` | `'nurture'` | `'masters'` | `'drop'`

**Logic:**
- Evaluates form data against hierarchical rules
- Override rules checked first (student form filler, spam detection, full scholarship)
- Then qualified lead rules (BCH, LUM-L1, LUM-L2)
- Fallback to 'nurture' if no match
- See "Lead Categorization Rules" section above for full logic

#### 2. is_qualified_lead
**File:** `src/components/forms/InitialLeadCaptureForm.tsx`
**When:** Set during Page 1 submission
**Values:** `true` | `false`

**Logic:**
```javascript
is_qualified_lead = lead_category === 'bch' ||
                    lead_category === 'lum-l1' ||
                    lead_category === 'lum-l2'
```

#### 3. funnel_stage
**File:** `src/lib/formTracking.ts` (via analytics events)
**When:** Updated at each major step
**Values:** String stages from `'01_form_start'` to `'10_form_submit'`

**Logic:**
- `'01_form_start'` - Set when form mounts (FormPage.tsx)
- `'02_page1_student_info_filled'` - After student info section filled
- `'03_page1_academic_info_filled'` - After academic info section filled
- `'04_page1_scholarship_info_filled'` - After scholarship section filled
- `'05_page1_complete'` - After Page 1 validation passes
- `'06_lead_evaluated'` - After evaluation animation (qualified only)
- `'07_page_2_view'` - When Page 2 loads
- `'08_page_2_counselling_slot_selected'` - When date/time selected (qualified only)
- `'09_page_2_parent_details_filled'` - After parent fields filled
- `'10_form_submit'` - Final submission

**Updated via:** `saveFormDataIncremental()` function in formTracking.ts

#### 4. is_counselling_booked
**File:** `src/components/forms/QualifiedLeadForm.tsx`
**When:** When date and time slot are both selected (Page 2A only)
**Values:** `true` | `false` (default: false)

**Logic:**
```javascript
is_counselling_booked = selectedDate !== '' && selectedSlot !== ''
```

#### 5. page_completed
**File:** `src/lib/formTracking.ts`
**When:** Updated at navigation points
**Values:** `1` | `2`

**Logic:**
- Set to `1` when Page 1 completes
- Set to `2` when navigating to Page 2 (any variant)

#### 6. triggered_events
**File:** `src/lib/analytics.ts` & `src/lib/formTracking.ts`
**When:** Updated each time an event is tracked
**Values:** JSONB array of event names

**Logic:**
- Array appends each funnel_stage as it occurs
- Example: `['01_form_start', '02_page1_student_info_filled', '05_page1_complete']`
- Used to track user journey and prevent duplicate event firing

#### 7. session_id
**File:** `src/store/formStore.ts`
**Function:** `initializeSession()`
**When:** Form component mounts (once per user session)
**Values:** UUID string

**Logic:**
```javascript
session_id = crypto.randomUUID()
```

#### 8. environment
**File:** `src/lib/formTracking.ts`
**When:** Set on every database write
**Values:** `'development'` | `'production'`

**Logic:**
```javascript
environment = import.meta.env.MODE
```

#### 9. UTM Parameters
**File:** `src/lib/utm.ts`
**Function:** `extractUtmParams()`
**When:** Captured on form load from URL query string
**Values:** String values from URL params

**Logic:**
- Reads from URL: `?utm_source=google&utm_medium=cpc&...`
- Extracts: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`
- Stored in Zustand: `useFormStore.getState().utmParams`
- Written to DB on first save

---

### Database Write Flow

**Primary Function:** `saveFormDataIncremental()`
**Location:** `src/lib/formTracking.ts`

**Process:**
1. Get current form data from Zustand store
2. Get session_id and environment
3. Convert camelCase fields to snake_case
4. Compute derived fields (if needed):
   - `lead_category` (if Page 1 complete)
   - `is_qualified_lead` (based on lead_category)
   - `is_counselling_booked` (if date/time selected)
5. Add current funnel_stage to triggered_events array
6. Call `supabase.rpc('upsert_form_session', { p_session_id, p_form_data })`
7. Fallback to direct upsert if RPC fails

**COALESCE Behavior:**
- Database function uses COALESCE to preserve existing non-null values
- New values only overwrite if they are non-null
- Allows incremental saves without data loss

---

**END OF FORM STRUCTURE DOCUMENTATION**

This provides a complete reference for form fields, validation, branching logic, and database write logic.
