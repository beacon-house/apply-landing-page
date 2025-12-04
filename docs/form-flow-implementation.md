# Form Flow & Implementation Guide

**Version:** 2.0
**Last Updated:** 2025-12-04
**Purpose:** Complete guide to implementing the Beacon House application form UI, validation, and user flow

---

## Table of Contents

1. [Form Architecture](#form-architecture)
2. [User Journey & Flow](#user-journey--flow)
3. [Page 1: Initial Lead Capture](#page-1-initial-lead-capture)
4. [Lead Categorization Logic](#lead-categorization-logic)
5. [Page 2A: Qualified Lead Form](#page-2a-qualified-lead-form)
6. [Page 2B: Disqualified Lead Form](#page-2b-disqualified-lead-form)
7. [Validation Rules](#validation-rules)
8. [Error Handling & UX](#error-handling--ux)
9. [State Management](#state-management)

---

## Form Architecture

### Overview
The application uses a **2-page progressive form** with conditional routing based on lead qualification. The form is built with React, TypeScript, and React Hook Form with Zod validation.

### Core Technology Stack
- **Forms:** React Hook Form (uncontrolled components with registration)
- **Validation:** Zod schemas (TypeScript-first validation)
- **State:** Zustand (lightweight global state)
- **Routing:** React Router (SPA navigation)
- **UI Components:** Radix UI primitives with custom styling

### Design Principles
1. **Mobile-First:** All forms optimized for mobile screens, desktop as enhancement
2. **Progressive Disclosure:** Split complexity across pages, show only relevant fields
3. **Sticky CTAs:** Bottom-fixed submit buttons appear after scroll for better conversion
4. **Inline Validation:** Errors shown immediately below fields, no toast notifications
5. **Auto-Focus Errors:** First error field automatically focused and scrolled into view

### Component Structure

```
FormContainer (Orchestrator)
├── InitialLeadCaptureForm (Page 1)
├── SequentialLoadingAnimation (Evaluation screen for qualified leads)
├── QualifiedLeadForm (Page 2A - Counseling booking)
└── DisqualifiedLeadForm (Page 2B - Contact info only)
```

**FormContainer Responsibilities:**
- Manages current step (page number)
- Handles form submission routing
- Triggers lead categorization after Page 1
- Shows loading animation for qualified leads
- Decides which Page 2 form to show

---

## User Journey & Flow

### Complete Flow Diagram

```
Landing Page (CTA Click)
    ↓
┌─────────────────────────────────────┐
│  Page 1: Initial Lead Capture       │
│  (11 fields across 3 sections)      │
└─────────────────────────────────────┘
    ↓ (Click "Continue")
    ↓ (Validation passes)
    ↓
┌─────────────────────────────────────┐
│  Lead Categorization (Automatic)    │
│  Determines: BCH/LUM-L1/LUM-L2/     │
│  NURTURE/MASTERS/DROP               │
└─────────────────────────────────────┘
    ↓
    ├─ Grade 7 or below? ───────────────────→ Submit immediately (DROP) → Success
    │
    ├─ Student form filler? ────────────────→ Submit immediately (NURTURE) → Success
    │
    ├─ Qualified Lead (BCH/LUM-L1/LUM-L2)? ─┐
    │                                        ↓
    │                           ┌────────────────────────────┐
    │                           │ 10-Second Evaluation       │
    │                           │ Animation (3 steps)        │
    │                           └────────────────────────────┘
    │                                        ↓
    │                           ┌────────────────────────────┐
    │                           │ Page 2A: Counseling        │
    │                           │ Booking (4 fields)         │
    │                           └────────────────────────────┘
    │                                        ↓
    │                           (Click "Submit Application")
    │                                        ↓
    │                                   Success Page
    │
    └─ Disqualified Lead (NURTURE/MASTERS)? ─┐
                                             ↓
                                ┌────────────────────────────┐
                                │ Page 2B: Contact Info      │
                                │ Only (2 fields)            │
                                └────────────────────────────┘
                                             ↓
                                (Click "Submit Application")
                                             ↓
                                        Success Page
```

### Key Decision Points

**Decision 1: After Page 1 Submission**
- **Grade 7 or below** → Immediate submission, no Page 2
- **Student form filler** → Immediate submission, no Page 2
- **Qualified parent** → Show evaluation animation → Page 2A
- **Disqualified parent** → Page 2B

**Decision 2: Counselor Assignment (Page 2A only)**
- **BCH category** → Show Viswanathan Ramakrishnan
- **LUM-L1 or LUM-L2** → Show Karthik Lakshman

### Navigation Rules

**Forward Navigation:**
- Page 1 → Lead categorization → Animation OR Page 2
- Page 2A/2B → Success screen
- No skipping pages

**Back Navigation:**
- Page 2 has "Back" button → Returns to Page 1
- Form data persists when going back
- Re-submission re-categorizes the lead

**Success Screen:**
- Final state, no navigation away
- Different messages based on lead category and booking status

---

## Page 1: Initial Lead Capture

### Purpose
Capture all essential information needed to qualify the lead and determine their eligibility for counseling booking. This is the most complex page with 11 fields across 3 logical sections.

### Section 1: Student Information (5 fields)

#### Field 1: Form Filler Type
**Purpose:** Identify who is filling the form (critical for lead categorization)

**UI Component:** Select dropdown (Radix UI)

**Field Names:**
- Frontend: `formFillerType`
- Database: `form_filler_type`

**Options:**
1. Value: `'parent'` → Label: "I am the Parent"
2. Value: `'student'` → Label: "I am the Student"

**Validation:**
- Required: Yes
- Must be one of the two options
- Error message: "Please answer this question"

**Styling:**
- Height: 48px (h-12)
- Background: White
- Border: Gray, red on error
- Icon: Dropdown chevron

**Data Attribute:** `data-field="formFillerType"`

**Special Logic:**
- If "student" selected → Form will be categorized as NURTURE and submitted immediately after Page 1
- This is a critical branching field

---

#### Field 2: Student's Name
**Purpose:** Capture student's full name for personalization and records

**UI Component:** Text input

**Field Names:**
- Frontend: `studentName`
- Database: `student_name`

**Validation:**
- Required: Yes
- Minimum length: 2 characters
- Error message: "Please enter the student's full name"

**Placeholder:** "Enter student's full name"

**Styling:**
- Height: 48px
- Full width
- Red border on error

**Data Attribute:** `data-field="studentName"`

**Usage:**
- Displayed in Page 2A congratulations message
- Used in success message personalization

---

#### Field 3: Grade in Academic Year 25-26
**Purpose:** Determine student's current academic level (critical for lead categorization)

**UI Component:** Select dropdown

**Field Names:**
- Frontend: `currentGrade`
- Database: `current_grade`

**Options (in order):**
1. Value: `'12'` → Label: "Grade 12"
2. Value: `'11'` → Label: "Grade 11"
3. Value: `'10'` → Label: "Grade 10"
4. Value: `'9'` → Label: "Grade 9"
5. Value: `'8'` → Label: "Grade 8"
6. Value: `'7_below'` → Label: "Grade 7 or below"
7. Value: `'masters'` → Label: "Apply for Masters"

**Validation:**
- Required: Yes
- Must be one of the seven options
- Error message: "Please answer this question"

**Special Logic:**
- `'7_below'` → Immediate submission with DROP category
- `'masters'` → Categorized as MASTERS
- Grades 8-12 → Eligible for qualification based on other factors

**Data Attribute:** `data-field="currentGrade"`

---

#### Field 4: Current City/Town/Place of Residence
**Purpose:** Capture student's geographic location

**UI Component:** Text input

**Field Names:**
- Frontend: `location`
- Database: `location`

**Validation:**
- Required: Yes
- Minimum length: 2 characters
- Error message: "Please enter your current city/town/place of residence"

**Placeholder:** "e.g., Mumbai, London, New York"

**Data Attribute:** `data-field="location"`

**Notes:**
- Free-form text, no validation on format
- Used for geographic analysis and outreach

---

#### Field 5: Parent Phone Number (Two-part field)
**Purpose:** Capture parent's contact number for follow-up

**UI Component:** Two text inputs side-by-side

**Field Names:**
- Frontend: `countryCode` + `phoneNumber` (separate)
- Database: `phone_number` (combined as single string)

**Part 1: Country Code**
- Default value: "+91"
- Type: Text input (tel inputMode)
- Width: 96-112px (w-24 md:w-28)
- Validation: Minimum 1 character
- Error message: "Please enter a valid country code"
- Data attribute: `data-field="countryCode"`

**Part 2: Phone Number**
- Type: Text input (tel inputMode)
- Placeholder: "10 digit mobile number"
- Validation: Must match regex `/^[0-9]{10}$/` (exactly 10 digits)
- Error message: "Please enter a valid 10-digit phone number"
- Data attribute: `data-field="phoneNumber"`

**Layout:**
- Flexbox container with gap
- Country code field is narrow (fixed width)
- Phone number field expands to fill remaining space

**Storage:**
- Combined into single string: countryCode + phoneNumber
- Example: "+919876543210"
- No separation logic on retrieval (stored as-is)

**Styling:**
- Both fields: 48px height
- Error state affects both fields independently

---

### Section 2: Academic Information (5 fields)

#### Field 6: Curriculum Type
**Purpose:** Identify student's educational system

**UI Component:** Select dropdown

**Field Names:**
- Frontend: `curriculumType`
- Database: `curriculum_type`

**Options:**
1. `'IB'` → "IB"
2. `'IGCSE'` → "IGCSE"
3. `'CBSE'` → "CBSE"
4. `'ICSE'` → "ICSE"
5. `'State_Boards'` → "State Boards"
6. `'Others'` → "Others"

**Validation:**
- Required: Yes
- Error message: "Please answer this question"

**Data Attribute:** `data-field="curriculumType"`

---

#### Field 7: School Name
**Purpose:** Capture student's current school

**UI Component:** Text input

**Field Names:**
- Frontend: `schoolName`
- Database: `school_name`

**Validation:**
- Required: Yes
- Minimum length: 2 characters
- Error message: "Please answer this question"

**Placeholder:** "Enter your school name"

**Data Attribute:** `data-field="schoolName"`

---

#### Field 8: Grade Format Selection (Toggle)
**Purpose:** Choose between GPA or Percentage grading system

**UI Component:** Two toggle buttons (custom styled, not native radio)

**Field Names:**
- Frontend: `gradeFormat`
- Database: `grade_format`

**Options:**
1. Value: `'gpa'` → Label: "GPA Format"
2. Value: `'percentage'` → Label: "Percentage Format"

**Default Value:** `'gpa'`

**Button Styling:**
- Selected state: Navy blue background, white text, navy border
- Unselected state: White background, gray text, gray border, hover effect
- Grid layout: 2 columns, equal width
- Height: 48px each

**Behavior:**
- Clicking a button:
  1. Sets gradeFormat to that value
  2. Clears the other field (gpaValue or percentageValue)
  3. Clears any errors on the newly selected field

**Cross-field Impact:**
- Selecting "GPA Format" → Shows GPA input, hides Percentage input
- Selecting "Percentage Format" → Shows Percentage input, hides GPA input

**Data Attribute:** None (buttons are onClick handlers, not form fields)

---

#### Field 9a: GPA Value (Conditional - shown if gradeFormat === 'gpa')
**Purpose:** Capture student's GPA on a 10-point scale

**UI Component:** Text input with decimal support

**Field Names:**
- Frontend: `gpaValue`
- Database: `gpa_value`

**Input Type:**
- Type attribute: `text` (not number, for better control)
- InputMode: `decimal` (shows decimal keyboard on mobile)

**Validation:**
- Required: Yes (only if gradeFormat is 'gpa')
- Must be numeric with optional single decimal point
- Minimum value: 1.0
- Maximum value: 10.0
- Regex pattern: `/^\d*\.?\d*$/`
- Error message: "Please answer this question"

**Placeholder:** "Enter GPA value (e.g. 8.5)"

**Visual Suffix:** "/10" (displayed to the right, not part of input value)

**Custom Input Handler:**
```
handleNumericInput(event, min=1, max=10, fieldName='gpaValue'):
  1. Allow empty input (user can delete)
  2. Allow single "." without digits
  3. Validate against regex /^\d*\.?\d*$/
  4. If invalid character entered, remove last character
  5. If valid number:
     - Parse as float
     - If < 1, set to 1
     - If > 10, set to 10
     - Update form value with clamped result
```

**Data Attribute:** `data-field="gpaValue"`

**Special Logic - Spam Detection:**
- If value equals exactly "10", lead will be categorized as NURTURE (spam detection)

---

#### Field 9b: Percentage Value (Conditional - shown if gradeFormat === 'percentage')
**Purpose:** Capture student's percentage score

**UI Component:** Text input with decimal support

**Field Names:**
- Frontend: `percentageValue`
- Database: `percentage_value`

**Input Type:**
- Type attribute: `text`
- InputMode: `decimal`

**Validation:**
- Required: Yes (only if gradeFormat is 'percentage')
- Must be numeric with optional single decimal point
- Minimum value: 1
- Maximum value: 100
- Regex pattern: `/^\d*\.?\d*$/`
- Error message: "Please answer this question"

**Placeholder:** "Enter percentage (e.g. 85)"

**Visual Suffix:** "%" (displayed to the right, not part of input value)

**Custom Input Handler:**
```
handleNumericInput(event, min=1, max=100, fieldName='percentageValue'):
  [Same logic as GPA, but with 1-100 range]
```

**Data Attribute:** `data-field="percentageValue"`

**Special Logic - Spam Detection:**
- If value equals exactly "100", lead will be categorized as NURTURE (spam detection)

---

### Section 3: Study Preferences (2 fields)

#### Field 10: Level of Scholarship Needed
**Purpose:** Determine financial support requirements (critical for lead categorization)

**UI Component:** Radio button group styled as cards

**Field Names:**
- Frontend: `scholarshipRequirement`
- Database: `scholarship_requirement`

**Options (3 cards):**

**Option 1: Full Scholarship Needed**
- Value: `'full_scholarship'`
- Label: "Full scholarship needed"
- Description: "I require 100% financial assistance to pursue my studies"
- UI: Card with radio button, title, description
- Card styling: Padding, border, rounded corners, hover state

**Option 2: Partial Scholarship Needed**
- Value: `'partial_scholarship'`
- Label: "Partial scholarship needed"
- Description: "I can cover some costs but require partial financial support"

**Option 3: Scholarship Optional**
- Value: `'scholarship_optional'`
- Label: "Scholarship optional"
- Description: "I can pursue my studies without scholarship support"

**Validation:**
- Required: Yes
- Must select exactly one option
- Error message: "Please answer this question"

**Helper Text (Above options):**
"Please select your scholarship requirements:"

**Card Styling:**
- Border: Light gray (200), red on error
- Background: White
- Hover: Light gray background (50)
- Padding: 12px (p-3)
- Rounded: 8px (rounded-lg)
- Transition: colors

**Radio Button Styling:**
- Native HTML radio input
- Position: Left side of card content
- Margin: 2px top alignment

**Container Data Attribute:** `data-field="scholarshipRequirement"` + `id="scholarshipRequirement"`

**Special Logic - Lead Categorization:**
- `'full_scholarship'` → Always categorized as NURTURE (global override)
- `'scholarship_optional'` → Eligible for BCH/LUM-L1 qualification
- `'partial_scholarship'` → Eligible for BCH/LUM-L2 qualification

---

#### Field 11: Target Geographies
**Purpose:** Determine preferred study destinations (affects lead categorization)

**UI Component:** Checkbox group (multiple selections allowed)

**Field Names:**
- Frontend: `targetGeographies` (array)
- Database: `target_geographies` (JSONB array)

**Options (4 checkboxes with budget info):**

1. **US**
   - Value: `'US'`
   - Display: "US (Rs. 1.6-2 Cr)"
   - Budget info included in label

2. **UK**
   - Value: `'UK'`
   - Display: "UK (Rs. 1.2-1.6 Cr)"

3. **Rest of World**
   - Value: `'Rest of World'`
   - Display: "Rest of World"

4. **Need Guidance**
   - Value: `'Need Guidance'`
   - Display: "Need Guidance"

**Validation:**
- Required: Yes
- Minimum selections: 1
- Maximum selections: Unlimited (can select all)
- Error message: "Please answer this question"

**Helper Text (Above options):**
"Select your preferred study destinations"

**Layout:**
- Mobile: 1 column grid
- Desktop: 2 columns grid
- Gap between items: 12px (gap-3)

**Checkbox Container Styling:**
- Padding: 8px (p-2)
- Hover: Light gray background (hover:bg-gray-50)
- Rounded: 8px (rounded-lg)
- Transition: colors
- Flex layout: checkbox + label

**Checkbox Styling:**
- Rounded: Yes (rounded class)
- Border: Gray 300
- Checked color: Navy blue (primary)
- Focus ring: Primary color
- Margin top: 4px (alignment)

**Storage:**
- Stored as array of strings: `['US', 'UK']`
- Budget info stripped before storage (only country/option name saved)
- Example stored value: `['US', 'UK', 'Need Guidance']`

**Container Data Attribute:** `data-field="targetGeographies"` + `id="targetGeographies"`

**Special Logic - Lead Categorization:**
- Including 'US' can qualify for BCH
- Including 'UK', 'Rest of World', or 'Need Guidance' can qualify for LUM-L1/L2
- Multiple selections increase qualification chances

---

### Page 1: UI/UX Features

#### Sticky Continue Button

**Behavior:**
- Initially hidden
- Appears when user scrolls down 200px
- Fixed to bottom of viewport
- Slides up smoothly on first appearance

**Implementation:**
```
On scroll:
  If scrollY > 200:
    Show sticky button
  Else:
    Hide sticky button

Scroll listener:
  - Throttled with requestAnimationFrame
  - Passive: true (for performance)
  - Check every 10ms with setTimeout debounce
```

**Button Styling:**
- Background: Golden yellow (accent color: #FFC736)
- Text: Navy blue (primary color: #002F5C)
- Width: Full width (w-full)
- Padding: Vertical 16px (py-4)
- Font: Bold, base/lg size
- Border radius: 8px (rounded-lg)
- Shadow: Medium (shadow-md), increases on hover
- Icon: ChevronRight (arrow pointing right)
- Space between text and icon: 8px

**Button States:**
- Default: Yellow background, visible
- Hover: Lighter yellow, larger shadow
- Active/Submitting: Loading state (no special styling currently)
- Disabled: Never disabled (validation on click)

**Container Styling:**
- Position: Fixed bottom-0 left-0 right-0
- Z-index: 50 (high layer)
- Background: White
- Border top: Light gray
- Padding: 16px all sides
- Shadow: Large (shadow-lg)
- Animation: slide-up (0.3s ease-out)

**Progress Hint (Below Button):**
- Text: "Step 1 of 2 • Takes less than 2 minutes"
- Font size: Extra small (text-xs)
- Color: Gray 600
- Centered

**Bottom Padding Spacer:**
- When sticky button is visible, add 96px (h-24) padding at bottom of form
- Prevents content from being hidden behind button

**Click Behavior:**
- Triggers form validation
- If validation fails → Focus first error field
- If validation passes → Proceed to lead categorization

---

#### Section Headers

Each section (Student Information, Academic Information, Study Preferences) has:
- Icon (User, GraduationCap, Trophy respectively)
- Icon size: 20px (w-5 h-5)
- Icon color: Navy blue (primary)
- Header text: 18px, semibold, primary color
- Margin bottom: 24px

---

#### Form Card Styling

Each section is wrapped in a card:
- Background: White
- Border radius: 12px (rounded-xl)
- Padding: 24px (p-6)
- Shadow: Small (shadow-sm)
- Border: 1px solid gray 100
- Margin bottom: 32px (mb-8) between sections

---

#### Error Display

When validation fails:
- Error message appears below field
- Text size: Small (text-sm)
- Color: Red 500
- Font style: Italic
- Margin top: 8px

Field with error:
- Border color: Red 500
- Focus border: Red 500 (overrides default blue)

---

#### Desktop vs Mobile Layout

**Mobile (< 577px):**
- Single column layout
- Full width fields
- Compact spacing
- Sticky button always full width

**Desktop (≥ 577px):**
- Form contained in max-w-5xl container (1024px)
- Background: White card with shadow
- More generous padding
- Fields maintain comfortable reading width

---

### Page 1: Form Submission Flow

```
User clicks Continue button (sticky or inline)
    ↓
Prevent default form submission
    ↓
Check if already submitting (prevent double-submit)
    ↓
Set isSubmitting = true
    ↓
Run React Hook Form validation
    ↓
    ├─ VALIDATION FAILS
    │       ↓
    │   Get error field names from errors object
    │       ↓
    │   Find first error field using FIELD_ORDER
    │       ↓
    │   Wait 300ms (allow DOM to stabilize)
    │       ↓
    │   Focus that field:
    │       1. Find element by data-field attribute
    │       2. Scroll into view
    │       3. Call .focus() on input
    │       ↓
    │   Display error messages below fields
    │       ↓
    │   Set isSubmitting = false
    │       ↓
    │   Stop (don't proceed)
    │
    └─ VALIDATION PASSES
            ↓
        Call onSubmit handler with form data
            ↓
        Update Zustand store with all Page 1 data
            ↓
        Run lead categorization logic
            ↓
        Update store with lead_category
            ↓
        Fire Meta Pixel events (5-8 events)
            ↓
        Add events to triggeredEvents array in store
            ↓
        Save Page 1 complete to database
            ↓
        Check routing logic:
            ↓
            ├─ Grade 7 or below?
            │       ↓
            │   Set lead_category = 'drop'
            │   Fire form_complete events
            │   Submit form to database + webhook
            │   Set isSubmitted = true
            │   Show success screen
            │
            ├─ Student form filler?
            │       ↓
            │   Keep lead_category = 'nurture'
            │   Fire form_complete events
            │   Submit form to database + webhook
            │   Set isSubmitted = true
            │   Show success screen
            │
            ├─ Qualified lead (BCH/LUM-L1/LUM-L2)?
            │       ↓
            │   Scroll to top (smooth)
            │   Set isSubmitting = true (for animation)
            │   Show 10-second evaluation animation
            │       ↓
            │   After 10 seconds:
            │       Set showEvaluationAnimation = false
            │       Set isSubmitting = false
            │       Set currentStep = 2
            │       Fire page_2_view events
            │       Save lead_evaluated to database
            │       Scroll to top (smooth)
            │       Show Page 2A (QualifiedLeadForm)
            │
            └─ Disqualified lead (NURTURE/MASTERS)?
                    ↓
                Scroll to top (smooth)
                Set currentStep = 2
                Fire page_2_view events
                Save page_2_view to database
                Show Page 2B (DisqualifiedLeadForm)
```

---

### Evaluation Animation (Qualified Leads Only)

**Component:** SequentialLoadingAnimation

**Trigger:** After Page 1 submission for BCH/LUM-L1/LUM-L2 leads

**Duration:** 10 seconds total (3 steps × 3.5 seconds + 300ms buffer)

**Steps:**

**Step 1 (3.5 seconds):**
- Message: "Analyzing your academic profile and curriculum fit" (regular grades)
- Message: "Analyzing your profile and program fit" (masters grade)
- Progress bar fills over 3.5 seconds
- Numbered circle shows "1"

**Step 2 (3.5 seconds):**
- Message: "Processing admission criteria and program compatibility" (regular)
- Message: "Processing graduate admission criteria" (masters)
- Progress bar fills over 3.5 seconds
- Previous step shows green checkmark
- Current step shows "2"

**Step 3 (3.5 seconds):**
- Message: "Connecting you with our Beacon House admission experts"
- Progress bar fills over 3.5 seconds
- Previous steps show green checkmarks
- Current step shows "3"

**After Completion (+300ms):**
- All steps show green checkmarks
- Animation fades out
- Navigate to Page 2A

**Visual Design:**
- Full-screen white overlay (z-index 50)
- Centered content card (white, rounded, shadow)
- Heading: "Analyzing Your Profile" (bold, primary color)
- Subtext: "Please wait while we evaluate your information"
- Step circles: Navy border (current), Green fill (completed), Gray (pending)
- Progress bars: Navy blue fill, gray background
- Pulsing dots below current step (3 dots, staggered animation)

**User Experience:**
- Cannot skip or close animation
- No interaction possible during animation
- Smooth transition to Page 2A after completion

---

## Lead Categorization Logic

### Overview
Lead categorization happens **immediately after Page 1 validation passes** and **before any navigation**. The system assigns one of 6 categories based on a hierarchical decision tree.

### Categories (6 Total)

1. **'bch'** - Beacon House (highest priority qualified leads)
2. **'lum-l1'** - Luminaire Level 1 (medium priority qualified leads)
3. **'lum-l2'** - Luminaire Level 2 (lower priority qualified leads)
4. **'nurture'** - Nurture (default for disqualified leads and spam)
5. **'masters'** - Masters program applicants
6. **'drop'** - Grade 7 or below (too early for program)

### Decision Tree

The categorization follows a **strict order of precedence**. Each rule is checked from top to bottom, and the first matching rule determines the category.

---

### TIER 1: Global Override Rules (Checked First)

These rules override all other logic and return immediately.

#### Rule 1: Student Form Filler → NURTURE
```
IF formFillerType === 'student'
THEN
    return 'nurture'
    AND submit form immediately (no Page 2)
```

**Rationale:** Students filling their own forms are less qualified leads. They bypass Page 2 entirely.

---

#### Rule 2: Spam Detection (Perfect Scores) → NURTURE
```
IF gpaValue === "10" (as string, exact match)
OR percentageValue === "100" (as string, exact match)
THEN
    return 'nurture'
```

**Rationale:** Perfect scores (10.0 GPA or 100%) are flagged as potential spam or unserious submissions.

**Note:** This checks the string value exactly. "10.0" would not match (though unlikely due to input handling).

---

#### Rule 3: Full Scholarship Requirement → NURTURE
```
IF scholarshipRequirement === 'full_scholarship'
THEN
    return 'nurture'
```

**Rationale:** Students requiring 100% financial aid are not current target customers.

---

#### Rule 4: Grade 7 or Below → DROP
```
IF currentGrade === '7_below'
THEN
    return 'drop'
    AND submit form immediately (no Page 2)
```

**Rationale:** Students too young for the program. Form ends at Page 1.

---

#### Rule 5: Masters Grade → MASTERS
```
IF currentGrade === 'masters'
THEN
    return 'masters'
```

**Rationale:** Masters applicants are a separate category with different counseling needs.

---

### TIER 2: Qualified Lead Rules (Only for formFillerType === 'parent')

If none of the global overrides match AND formFillerType is 'parent', check these rules in order:

#### BCH Category Rules

**BCH Rule 1: Grades 8-10 + Scholarship Optional/Partial**
```
IF currentGrade IN ['8', '9', '10']
AND scholarshipRequirement IN ['scholarship_optional', 'partial_scholarship']
THEN
    return 'bch'
```

**BCH Rule 2: Grade 11 + US Geography + Scholarship Optional/Partial**
```
IF currentGrade === '11'
AND scholarshipRequirement IN ['scholarship_optional', 'partial_scholarship']
AND targetGeographies includes 'US'
THEN
    return 'bch'
```

**Note:** "includes" means the array contains 'US' (can have other selections too)

---

#### LUM-L1 Category Rules

**LUM-L1 Rule 1: Grade 11 + Scholarship Optional + (UK/Rest of World/Need Guidance)**
```
IF currentGrade === '11'
AND scholarshipRequirement === 'scholarship_optional'
AND targetGeographies includes at least one of ['UK', 'Rest of World', 'Need Guidance']
THEN
    return 'lum-l1'
```

**LUM-L1 Rule 2: Grade 12 + Scholarship Optional**
```
IF currentGrade === '12'
AND scholarshipRequirement === 'scholarship_optional'
THEN
    return 'lum-l1'
```

---

#### LUM-L2 Category Rules

**LUM-L2 Rule 1: Grade 11 + Partial Scholarship + (UK/Rest of World/Need Guidance)**
```
IF currentGrade === '11'
AND scholarshipRequirement === 'partial_scholarship'
AND targetGeographies includes at least one of ['UK', 'Rest of World', 'Need Guidance']
THEN
    return 'lum-l2'
```

**LUM-L2 Rule 2: Grade 12 + Partial Scholarship**
```
IF currentGrade === '12'
AND scholarshipRequirement === 'partial_scholarship'
THEN
    return 'lum-l2'
```

---

### TIER 3: Default Fallback

```
IF none of the above rules match
THEN
    return 'nurture'
```

**Rationale:** Any lead that doesn't fit qualified criteria becomes a nurture lead for future follow-up.

---

### Implementation Notes

**Function Location:** `/src/lib/leadCategorization.ts`

**Function Signature:**
```typescript
determineLeadCategory(
  currentGrade: string,
  formFillerType: string,
  scholarshipRequirement: string,
  curriculumType: string,
  gpaValue?: string,
  percentageValue?: string,
  targetGeographies?: string[]
): LeadCategory
```

**Validation:**
- After determining category, validate it's one of the 6 valid categories
- If invalid, log error with full context and fallback to 'nurture'
- Never throw error that blocks form submission

**Storage:**
- Result stored in Zustand formData as `lead_category`
- Saved to database as `lead_category` field
- Used to calculate `is_qualified_lead` boolean (true if bch/lum-l1/lum-l2)

---

### Examples

**Example 1: Parent, Grade 9, Scholarship Optional, US**
```
Check Rule 1: formFillerType !== 'student' ✗
Check Rule 2: gpaValue !== "10" and percentageValue !== "100" ✗
Check Rule 3: scholarshipRequirement !== 'full_scholarship' ✗
Check Rule 4: currentGrade !== '7_below' ✗
Check Rule 5: currentGrade !== 'masters' ✗
Check BCH Rule 1: grade IN [8,9,10] ✓ AND scholarship IN [optional,partial] ✓
→ Result: 'bch'
```

**Example 2: Student, Grade 11, Scholarship Optional, US**
```
Check Rule 1: formFillerType === 'student' ✓
→ Result: 'nurture' (immediate submission, no Page 2)
```

**Example 3: Parent, Grade 11, Full Scholarship, US**
```
Check Rule 1: formFillerType !== 'student' ✗
Check Rule 2: not spam ✗
Check Rule 3: scholarshipRequirement === 'full_scholarship' ✓
→ Result: 'nurture'
```

**Example 4: Parent, Grade 12, Scholarship Optional, UK**
```
Check Rule 1-5: All fail ✗
Check BCH Rules: Fail (grade 12 doesn't qualify for BCH) ✗
Check LUM-L1 Rule 2: grade === '12' ✓ AND scholarship === 'scholarship_optional' ✓
→ Result: 'lum-l1'
```

---

## Page 2A: Qualified Lead Form

### Purpose
Counseling booking form shown only to qualified leads (BCH, LUM-L1, LUM-L2). Captures parent contact information and schedules a specific counseling session with a managing partner.

### Trigger
Shown after:
1. Page 1 submission
2. Lead categorized as BCH, LUM-L1, or LUM-L2
3. 10-second evaluation animation completes

### Counselor Assignment Logic

```
IF lead_category === 'bch'
THEN
    Show Viswanathan Ramakrishnan
ELSE IF lead_category IN ['lum-l1', 'lum-l2']
THEN
    Show Karthik Lakshman
```

### Counselor Profiles

#### Viswanathan Ramakrishnan (BCH Leads)
- **Name:** "Viswanathan Ramakrishnan"
- **Title:** "Managing Partner"
- **Image Path:** "/vishy.png"
- **Image Specs:** 80x80px, rounded-full, border-4 white, shadow-lg
- **LinkedIn URL:** "https://www.linkedin.com/in/viswanathan-r-8504182/"
- **Bio:** "IIT-IIM alum with 20+ yrs in education - built Manipal schools, founded Magic Crate (acquired by BYJU'S). Dedicated to helping your child thrive in tomorrow's world."
- **Badge Icon:** Award icon in yellow background
- **Availability:** All time slots (no restrictions)

#### Karthik Lakshman (LUM-L1, LUM-L2 Leads)
- **Name:** "Karthik Lakshman"
- **Title:** "Managing Partner"
- **Image Path:** "/karthik.png"
- **Image Specs:** Same as above
- **LinkedIn URL:** "https://www.linkedin.com/in/karthiklakshman/"
- **Bio:** "Georgia Tech Masters graduate. Former McKinsey consultant and Byju's Test Prep division leader with international education expertise."
- **Badge Icon:** Same as above
- **Availability:** Restricted (see Time Slot Logic below)

---

### Page 2A Fields (4 Total)

#### Field 1: Selected Date (Calendar Picker)

**Purpose:** Choose counseling session date

**UI Component:** Custom 7-day calendar (not native datepicker)

**Field Names:**
- Frontend: `selectedDate`
- Database: `selected_date`

**Calendar Generation:**
```
Generate array of 7 dates:
  Start: Today (new Date())
  For i = 0 to 6:
    Add i days to today
    Store in array

Result: [today, tomorrow, day+2, ..., day+6]
```

**Default Selection:**
- Automatically selects today when component mounts
- Sets value via `setValue('selectedDate', formattedDateString)`

**Date Format (Storage):**
- Format: "Weekday, Month Date, Year"
- Example: "Monday, December 4, 2025"
- Use JavaScript toLocaleDateString with options:
  ```
  { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  ```

**Date Format (Display):**
Each date box shows:
- Day: 3-letter abbreviation (e.g., "Mon")
- Date: Number (e.g., "4")
- Month: 3-letter abbreviation (e.g., "Dec")

**Visual Layout:**

**Mobile:**
- Grid: 7 columns, gap-1 (4px)
- Each box: Small (compact)
- Vertical layout: Day / Date / Month
- Text size: xs (12px)
- Padding: 4px (p-1)

**Desktop:**
- Grid: 7 columns, gap-1
- Each box: Larger than mobile
- Same vertical layout
- Text size: xs for day/month, sm for date
- Padding: 8px (p-2)
- Today gets special badge: "Today" text in yellow bg

**Box States:**
1. **Selected:**
   - Border: 2px solid navy (primary)
   - Background: Navy 10% opacity (primary/10)
   - Text: Navy (primary)

2. **Unselected:**
   - Border: 2px solid gray 200
   - Background: White
   - Text: Gray
   - Hover: Border gray 300

3. **Today (additional indicator):**
   - Ring: 1px yellow/30% opacity (if selected, stacks with selected state)
   - Desktop only: Small "Today" badge in yellow below date

**Validation:**
- Required: Yes
- Error message: "Please select a date"
- Error shown below calendar grid

**Data Attribute:** `data-field="selectedDate"` (on each button)

**Behavior:**
```
On date button click:
  1. Set selectedDate state to clicked date
  2. Reset selectedSlot to empty (time slot selection clears)
  3. Format date to storage format
  4. Call setValue('selectedDate', formattedString)
  5. Update UI (selected state visual change)
```

---

#### Field 2: Selected Time Slot

**Purpose:** Choose specific time for counseling session

**UI Component:**
- Mobile: Select dropdown (Radix UI)
- Desktop: Grid of time buttons

**Field Names:**
- Frontend: `selectedSlot`
- Database: `selected_slot`

**Base Time Slots:**
```
Hours: 10 AM to 8 PM (10:00 to 20:00 in 24h)
Excluded: 2 PM (14:00)

Generate slots:
  For hour = 10 to 20:
    If hour === 14:
      Skip (2 PM excluded)
    Else:
      Format as 12-hour time:
        If hour === 12: "12 PM"
        Else if hour > 12: "X PM" (hour - 12)
        Else: "X AM"
      Add to slots array
```

**Slot Format Examples:**
- "10 AM"
- "11 AM"
- "12 PM"
- "1 PM"
- "3 PM" (note: 2 PM skipped)
- "4 PM"
- ...
- "8 PM"

**Filtering Logic (Today Only):**
```
If selected date is today:
  currentHour = new Date().getHours()
  minimumHour = currentHour + 2

  For each slot:
    slotHour = parse hour from slot string
    If slotHour < minimumHour:
      Mark as unavailable (remove from list)
```

**Example:** If current time is 3:45 PM (15:45), minimum available slot is 6 PM (18:00).

**Karthik-Specific Filtering:**
```
If counselor is Karthik (NOT BCH):
  dayOfWeek = selectedDate.getDay()

  If dayOfWeek === 0 (Sunday):
    All slots unavailable
  Else (Monday-Saturday):
    For each slot:
      slotHour = parse hour from slot
      If slotHour IN [11, 12, 13]:  // 11 AM - 1 PM
        Available ✓
      Else If slotHour IN [16, 17, 18, 19, 20]:  // 4 PM - 8 PM
        Available ✓
      Else:
        Unavailable (remove from list)
```

**Karthik Available Times:**
- Monday-Saturday: 11 AM - 1 PM, 4 PM - 8 PM
- Sunday: No availability

**Vishy (BCH) Available Times:**
- All days: 10 AM - 8 PM (except 2 PM)

**Mobile UI (Select Dropdown):**
- Height: 48px (h-12)
- Placeholder: "Choose a time slot"
- Only available slots shown in dropdown
- Selected value displayed in trigger
- Dropdown opens on click

**Desktop UI (Button Grid):**
- Grid: 3 columns, gap-2 (8px)
- Each button shows one time slot
- Only available slots rendered

**Button States:**
1. **Selected:**
   - Border: 2px solid navy
   - Background: Navy 10%
   - Text: Navy

2. **Unselected:**
   - Border: 2px solid gray 200
   - Background: White
   - Text: Gray 700
   - Hover: Border gray 300, background gray 50

**Empty States:**
- Before date selected: "Please select a date first" (desktop only)
- No slots available: "No slots available for this day"

**Validation:**
- Required: Yes
- Error message: "Please select a time slot"
- Error shown below slot selector

**Data Attribute:** `data-field="selectedSlot"` (on select or buttons)

**Behavior:**
```
On time slot selection:
  1. Call setValue('selectedSlot', slotValue)
  2. Store: Just the time string (e.g., "3 PM")
  3. Update UI (selected state)
  4. Trigger incremental save (counseling_slot_selected)
```

---

#### Field 3: Parent's Name

**Purpose:** Capture parent's full name for contact

**UI Component:** Text input

**Field Names:**
- Frontend: `parentName`
- Database: `parent_name`

**Validation:**
- Required: Yes
- Minimum length: 2 characters
- Error message: "Please answer this question"

**Placeholder:** "Enter parent's full name"

**Styling:**
- Height: 48px (h-12)
- Width: Full (mobile) or half (desktop in 2-col grid)

**Data Attribute:** `data-field="parentName"`

---

#### Field 4: Parent's Email

**Purpose:** Capture parent's email for confirmation

**UI Component:** Email input

**Field Names:**
- Frontend: `email`
- Database: `parent_email` (note: field name changes for database)

**Validation:**
- Required: Yes
- Must be valid email format (Zod .email() validation)
- Error message: "Please enter a valid email address"

**Placeholder:** "Enter parent's email address"

**Type Attribute:** `email` (enables email keyboard on mobile)

**Styling:**
- Height: 48px (h-12)
- Width: Full (mobile) or half (desktop in 2-col grid)

**Data Attribute:** `data-field="email"`

---

### Page 2A Layout

#### Mobile Layout (< 640px)

```
[Back Button]

[Short Congratulations Message]

┌─────────────────────────────────────┐
│ Counselor Profile Card (Vertical)  │
│ - Photo (centered)                 │
│ - Name + LinkedIn                  │
│ - Title                            │
│ - Bio (short)                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Date & Time Selection Card         │
│ - Calendar (7 boxes)               │
│ - Time dropdown                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Parent Details Card                │
│ - Name (full width)                │
│ - Email (full width)               │
└─────────────────────────────────────┘

[Sticky Submit Button]
```

#### Desktop Layout (≥ 640px)

```
[Back Button]

[Full Congratulations Message (centered, wider)]

┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Counselor Profile (Horizontal)               │  │
│  │ [Photo] Name + LinkedIn | Title | Bio        │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Date & Time (Side by Side)                   │  │
│  │ [Calendar Grid] │ [Time Button Grid]         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Parent Details (2-column)                    │  │
│  │ [Name Input] │ [Email Input]                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
      (Rounded-2xl card, max-w-4xl, shadow-lg)

[Sticky Submit Button]
```

---

### Congratulations Message

**Mobile (Short):**
```
Heading: "Great news about [FirstName]! 🎉"
Text: "[FirstName] has a strong potential for elite university
admissions! Book a strategy session with our Managing Partner."
```

**Desktop (Full):**
```
Heading: "Great news about [FirstName]! 🎉"
Text: "[FirstName] has a strong potential for elite university
admissions! Book a strategy session with our Managing Partner."
```

**Personalization:**
- Uses student's first name from Page 1 (split on space, take first part)
- Falls back to generic "You" if name not available

---

### Sticky Submit Button (Page 2A)

**Visibility:** Always visible (not scroll-dependent like Page 1)

**Button State Logic:**
```
isFormReady = selectedSlot AND parentName AND email
```

**Button States:**

1. **Not Ready (missing fields):**
   - Text: "Fill in all details to continue"
   - Background: Gray 300 (bg-gray-300)
   - Text Color: Gray 500 (text-gray-500)
   - Disabled: true
   - Cursor: not-allowed

2. **Ready (all fields filled):**
   - Text: "Submit Application"
   - Background: Yellow accent (bg-accent)
   - Text Color: Navy primary (text-primary)
   - Icon: ChevronRight arrow
   - Disabled: false
   - Hover: Lighter yellow, larger shadow

3. **Submitting:**
   - Text: "Submitting..."
   - Background: Yellow accent
   - Disabled: true
   - Icon: Hidden

**Container:**
- Position: Fixed bottom-0
- Z-index: 50
- Background: White
- Border top: Gray 200
- Padding: 16px (p-4)
- Shadow: Large (shadow-lg)
- Animation: slide-up (0.3s)

**Progress Hint:**
- Text: "Step 2 of 2 • Almost done!"
- Font: xs, gray-600
- Centered below button

**Bottom Spacer:**
- 96px (h-24) padding when button visible

---

### Page 2A: Submission Flow

```
User clicks "Submit Application" button
    ↓
Prevent default
    ↓
Check if already submitting (prevent double-submit)
    ↓
Set isSubmitting = true
    ↓
Run React Hook Form validation (qualifiedLeadSchema)
    ↓
    ├─ VALIDATION FAILS
    │       ↓
    │   Find first error field (order: selectedDate → selectedSlot → parentName → email)
    │       ↓
    │   Focus that field (300ms delay)
    │       ↓
    │   Display inline errors
    │       ↓
    │   Set isSubmitting = false
    │
    └─ VALIDATION PASSES
            ↓
        Update Zustand store with Page 2A data
            ↓
        Fire page_2_submit Meta Pixel events (1-3 events)
            ↓
        Add events to triggeredEvents
            ↓
        Fire form_complete Meta Pixel events (1-3 events)
            ↓
        Add events to triggeredEvents
            ↓
        Save to database (funnel stage: 10_form_submit)
            ↓
        Submit to webhook with ALL form data + triggeredEvents
            ↓
        Set isSubmitting = false
            ↓
        Set isSubmitted = true
            ↓
        Scroll to top
            ↓
        Show success screen with booking confirmation message
```

---

### Back Button Behavior

**Location:** Top left of Page 2A

**Visual:**
- Icon: ArrowLeft (16px)
- Text: "Back" (small, medium weight)
- Color: Gray 600, hover primary
- Layout: Flex row, items-center, gap-2

**Behavior:**
```
On click:
  1. Scroll to top (instant)
  2. Call onBack() which triggers setStep(1)
  3. Return to Page 1
  4. Form data persists (all Page 1 fields still filled)
  5. User can edit and resubmit
```

**Note:** Re-submission will re-run lead categorization, potentially changing category and routing.

---

## Page 2B: Disqualified Lead Form

### Purpose
Simple contact form for disqualified leads (NURTURE, MASTERS, DROP categories). Collects parent email for future outreach without counseling booking.

### Trigger
Shown after:
1. Page 1 submission
2. Lead categorized as NURTURE, MASTERS, or DROP (if not submitted immediately)
3. No animation shown

### Fields (2 Total)

#### Field 1: Parent's Name
**Identical to Page 2A Field 3** - Same validation, styling, behavior

#### Field 2: Parent's Email
**Identical to Page 2A Field 4** - Same validation, styling, behavior

---

### Category-Specific Messaging

The form displays different messaging based on lead_category.

#### For MASTERS Category

**Title:** "Masters Program Guidance"

**Description:**
"Thank you for your interest in our Masters program guidance. Our team will review your profile and reach out with personalized recommendations for your graduate school journey."

**Next Steps:**
"Our Masters specialists will contact you within 48 hours to discuss your specific goals and create a customized application strategy."

---

#### For DROP Category

**Title:** "Early Academic Planning"

**Description:**
"We appreciate your early interest in university planning. While our primary focus is on students in grades 8 and above, we'd be happy to provide guidance on academic preparation."

**Next Steps:**
"Our team will reach out to discuss how we can support your academic journey and prepare for future university applications."

---

#### For NURTURE Category (Default)

**Title:** "Personalized University Guidance"

**Description:**
"Thank you for sharing your academic profile with us. Based on your information, our team will create a customized plan to help you achieve your university goals."

**Next Steps:**
"Our admissions counsellors shall get back to you to discuss your specific needs and create a personalized roadmap for your university applications."

---

### Page 2B Layout

#### All Screen Sizes (Responsive)

```
[Back Button]

[Category-Specific Header]
- Title (xl/2xl, bold, centered)
- Description (base, gray-700, centered, max-w-2xl)

┌─────────────────────────────────────┐
│ Blue Info Box                       │
│ "What happens next: [next steps]"  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Contact Information Card            │
│ [Mail icon] Contact Information     │
│                                     │
│ Mobile: Single column               │
│ Desktop: 2 columns                  │
│ - Parent Name                       │
│ - Parent Email                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ What Happens Next Section           │
│ 1. Profile Review                   │
│ 2. Personalized Outreach            │
│ 3. Strategic Planning               │
└─────────────────────────────────────┘

[Sticky Submit Button]
```

---

### Blue Info Box

**Purpose:** Highlight next steps prominently

**Styling:**
- Background: Blue 50 (bg-blue-50)
- Border: 1px solid blue 200
- Rounded: 8px (rounded-lg)
- Padding: 12px (p-3)
- Text: Blue 700, small, leading-relaxed, medium weight
- Bold text: "What happens next:"

**Content:** Category-specific next steps message

---

### What Happens Next Section

**Purpose:** Explain the process in 3 clear steps

**Styling:**
- Background: Gray 50 (bg-gray-50)
- Border: 1px solid gray 200
- Rounded: 12px (rounded-xl)
- Padding: 16px (p-4)
- Margin bottom: 24px (mb-6)

**Header:**
- Text: "What Happens Next?"
- Size: lg (18px)
- Weight: Medium
- Color: Primary (navy)
- Margin bottom: 16px

**Steps (3 total):**

**Step 1: Profile Review**
- Numbered circle: Navy (w-6 h-6 bg-primary text-white rounded-full)
- Number: "1"
- Title: "Profile Review" (font-medium, gray-800, small)
- Description: "Our team will carefully review your academic profile and goals" (gray-600, small)

**Step 2: Personalized Outreach**
- Number: "2"
- Title: "Personalized Outreach"
- Description: "We'll contact you with customized recommendations and next steps"

**Step 3: Strategic Planning**
- Number: "3"
- Title: "Strategic Planning"
- Description: "Together, we'll create a roadmap to achieve your university goals"

**Layout:**
- Flex layout per step: items-start, space-x-2
- Circle on left, content on right
- Vertical spacing: 8px (space-y-2) between steps

---

### Sticky Submit Button (Page 2B)

**Same as Page 2A, with different text for not-ready state:**

**Button State Logic:**
```
isFormReady = parentName AND email
```

**Button States:**

1. **Not Ready:**
   - Text: "Enter your details to continue"
   - Background: Gray 300
   - Disabled: true

2. **Ready:**
   - Text: "Submit Application"
   - Background: Yellow accent
   - Icon: ChevronRight

3. **Submitting:**
   - Text: "Submitting..."
   - Disabled: true

**All other specs identical to Page 2A button.**

---

### Page 2B: Submission Flow

```
User clicks "Submit Application"
    ↓
[Same validation flow as Page 2A]
    ↓
    └─ VALIDATION PASSES
            ↓
        Update store with Page 2B data
            ↓
        Fire page_2_submit events
            ↓
        Fire form_complete events
            ↓
        Save to database (10_form_submit)
            ↓
        Submit to webhook
            ↓
        Set isSubmitted = true
            ↓
        Show success screen with follow-up message
```

---

### Success Screen Message (Page 2B)

**Message:**
"Thank you for providing your details. Our admissions team will review your profile and reach out within the next 24 hours to discuss potential pathways that match your specific needs and requirements."

---

## Validation Rules

### Validation Library
**Zod** - TypeScript-first schema validation library

### Three Schemas

1. **initialLeadCaptureSchema** - Page 1 (11 fields)
2. **qualifiedLeadSchema** - Page 2A (4 fields)
3. **disqualifiedLeadSchema** - Page 2B (2 fields)

---

### Schema 1: initialLeadCaptureSchema (Page 1)

#### Field Validation Rules

**formFillerType:**
- Type: Enum with 2 values
- Values: `['parent', 'student']`
- Required: Yes
- Error: "Please answer this question"

**studentName:**
- Type: String
- Min length: 2 characters
- Required: Yes
- Error: "Please enter the student's full name"

**currentGrade:**
- Type: Enum with 7 values
- Values: `['7_below', '8', '9', '10', '11', '12', 'masters']`
- Required: Yes
- Error: "Please answer this question"

**location:**
- Type: String
- Min length: 2 characters
- Required: Yes
- Error: "Please enter your current city/town/place of residence"

**curriculumType:**
- Type: Enum with 6 values
- Values: `['IB', 'IGCSE', 'CBSE', 'ICSE', 'State_Boards', 'Others']`
- Required: Yes
- Error: "Please answer this question"

**gradeFormat:**
- Type: Enum with 2 values
- Values: `['gpa', 'percentage']`
- Default: 'gpa'
- Required: Yes
- Error: "Please answer this question"

**gpaValue:**
- Type: String (not number, to preserve decimals)
- Required: Conditional (only if gradeFormat === 'gpa')
- Min value: 1
- Max value: 10
- Pattern: Numeric with optional decimal
- Error: "Please answer this question"

**percentageValue:**
- Type: String
- Required: Conditional (only if gradeFormat === 'percentage')
- Min value: 1
- Max value: 100
- Pattern: Numeric with optional decimal
- Error: "Please answer this question"

**schoolName:**
- Type: String
- Min length: 2 characters
- Required: Yes
- Error: "Please answer this question"

**scholarshipRequirement:**
- Type: Enum with 3 values
- Values: `['scholarship_optional', 'partial_scholarship', 'full_scholarship']`
- Required: Yes
- Error: "Please answer this question"

**targetGeographies:**
- Type: Array of strings
- Min items: 1 (at least one selection)
- Max items: Unlimited
- Required: Yes
- Error: "Please answer this question"

**countryCode:**
- Type: String
- Min length: 1
- Default: "+91"
- Required: Yes
- Error: "Please enter a country code"

**phoneNumber:**
- Type: String
- Pattern: `/^[0-9]{10}$/` (exactly 10 digits, no spaces or dashes)
- Required: Yes
- Error: "Please enter a valid 10-digit phone number"

#### Cross-Field Validation (Zod .refine())

**Rule:** GPA or Percentage must be filled based on gradeFormat

```
Check:
  IF gradeFormat === 'gpa':
    gpaValue must not be empty or whitespace-only
  IF gradeFormat === 'percentage':
    percentageValue must not be empty or whitespace-only

If check fails:
  Return error on both fields
  Error message: "Please answer this question"
  Path: ['gpaValue', 'percentageValue']
```

---

### Schema 2: qualifiedLeadSchema (Page 2A)

**parentName:**
- Type: String
- Min length: 2
- Required: Yes
- Error: "Please answer this question"

**email:**
- Type: String
- Format: Email (RFC-compliant)
- Required: Yes
- Error: "Please enter a valid email address"

**selectedDate:**
- Type: String
- Min length: 1 (non-empty)
- Required: Yes
- Error: "Please select a date"

**selectedSlot:**
- Type: String
- Min length: 1 (non-empty)
- Required: Yes
- Error: "Please select a time slot"

---

### Schema 3: disqualifiedLeadSchema (Page 2B)

**parentName:**
- Type: String
- Min length: 2
- Required: Yes
- Error: "Please answer this question"

**email:**
- Type: String
- Format: Email
- Required: Yes
- Error: "Please enter a valid email address"

---

### Validation Timing

**On Submit:**
- Primary validation trigger
- All fields validated together
- First error focused automatically

**Real-Time (Numeric Inputs):**
- GPA and Percentage fields have custom input handlers
- Validation happens on every keystroke:
  - Regex check: `/^\d*\.?\d*$/`
  - Range check: Min/max clamping
  - Invalid input: Last character removed

**No Blur Validation:**
- Fields do not validate on blur (losing focus)
- Only validate on submit attempt

---

## Error Handling & UX

### Error Display Strategy

**Inline Errors Only:**
- No toast notifications
- No modal error dialogs
- All errors shown directly below the relevant field

**Visual Indicators:**
- Red border on error field: `border-red-500`
- Red focus ring: `focus:border-red-500`
- Error text below field: Red, italic, small

---

### Error Text Styling

**Error Message:**
```css
className: "text-sm text-red-500 italic"
margin-top: 8px (implicit from spacing)
```

**Field with Error:**
```css
border: 1px solid red-500
focus border: 1px solid red-500 (overrides default blue)
```

---

### Error Focus Logic

When form validation fails, the system automatically focuses the first error field to guide the user.

#### Error Focus Sequence

```
1. Form submission triggered
    ↓
2. Validation runs (Zod schemas)
    ↓
3. Validation fails
    ↓
4. Extract error field names from errors object
    ↓
5. Get predefined FIELD_ORDER array
    ↓
6. Find first field name that appears in both:
   - The errors object
   - The FIELD_ORDER array
    ↓
7. Wait 300ms (allow DOM to stabilize)
    ↓
8. Focus that field:
   a. Query DOM for element with data-field="[fieldName]"
   b. Call element.scrollIntoView({ behavior: 'smooth', block: 'center' })
   c. Wait 100ms
   d. Call element.focus()
    ↓
9. If focus fails:
   Fallback: Scroll to top of form
```

#### Field Order Arrays

**Page 1 (InitialLeadCaptureForm):**
```typescript
FIELD_ORDER = [
  'formFillerType',
  'studentName',
  'currentGrade',
  'location',
  'countryCode',
  'phoneNumber',
  'curriculumType',
  'schoolName',
  'gradeFormat',
  'gpaValue',
  'percentageValue',
  'scholarshipRequirement',
  'targetGeographies'
]
```

**Page 2A (QualifiedLeadForm):**
```typescript
FIELD_ORDER = [
  'selectedDate',
  'selectedSlot',
  'parentName',
  'email'
]
```

**Page 2B (DisqualifiedLeadForm):**
```typescript
FIELD_ORDER = [
  'parentName',
  'email'
]
```

#### Focus Implementation

**Query Selector:**
```typescript
const element = document.querySelector(`[data-field="${fieldName}"]`)
```

**Scroll Into View:**
```typescript
element.scrollIntoView({
  behavior: 'smooth',
  block: 'center',
  inline: 'nearest'
})
```

**Focus Element:**
```typescript
setTimeout(() => {
  element.focus()
}, 100)
```

**Fallback (if element not found or focus fails):**
```typescript
window.scrollTo({ top: 0, behavior: 'smooth' })
```

---

### Error Prevention (Numeric Inputs)

To prevent invalid data entry, numeric inputs have custom handlers that run on every keystroke.

#### handleNumericInput Function

**Purpose:** Validate and clamp numeric input in real-time

**Parameters:**
- event: React.ChangeEvent<HTMLInputElement>
- min: number (minimum value)
- max: number (maximum value)
- fieldName: 'gpaValue' | 'percentageValue'

**Logic:**
```
1. Get current input value
2. IF value is empty:
   Allow (user can delete)
3. IF value is just ".":
   Allow (user can type ".5")
4. IF value matches regex /^\d*\.?\d*$/:
   Allow (valid numeric with optional decimal)
5. ELSE:
   Remove last character (invalid input)
6. IF value is valid number:
   Parse as float
   IF < min: Clamp to min
   IF > max: Clamp to max
   Update form field with clamped value
```

**Example Usage:**
```
GPA Input:
  User types: "1" → "12" → "12." → "12.5"
  All allowed

  User types: "11" (over max 10)
  Clamped to: "10"

  User types: "abc"
  Last character removed: "ab" → "a" → ""

Percentage Input:
  User types: "105" (over max 100)
  Clamped to: "100"
```

---

### User Feedback During Submission

**Page 1: Continue Button**
```
States:
1. Default: "Continue" + ChevronRight icon
2. During validation/categorization: Button still shows "Continue"
3. If qualified (showing animation): Button hidden, animation visible
```

**Page 2A/2B: Submit Button**
```
States:
1. Not Ready: "Fill in all details to continue" (gray, disabled)
2. Ready: "Submit Application" + ChevronRight icon (yellow)
3. Submitting: "Submitting..." (yellow, disabled, no icon)
```

**Evaluation Animation (Qualified Leads):**
- Full-screen overlay (can't interact with anything else)
- Progress indication for each step
- Total 10 seconds before moving to Page 2A

**Success Screen:**
- Simple confirmation message
- Green checkmark icon
- Category-specific messaging
- No further actions required

---

## State Management

### State Library
**Zustand** - Lightweight state management without boilerplate

### Store Location
`/src/store/formStore.ts`

### State Shape

```typescript
{
  // Navigation
  currentStep: number (1 or 2)

  // Form Data
  formData: Partial<CompleteFormData> (object with all form fields)

  // Submission Status
  isSubmitting: boolean
  isSubmitted: boolean

  // Tracking
  startTime: number (timestamp in milliseconds)
  sessionId: string (UUID v4)
  triggeredEvents: string[] (array of Meta Pixel event names)
  utmParameters: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
    utm_id?: string
  }
}
```

### Initial State

```typescript
{
  currentStep: 1,
  formData: {},
  isSubmitting: false,
  isSubmitted: false,
  startTime: Date.now(),
  sessionId: crypto.randomUUID(),
  triggeredEvents: [],
  utmParameters: {}
}
```

### State Actions

#### setStep(step: number)
```
Purpose: Navigate between pages
Updates: currentStep
Side Effect: Scrolls window to top (smooth)
Usage: setStep(2) // Move to Page 2
```

#### updateFormData(data: Partial<CompleteFormData>)
```
Purpose: Merge new form data
Updates: formData (shallow merge)
Logic: { ...existingFormData, ...newData }
Usage: updateFormData({ studentName: "John", currentGrade: "11" })
```

#### setSubmitting(isSubmitting: boolean)
```
Purpose: Track submission status
Updates: isSubmitting
Usage: setSubmitting(true) // Show loading state
```

#### setSubmitted(isSubmitted: boolean)
```
Purpose: Mark form as completed
Updates: isSubmitted
Usage: setSubmitted(true) // Show success screen
```

#### addTriggeredEvents(events: string[])
```
Purpose: Accumulate Meta Pixel events
Updates: triggeredEvents (append to array)
Logic: [...existingEvents, ...newEvents]
Usage: addTriggeredEvents(['apply_cta_hero', 'apply_prnt_event'])
```

#### clearTriggeredEvents()
```
Purpose: Reset events array (not currently used)
Updates: triggeredEvents = []
```

#### setUtmParameters(utm: UtmParameters)
```
Purpose: Store UTM tracking parameters
Updates: utmParameters (shallow merge)
Usage: setUtmParameters({ utm_source: 'facebook', utm_campaign: 'winter' })
```

#### resetForm()
```
Purpose: Clear all state (not currently used in UI)
Updates: All fields reset to initial state
Side Effect: Generates new sessionId
```

#### canProceed(step: number): boolean
```
Purpose: Check if step validation passes
Returns: true/false
Usage: const valid = canProceed(1)
```

#### getLatestFormData()
```
Purpose: Get fresh state snapshot for async operations
Returns: { formData, triggeredEvents, utmParameters }
Why: Zustand state can be stale in async callbacks
Usage: const { formData, triggeredEvents } = getLatestFormData()
```

---

### State Flow Example

```
1. Form Loads:
   currentStep = 1
   sessionId = "abc-123-def-456"
   startTime = 1733328000000
   formData = {}
   triggeredEvents = []

2. User Fills Page 1:
   updateFormData({ studentName: "John Doe" })
   updateFormData({ currentGrade: "11" })
   formData = { studentName: "John Doe", currentGrade: "11", ... }

3. User Clicks Continue:
   setSubmitting(true)
   [validation passes]
   updateFormData({ lead_category: "bch" })
   addTriggeredEvents([...5 events])
   triggeredEvents = ['apply_cta_hero', 'apply_prnt_event', ...]

4. Evaluation Animation:
   [10 seconds pass]

5. Navigate to Page 2A:
   setSubmitting(false)
   setStep(2)
   currentStep = 2

6. User Fills Page 2A:
   updateFormData({ parentName: "Jane Doe", email: "jane@example.com" })
   formData = { ...Page1, parentName: "Jane Doe", email: "jane@example.com" }

7. User Submits:
   setSubmitting(true)
   addTriggeredEvents([...6 more events])
   triggeredEvents = [...11 total events]
   [submit to database + webhook]
   setSubmitting(false)
   setSubmitted(true)

8. Success Screen:
   isSubmitted = true
   [FormContainer shows success UI]
```

---

### Accessing State in Components

**Full State:**
```typescript
const {
  currentStep,
  formData,
  updateFormData,
  sessionId
} = useFormStore()
```

**Selective (Performance):**
```typescript
const sessionId = useFormStore(state => state.sessionId)
const currentStep = useFormStore(state => state.currentStep)
```

**Getting Latest State (Async):**
```typescript
const { formData, triggeredEvents } = useFormStore.getState().getLatestFormData()
```

---

## Implementation Checklist

### Page 1 Implementation
- [ ] Create InitialLeadCaptureForm component
- [ ] Implement 11 form fields with exact specifications
- [ ] Add Zod schema validation with cross-field rules
- [ ] Implement custom numeric input handler
- [ ] Add sticky continue button (scroll-triggered)
- [ ] Implement error focusing with field order array
- [ ] Style forms per brand guidelines (mobile-first)

### Lead Categorization
- [ ] Create determineLeadCategory function
- [ ] Implement global override rules (5 rules)
- [ ] Implement qualified lead rules (6 rules)
- [ ] Add default fallback
- [ ] Add validation and error logging

### Page 2A Implementation
- [ ] Create QualifiedLeadForm component
- [ ] Implement counselor assignment logic
- [ ] Build 7-day calendar picker
- [ ] Implement time slot generation and filtering
- [ ] Add Karthik-specific time restrictions
- [ ] Style mobile vs desktop layouts
- [ ] Add sticky submit button with ready state

### Page 2B Implementation
- [ ] Create DisqualifiedLeadForm component
- [ ] Implement category-specific messaging
- [ ] Add "What Happens Next" section
- [ ] Style layout
- [ ] Add sticky submit button

### Evaluation Animation
- [ ] Create SequentialLoadingAnimation component
- [ ] Implement 3-step sequence with timings
- [ ] Add progress bars and pulsing dots
- [ ] Style full-screen overlay

### Form Container
- [ ] Create FormContainer orchestrator
- [ ] Implement step management
- [ ] Add routing logic after Page 1
- [ ] Handle immediate submissions (grade 7/student)
- [ ] Show correct Page 2 form based on category
- [ ] Implement success screen with category messages

### State Management
- [ ] Create Zustand store with all fields
- [ ] Implement all 9 actions
- [ ] Add getLatestFormData for async ops
- [ ] Initialize sessionId and startTime

### Validation & Errors
- [ ] Create 3 Zod schemas
- [ ] Implement error focus logic
- [ ] Add data-field attributes to all inputs
- [ ] Style error messages and field borders
- [ ] Test error focus flow

---

**END OF FORM FLOW & IMPLEMENTATION GUIDE**

This document provides complete specifications for implementing the form UI and user experience. Refer to the companion document "Database & Event Tracking Guide" for data persistence and Meta Pixel event details.
