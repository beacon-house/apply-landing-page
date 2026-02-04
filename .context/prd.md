# Product Requirements Document

Last updated: 2026-02-04
Source: Extracted from codebase (src/types/form.ts, src/lib/leadCategorization.ts)

## Purpose
Lead capture landing page for Beacon House premium admissions consultancy. Qualifies leads and routes to appropriate counselors.

## Target Users
- **Primary:** Parents of grades 8-12 students (affluent Indian families)
- **Secondary:** Students filling form themselves (auto-nurture)

## Form Flow

### Page 1: Initial Lead Capture (11 fields)

**Section 1 - Student Info:**
| Field | Frontend Key | DB Column | Options/Validation |
|-------|--------------|-----------|-------------------|
| Form Filler | `formFillerType` | `form_filler_type` | `parent`, `student` |
| Student Name | `studentName` | `student_name` | min 2 chars |
| Grade | `currentGrade` | `current_grade` | `7_below`, `8`, `9`, `10`, `11`, `12`, `masters` |
| Location | `location` | `location` | min 2 chars |
| Phone | `countryCode` + `phoneNumber` | `phone_number` | 10 digits, default +91 |

**Section 2 - Academic Info:**
| Field | Frontend Key | DB Column | Options/Validation |
|-------|--------------|-----------|-------------------|
| Curriculum | `curriculumType` | `curriculum_type` | `IB`, `IGCSE`, `CBSE`, `ICSE`, `State_Boards`, `Others` |
| School | `schoolName` | `school_name` | min 2 chars |
| Grade Format | `gradeFormat` | `grade_format` | `gpa`, `percentage` |
| GPA Value | `gpaValue` | `gpa_value` | 1.0-10.0 (10 = spam) |
| Percentage | `percentageValue` | `percentage_value` | 1-100 (100 = spam) |

**Section 3 - Preferences:**
| Field | Frontend Key | DB Column | Options |
|-------|--------------|-----------|---------|
| Scholarship | `scholarshipRequirement` | `scholarship_requirement` | `scholarship_optional`, `partial_scholarship`, `full_scholarship` |
| Destinations | `targetGeographies` | `target_geographies` | `US`, `UK`, `Rest of World`, `Need Guidance` (multi-select) |

### Page 2A: Qualified Lead Form (4 fields)
For: `bch`, `lum-l1`, `lum-l2`
- `parentName` → `parent_name`
- `email` → `parent_email`
- `selectedDate` → `selected_date`
- `selectedSlot` → `selected_slot`

### Page 2B: Disqualified Lead Form (2 fields)
For: `nurture`, `masters`
- `parentName` → `parent_name`
- `email` → `parent_email`

### Immediate Submit (skip Page 2)
- Grade 7 or below → `drop`
- Student form filler → `nurture`

## Lead Categories

| Category | Counselor | Page 2 | Description |
|----------|-----------|--------|-------------|
| `bch` | Viswanathan | 2A (calendar) | High-priority, BCH tier |
| `lum-l1` | Karthik | 2A (calendar) | Luminaire Level 1 |
| `lum-l2` | Karthik | 2A (calendar) | Luminaire Level 2 |
| `nurture` | - | 2B (contact) | Development pipeline |
| `masters` | - | 2B (contact) | Masters applicants |
| `drop` | - | immediate | Grade 7 and below |

## Counselor Assignment & Availability

### Viswanathan (BCH leads)
- **Monday:** OFF
- **Tuesday-Saturday:** 11 AM - 7 PM
- **Sunday:** 11 AM - 3 PM

### Karthik (Luminaire leads)
- **Sunday:** OFF
- **Monday-Saturday:** 11 AM - 1 PM, 4 PM - 7 PM

## Success Metrics
- Form completion rate
- Qualified lead percentage (BCH + Luminaire)
- Counseling booking rate
- Meta Pixel event match quality
