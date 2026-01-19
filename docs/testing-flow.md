# Lead Categorization Testing Flow

Test the form at: `http://localhost:3000/application-form`

## How to Verify

1. Open browser DevTools Console (F12)
2. Fill form with test values
3. Click "Continue" / submit Page 1
4. Check console for: `🏷️ Lead category determined: [CATEGORY]`
5. Verify correct page loads (see Expected Outcome)

---

## Test Cases

### GLOBAL OVERRIDES (checked first)

#### TC-01: Student Form Filler → nurture
| Field | Value |
|-------|-------|
| Who is filling | Student |
| Student Name | Test Student |
| Grade | 10 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US |

**Expected:** `nurture` → Immediate submission → Thank you page

---

#### TC-02: Spam Detection (GPA=10) → nurture
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 10 |
| Curriculum | IB |
| GPA | 10 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US |

**Expected:** `nurture` → Page 2B (simple contact form)

---

#### TC-03: Full Scholarship → nurture
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 10 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Full Scholarship |
| Destinations | US |

**Expected:** `nurture` → Page 2B (simple contact form)

---

#### TC-04: Grade 7 or Below → drop
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | Grade 7 or below |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US |

**Expected:** `drop` → Immediate submission → Thank you page

---

#### TC-05: Masters → masters
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | Masters |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US |

**Expected:** `masters` → Page 2B (simple contact form)

---

#### TC-06: ROW Only Destination → nurture
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 11 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | Rest of World (ONLY) |

**Expected:** `nurture` → Page 2B (simple contact form)

---

### INDIAN CURRICULUM RULES (CBSE/ICSE/State Boards)

#### TC-07: Indian Curriculum + Grade 8-10 + Partial → nurture
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 9 |
| Curriculum | CBSE |
| Percentage | 85 |
| School | Test School |
| Scholarship | Partial Scholarship |
| Destinations | US |

**Expected:** `nurture` → Page 2B (simple contact form)

---

#### TC-08: Indian Curriculum + Grade 8-10 + Optional → bch
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 9 |
| Curriculum | CBSE |
| Percentage | 85 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US |

**Expected:** `bch` → Evaluation animation → Page 2A (counseling booking)

---

#### TC-09: Indian Curriculum + Grade 11 + Optional → bch
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 11 |
| Curriculum | ICSE |
| Percentage | 85 |
| School | Test School |
| Scholarship | Optional |
| Destinations | UK |

**Expected:** `bch` → Evaluation animation → Page 2A (counseling booking)

---

#### TC-10: Indian Curriculum + Grade 12 + Partial → bch
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 12 |
| Curriculum | State_Boards |
| Percentage | 85 |
| School | Test School |
| Scholarship | Partial Scholarship |
| Destinations | US |

**Expected:** `bch` → Evaluation animation → Page 2A (counseling booking)

---

### NON-US DESTINATION RULES (Grades 8-9)

#### TC-11: UK Only + Grade 8 → nurture
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 8 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | UK (ONLY) |

**Expected:** `nurture` → Page 2B (simple contact form)

---

#### TC-12: UK + Need Guidance + Grade 9 → bch
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 9 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | UK, Need Guidance |

**Expected:** `bch` → Evaluation animation → Page 2A (counseling booking)

---

#### TC-13: US + UK + Grade 9 → bch
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 9 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US, UK |

**Expected:** `bch` → Evaluation animation → Page 2A (counseling booking)

---

### BCH CATEGORY (IB/IGCSE/Others)

#### TC-14: Grade 10 + Optional + US → bch
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 10 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US |

**Expected:** `bch` → Evaluation animation → Page 2A (counseling booking)

---

#### TC-15: Grade 11 + Partial + US → bch
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 11 |
| Curriculum | IGCSE |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Partial Scholarship |
| Destinations | US |

**Expected:** `bch` → Evaluation animation → Page 2A (counseling booking)

---

### LUMINAIRE L1 CATEGORY (IB/IGCSE/Others only)

#### TC-16: Grade 11 + Optional + UK → lum-l1
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 11 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | UK |

**Expected:** `lum-l1` → Evaluation animation → Page 2A (counseling booking)

---

#### TC-17: Grade 12 + Optional + US → lum-l1
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 12 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Optional |
| Destinations | US |

**Expected:** `lum-l1` → Evaluation animation → Page 2A (counseling booking)

---

### LUMINAIRE L2 CATEGORY (IB/IGCSE/Others only)

#### TC-18: Grade 11 + Partial + UK → lum-l2
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 11 |
| Curriculum | IB |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Partial Scholarship |
| Destinations | UK |

**Expected:** `lum-l2` → Evaluation animation → Page 2A (counseling booking)

---

#### TC-19: Grade 12 + Partial + US → lum-l2
| Field | Value |
|-------|-------|
| Who is filling | Parent |
| Student Name | Test Student |
| Grade | 12 |
| Curriculum | IGCSE |
| GPA | 8.5 |
| School | Test School |
| Scholarship | Partial Scholarship |
| Destinations | US |

**Expected:** `lum-l2` → Evaluation animation → Page 2A (counseling booking)

---

## Quick Reference: Expected Outcomes

| Category | Console Log | Next Step |
|----------|-------------|-----------|
| `drop` | 🏷️ Lead category determined: drop | Immediate submit → Thank you |
| `masters` | 🏷️ Lead category determined: masters | Page 2B (contact form) |
| `nurture` | 🏷️ Lead category determined: nurture | Page 2B (contact form) |
| `bch` | 🏷️ Lead category determined: bch | Animation → Page 2A (booking) |
| `lum-l1` | 🏷️ Lead category determined: lum-l1 | Animation → Page 2A (booking) |
| `lum-l2` | 🏷️ Lead category determined: lum-l2 | Animation → Page 2A (booking) |

## Page 2 Identification

- **Page 2A (Qualified):** Shows calendar/time slot picker for counseling booking
- **Page 2B (Disqualified):** Shows only Parent Name and Email fields

---

## Report Issues

If any test fails, note:
1. Test case number (e.g., TC-06)
2. Expected category vs actual category from console
3. Expected page vs actual page shown
