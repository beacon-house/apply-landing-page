# Lead Categorization Logic — Snapshot

> Rules are checked **top to bottom**. First match wins.

## Global Filters (always checked first)

1. **Student** filling form → `nurture`
2. **GPA = 10** or **Percentage = 100** → `nurture` (spam guard)
3. Wants **full scholarship** → `nurture`
4. Grade **7 or below** → `drop`
5. Grade = **Masters** → `masters`
6. Destination = **only "Rest of World"** → `nurture`

## Routing Table

| Category | Form Filler | Grade | Scholarship | Curriculum | Destinations | Next Step |
|---|---|---|---|---|---|---|
| `bch` | Parent | 8–10 | Optional | Any | Any | Calendar |
| `bch` | Parent | 8–10 | Partial | IB / IGCSE / Others | Any | Calendar |
| `bch` | Parent | 11–12 | Optional or Partial | CBSE / ICSE / State | Any | Calendar |
| `bch` | Parent | 11 | Optional or Partial | IB / IGCSE / Others | US | Calendar |
| `lum-l1` | Parent | 11 | Optional | IB / IGCSE / Others | UK / ROW / Guidance | Calendar |
| `lum-l1` | Parent | 12 | Optional | IB / IGCSE / Others | Any | Calendar |
| `lum-l2` | Parent | 11 | Partial | IB / IGCSE / Others | UK / ROW / Guidance | Calendar |
| `lum-l2` | Parent | 12 | Partial | IB / IGCSE / Others | Any | Calendar |
| `nurture` | Parent | 8–10 | Partial | CBSE / ICSE / State | Any | Contact form |
| `nurture` | Parent | 8–9 | Any | Any | Not US, Not Guidance | Contact form |
| `nurture` | Any | Any | Any | Any | Any | Contact form / Thank you |
| `masters` | Any | Masters | Any | Any | Any | Contact form |
| `drop` | Any | 7 or below | Any | Any | Any | Thank you |

## Category → Action

| Category | Counselor | Action |
|---|---|---|
| `bch` | Viswanathan | Calendar booking |
| `lum-l1` | Viswanathan | Calendar booking |
| `lum-l2` | Viswanathan | Calendar booking |
| `nurture` | — | Contact form / Submit |
| `masters` | — | Contact form |
| `drop` | — | Thank you page |

---

*Generated from `src/lib/leadCategorization.ts`*
