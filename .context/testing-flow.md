# Testing Flow

This file covers manual verification. Code remains the source of truth.

## Lead Category Tests

Open the form, fill Page 1 with each case, submit, then check:

- Console log beginning `Lead category determined`
- Next UX path
- `triggered_events` where relevant

| Case | Inputs | Expected |
|------|--------|----------|
| Student | Student, grade 10, IB, GPA 8.5, optional scholarship, US | `nurture`, immediate submit |
| Spam GPA | Parent, grade 10, IB, GPA 10, optional scholarship, US | `drop`, immediate submit |
| Spam percentage | Parent, grade 10, IB, percentage 100, optional scholarship, US | `drop`, immediate submit |
| Full scholarship | Parent, grade 10, IB, GPA 8.5, full scholarship, US | `nurture`, Page 2B |
| Grade 7 below | Parent, grade `7_below`, IB, GPA 8.5, optional scholarship, US | `drop`, immediate submit |
| ROW only | Parent, grade 11, IB, GPA 8.5, optional scholarship, only Rest of World | `nurture`, Page 2B |
| Grade 8 Jan-Jun seasonal | Parent, grade 8, IB, GPA 8.5, optional scholarship, US, evaluated Jan 1-Jun 30 in Asia/Kolkata | `nurture`, Page 2B |
| Grade 8 Jul-Dec standard | Parent, grade 8, IB, GPA 8.5, optional scholarship, US, evaluated Jul 1-Dec 31 in Asia/Kolkata | `bch`, Page 2A |
| Grade 8 UK only | Parent, grade 8, IB, GPA 8.5, optional scholarship, only UK | `nurture`, Page 2B |
| Grade 9 UK + Need Guidance | Parent, grade 9, IB, GPA 8.5, optional scholarship, UK + Need Guidance | `bch`, Page 2A |
| Grade 9 US + UK | Parent, grade 9, IB, GPA 8.5, optional scholarship, US + UK | `bch`, Page 2A |
| CBSE grade 9 partial | Parent, grade 9, CBSE, percentage 85, partial scholarship, US | `nurture`, Page 2B |
| CBSE grade 9 optional | Parent, grade 9, CBSE, percentage 85, optional scholarship, US | `bch`, Page 2A |
| ICSE grade 11 optional | Parent, grade 11, ICSE, percentage 85, optional scholarship, UK | `bch`, Page 2A |
| State Boards grade 12 partial | Parent, grade 12, State_Boards, percentage 85, partial scholarship, US | `bch`, Page 2A |
| IB grade 10 optional | Parent, grade 10, IB, GPA 8.5, optional scholarship, US | `bch`, Page 2A |
| IGCSE grade 11 partial US | Parent, grade 11, IGCSE, GPA 8.5, partial scholarship, US | `bch`, Page 2A |
| IB grade 11 optional UK | Parent, grade 11, IB, GPA 8.5, optional scholarship, UK | `lum-l1`, Page 2A |
| IB grade 12 optional US | Parent, grade 12, IB, GPA 8.5, optional scholarship, US | `lum-l1`, Page 2A |
| IB grade 11 partial UK | Parent, grade 11, IB, GPA 8.5, partial scholarship, UK | `lum-l2`, Page 2A |
| IGCSE grade 12 partial US | Parent, grade 12, IGCSE, GPA 8.5, partial scholarship, US | `lum-l2`, Page 2A |

## Page Identification

- Page 2A: Viswanathan profile, date picker, slot selector, parent details.
- Page 2B: parent name and email only.
- Drop/student immediate submit: thank-you state after Page 1.

## Tracking Checks

For tracking work, verify separately:

- Meta Pixel event names and suffixes.
- CAPI request to `/.netlify/functions/meta-capi`.
- Pixel/CAPI event ID dedupe.
- GA4 mirror event names and `source: apply_lp`.
- `apply_tam_prnt_level2` fires on Page 2A email blur.
- Webhook payload contains current ad params and booking status fields.
- Supabase incremental saves use valid funnel stages.

Use live dashboards for final confirmation. Local code can prove wiring, not delivery.
