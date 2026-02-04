# Lead Categorization Rules

Last updated: 2026-02-04
Source: src/lib/leadCategorization.ts (194 lines)

## Rule Evaluation Order

Rules are evaluated TOP TO BOTTOM. First match wins.

## 1. Global Overrides (Always checked first)

| Condition | Result | Rationale |
|-----------|--------|-----------|
| `formFillerType === 'student'` | `nurture` | Students are lower priority |
| `gpaValue === '10'` OR `percentageValue === '100'` | `nurture` | Spam detection |
| `scholarshipRequirement === 'full_scholarship'` | `nurture` | Can't afford services |
| `currentGrade === '7_below'` | `drop` | Too young |
| `currentGrade === 'masters'` | `masters` | Different service tier |
| `targetGeographies` contains ONLY `'Rest of World'` | `nurture` | ROW-only = low intent |

## 2. Parent-Filled Forms (After global overrides pass)

### Indian Curriculum Rules (CBSE, ICSE, State_Boards)

These curriculums have STRICTER qualification rules:

```
isIndianCurriculum = ['CBSE', 'ICSE', 'State_Boards'].includes(curriculumType)
```

| Grade | Scholarship | Result | Note |
|-------|-------------|--------|------|
| 8, 9, 10 | `partial_scholarship` | `nurture` | Stricter for Indian curriculum |
| 8, 9, 10 | `scholarship_optional` | `bch` | Optional = can pay |
| 11, 12 | `partial_scholarship` | `bch` | Bypasses Luminaire |
| 11, 12 | `scholarship_optional` | `bch` | Bypasses Luminaire |

### Destination Override (Grades 8-9 only)

```
if grade in ['8', '9'] AND
   'US' NOT in targetGeographies AND
   'Need Guidance' NOT in targetGeographies:
   → nurture
```

Rationale: Young leads not targeting US are too early in funnel.

### BCH Category (Non-Indian Curriculum)

| Condition | Result |
|-----------|--------|
| Grades 8, 9, 10 + `optional` or `partial` | `bch` |
| Grade 11 + `optional` or `partial` + includes `US` | `bch` |

### Luminaire L1 (IB, IGCSE, Others only)

| Condition | Result |
|-----------|--------|
| Grade 11 + `scholarship_optional` + UK/ROW/Guidance | `lum-l1` |
| Grade 12 + `scholarship_optional` | `lum-l1` |

### Luminaire L2 (IB, IGCSE, Others only)

| Condition | Result |
|-----------|--------|
| Grade 11 + `partial_scholarship` + UK/ROW/Guidance | `lum-l2` |
| Grade 12 + `partial_scholarship` | `lum-l2` |

## 3. Default

All other cases → `nurture`

## Quick Decision Tree

```
Student filling? → nurture
GPA=10 or %=100? → nurture
Full scholarship? → nurture
Grade ≤7? → drop
Masters? → masters
ROW only? → nurture
Parent + Indian curriculum + Grade 8-10 + partial? → nurture
Parent + Grade 8-9 + no US + no Guidance? → nurture
Parent + Indian curriculum + Grade 11-12? → bch
Parent + Grade 8-10 + optional/partial? → bch
Parent + Grade 11 + US + optional/partial? → bch
Parent + Grade 11 + non-US + optional? → lum-l1
Parent + Grade 11 + non-US + partial? → lum-l2
Parent + Grade 12 + optional? → lum-l1
Parent + Grade 12 + partial? → lum-l2
Otherwise → nurture
```

## Category → Page Routing

| Category | Next Step |
|----------|-----------|
| `drop` | Immediate submit → Thank you |
| `nurture` (student) | Immediate submit → Thank you |
| `nurture` (parent) | Page 2B → Contact form |
| `masters` | Page 2B → Contact form |
| `bch` | Loading animation → Page 2A → Calendar |
| `lum-l1` | Loading animation → Page 2A → Calendar |
| `lum-l2` | Loading animation → Page 2A → Calendar |
