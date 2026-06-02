# Lead Qualification

Source of truth: `@repo/src/lib/leadCategorization.ts` and `@repo/src/types/form.ts`.

## Valid Categories

`bch`, `lum-l1`, `lum-l2`, `nurture`, `drop`

There is no active `masters` category.

## Rule Order

Rules are checked top to bottom. First match wins.

### Global Overrides

| Condition | Category | UX |
|-----------|----------|----|
| `formFillerType === 'student'` | `nurture` | Immediate submit after Page 1 |
| `gpaValue === '10'` or `percentageValue === '100'` | `drop` | Immediate submit after Page 1 |
| `scholarshipRequirement === 'full_scholarship'` | `nurture` | Page 2B for parent contact |
| `currentGrade === '7_below'` | `drop` | Immediate submit after Page 1 |
| only selected target geography is `Rest of World` | `nurture` | Page 2B for parent contact |

### Parent Forms Only

Indian curriculums are `CBSE`, `ICSE`, and `State_Boards`.

Seasonal rule: from January 1 through June 30 in `Asia/Kolkata`, Grade 8 parent leads that pass the global overrides are categorized as `nurture`. From July 1 through December 31, Grade 8 follows the standard rules below.

| Condition | Category |
|-----------|----------|
| Indian curriculum, grade 8/9/10, partial scholarship | `nurture` |
| Grade 8/9, no `US`, no `Need Guidance` | `nurture` |
| Grade 8, Jan-Jun in `Asia/Kolkata` | `nurture` |
| Grade 8/9/10, optional or partial scholarship | `bch` |
| Indian curriculum, grade 11/12, optional or partial scholarship | `bch` |
| Grade 11, optional or partial scholarship, `US` selected | `bch` |
| Grade 11, optional scholarship, `UK`/`Rest of World`/`Need Guidance` selected | `lum-l1` |
| Grade 12, optional scholarship | `lum-l1` |
| Grade 11, partial scholarship, `UK`/`Rest of World`/`Need Guidance` selected | `lum-l2` |
| Grade 12, partial scholarship | `lum-l2` |
| Anything else | `nurture` |

## Category Actions

| Category | Action |
|----------|--------|
| `bch` | Page 2A, Viswanathan calendar |
| `lum-l1` | Page 2A, Viswanathan calendar |
| `lum-l2` | Page 2A, Viswanathan calendar |
| `nurture` parent | Page 2B contact form |
| `nurture` student | Immediate submit after Page 1 |
| `drop` | Immediate submit after Page 1 |

## Valid Input Values

| Field | Values |
|-------|--------|
| `currentGrade` | `7_below`, `8`, `9`, `10`, `11`, `12` |
| `curriculumType` | `IB`, `IGCSE`, `CBSE`, `ICSE`, `State_Boards`, `Others` |
| `scholarshipRequirement` | `scholarship_optional`, `partial_scholarship`, `full_scholarship` |
| `formFillerType` | `parent`, `student` |
| `gradeFormat` | `gpa`, `percentage` |
| `targetGeographies` | `US`, `UK`, `Rest of World`, `Need Guidance` |
