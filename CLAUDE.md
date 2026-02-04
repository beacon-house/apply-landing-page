# Apply Landing Page

Lead capture for Beacon House admissions consultancy. 2-page form with lead qualification and counselor booking.

## Stack
React 18 + TypeScript + Vite | Tailwind | Supabase | Zustand | React Hook Form + Zod

## Commands
```bash
npm run dev      # Dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Context Docs (.context/)

**Load these based on task:**

| File | When to Load |
|------|--------------|
| `prd.md` | Form fields, user flows, counselor availability |
| `lead-rules.md` | **CRITICAL** - Lead categorization logic, qualification rules |
| `meta-events.md` | Meta Pixel events, CAPI, tracking implementation |
| `db-schema.md` | Database columns, funnel stages, RPC functions |
| `architecture.md` | System design, data flow, tech stack |
| `integrations.md` | Supabase, Make.com, Meta, Netlify setup |
| `progress.md` | What's done, in progress, recently shipped |
| `todo.md` | Prioritized task list |

## Key Files

| Purpose | File |
|---------|------|
| Lead qualification | `src/lib/leadCategorization.ts` |
| Form persistence | `src/lib/formTracking.ts` |
| Meta events | `src/lib/metaPixelEvents.ts` |
| CAPI integration | `src/lib/metaCAPI.ts` |
| Form state | `src/store/formStore.ts` |
| Validation | `src/schemas/form.ts` |
| Types | `src/types/form.ts` |
| Page 1 form | `src/components/forms/InitialLeadCaptureForm.tsx` |
| Page 2A (calendar) | `src/components/forms/QualifiedLeadForm.tsx` |
| Page 2B (contact) | `src/components/forms/DisqualifiedLeadForm.tsx` |

## Quick Reference

### Lead Categories
| Category | Counselor | Page 2 |
|----------|-----------|--------|
| `bch` | Viswanathan | Calendar booking |
| `lum-l1` | Karthik | Calendar booking |
| `lum-l2` | Karthik | Calendar booking |
| `nurture` | - | Contact form |
| `masters` | - | Contact form |
| `drop` | - | Immediate submit |

### Indian Curriculum Rule
CBSE/ICSE/State_Boards have stricter rules than IB/IGCSE.

## Deployment
- **Staging:** `staging` → staging-v2-apply-bch-in.netlify.app
- **Production:** `main` → apply.beaconhouse.in

## docs/ Folder
Legacy documentation. May be outdated. **Trust `.context/` and code as source of truth.**

---
**IMPORTANT:** After ANY code change, update relevant `.context/` docs.
