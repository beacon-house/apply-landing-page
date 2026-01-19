# Lead Categorization Testing

## Instructions for Claude in Chrome

1. Open browser DevTools (F12) → Console tab
2. For each test case below:
   - Fill the form with the specified values
   - Click the submit/continue button
   - Check console for log starting with `🏷️ Lead category determined:`
   - Verify the category matches expected
   - Verify the correct page loads (Page 2A = calendar booking, Page 2B = simple contact form)
3. Report results in this format:
   ```
   TC-XX: PASS/FAIL
   - Expected: [category] → [page]
   - Actual: [category from console] → [page that loaded]
   ```

---

## Test Cases

### GLOBAL OVERRIDES

**TC-01: Student Form Filler**
- Who is filling: `Student`
- Student Name: `Test Student`
- Grade: `10`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`
- **Expected:** `nurture` → Immediate submission → Thank you page

**TC-02: Spam Detection (GPA=10)**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `10`
- Curriculum: `IB`
- GPA: `10`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`
- **Expected:** `nurture` → Page 2B (contact form only)

**TC-03: Full Scholarship**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `10`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Full Scholarship`
- Destinations: `US`
- **Expected:** `nurture` → Page 2B

**TC-04: Grade 7 or Below**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `Grade 7 or below`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`
- **Expected:** `drop` → Immediate submission → Thank you page

**TC-05: Masters**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `Masters`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`
- **Expected:** `masters` → Page 2B

**TC-06: ROW Only Destination**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `11`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `Rest of World` (select ONLY this one)
- **Expected:** `nurture` → Page 2B

---

### DESTINATION-BASED RULES (Grades 8-9)

**TC-07: UK Only + Grade 8**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `8`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `UK` (select ONLY this one)
- **Expected:** `nurture` → Page 2B

**TC-08: UK + Need Guidance + Grade 9 (should qualify)**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `9`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `UK`, `Need Guidance` (select both)
- **Expected:** `bch` → Animation → Page 2A (calendar booking)

**TC-09: US + UK + Grade 9 (should qualify)**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `9`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`, `UK` (select both)
- **Expected:** `bch` → Animation → Page 2A

---

### INDIAN CURRICULUM RULES (CBSE/ICSE/State Boards)

**TC-10: CBSE + Grade 9 + Partial**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `9`
- Curriculum: `CBSE`
- Percentage: `85`
- School: `Test School`
- Scholarship: `Partial Scholarship`
- Destinations: `US`
- **Expected:** `nurture` → Page 2B

**TC-11: CBSE + Grade 9 + Optional (should qualify)**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `9`
- Curriculum: `CBSE`
- Percentage: `85`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`
- **Expected:** `bch` → Animation → Page 2A

**TC-12: ICSE + Grade 11 + Optional**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `11`
- Curriculum: `ICSE`
- Percentage: `85`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `UK`
- **Expected:** `bch` → Animation → Page 2A

**TC-13: State Boards + Grade 12 + Partial**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `12`
- Curriculum: `State_Boards`
- Percentage: `85`
- School: `Test School`
- Scholarship: `Partial Scholarship`
- Destinations: `US`
- **Expected:** `bch` → Animation → Page 2A

---

### BCH CATEGORY (IB/IGCSE/Others)

**TC-14: Grade 10 + Optional + US**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `10`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`
- **Expected:** `bch` → Animation → Page 2A

**TC-15: Grade 11 + Partial + US**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `11`
- Curriculum: `IGCSE`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Partial Scholarship`
- Destinations: `US`
- **Expected:** `bch` → Animation → Page 2A

---

### LUMINAIRE L1 (IB/IGCSE/Others only)

**TC-16: Grade 11 + Optional + UK**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `11`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `UK`
- **Expected:** `lum-l1` → Animation → Page 2A

**TC-17: Grade 12 + Optional + US**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `12`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Optional`
- Destinations: `US`
- **Expected:** `lum-l1` → Animation → Page 2A

---

### LUMINAIRE L2 (IB/IGCSE/Others only)

**TC-18: Grade 11 + Partial + UK**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `11`
- Curriculum: `IB`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Partial Scholarship`
- Destinations: `UK`
- **Expected:** `lum-l2` → Animation → Page 2A

**TC-19: Grade 12 + Partial + US**
- Who is filling: `Parent`
- Student Name: `Test Student`
- Grade: `12`
- Curriculum: `IGCSE`
- GPA: `8.5`
- School: `Test School`
- Scholarship: `Partial Scholarship`
- Destinations: `US`
- **Expected:** `lum-l2` → Animation → Page 2A

---

## Quick Reference

| Category | Console Shows | Next Step |
|----------|---------------|-----------|
| `drop` | `🏷️ Lead category determined: drop` | Immediate submit → Thank you |
| `masters` | `🏷️ Lead category determined: masters` | Page 2B (contact form) |
| `nurture` | `🏷️ Lead category determined: nurture` | Page 2B (contact form) |
| `bch` | `🏷️ Lead category determined: bch` | Animation → Page 2A (booking) |
| `lum-l1` | `🏷️ Lead category determined: lum-l1` | Animation → Page 2A (booking) |
| `lum-l2` | `🏷️ Lead category determined: lum-l2` | Animation → Page 2A (booking) |

## Page Identification

- **Page 2A (Qualified):** Has calendar with date picker and time slots
- **Page 2B (Disqualified):** Has only Parent Name and Email fields
