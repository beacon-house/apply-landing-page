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

## Context Docs

Durable product context lives outside this code repo at `../.context/`. Keep this repo focused on source code, build/deploy config, migrations, and repo-local operating notes.

**Active docs (load based on task):**

| File | When to Load |
|------|--------------|
| `architecture.md` | System design, directory structure, data flow, tech stack |
| `lead-qualification.md` | **CRITICAL** — Lead categorization rules, qualification logic, counselor routing |
| `prd.md` | Form fields, validation, page flows, counselor availability, funnel stages, webhook payload |
| `db-schema.md` | Database columns, RPC function, migrations, known issues |
| `integrations.md` | Supabase, Make.com, Meta Pixel/CAPI, Google Calendar, Netlify setup |
| `workflow-setup.md` | Full deployment + Make.com flow + environment setup |
| `meta-events.md` | Meta Pixel events, CAPI, tracking implementation |
| `testing-flow.md` | Manual testing instructions |
| `progress.md` | What's done, in progress, recently shipped |
| `todo.md` | Prioritized task list |
| `supabase-india-ban-impact.md` | India IP ban workaround details |

**Reference files (outside the repo):**

| File | When to Load |
|------|--------------|
| `../makedotcom-scenario-v1.json` | Make.com scenario blueprint (router, failure/success paths) |
| `../landing-page-copy.md` | Landing page marketing copy |
| `../.context/brand-guidelines.md` | Brand assets and design system |
| `../.context/archive/` | Superseded CAPI, database, form, and lead-rule references |

**Archived files** in `../.context/archive/` are superseded by active docs above. Read only if needed for historical context.

## MANDATORY Rule
When clarification is needed, ask Krishna before proceeding. Do not guess when the repo, context docs, or live workflow do not answer the question.

## Key Files

| Purpose | File |
|---------|------|
| Lead qualification | `src/lib/leadCategorization.ts` |
| Form persistence | `src/lib/formTracking.ts` |
| Webhook payload | `src/lib/form.ts` |
| Meta events | `src/lib/metaPixelEvents.ts` |
| CAPI integration | `src/lib/metaCAPI.ts` |
| Form state | `src/store/formStore.ts` |
| Validation | `src/schemas/form.ts` |
| Types (incl. BookingFailureContext) | `src/types/form.ts` |
| Page 1 form | `src/components/forms/InitialLeadCaptureForm.tsx` |
| Page 2A (calendar + booking) | `src/components/forms/QualifiedLeadForm.tsx` |
| Page 2B (contact) | `src/components/forms/DisqualifiedLeadForm.tsx` |
| Form orchestration | `src/components/forms/FormContainer.tsx` |
| Calendar availability endpoint | `netlify/functions/gcal-availability.ts` |
| Counselor policies + routing | `netlify/functions/_counselorConfig.ts` |
| Google Calendar auth + helpers | `netlify/functions/_gcal.ts` |
| Slot building + busy detection | `netlify/functions/_slotEngine.ts` |
| DB migrations | `supabase/migrations/` (2 files) |

## Quick Reference

### Lead Categories
| Category | Counselor | Page 2 |
|----------|-----------|--------|
| `bch` | Viswanathan | Calendar booking |
| `lum-l1` | Viswanathan | Calendar booking |
| `lum-l2` | Viswanathan | Calendar booking |
| `nurture` | - | Contact form |
| `drop` | - | Immediate submit (grade 7_below OR spam: GPA=10/percentage=100) |

> All qualified leads route to Viswanathan. Spam parents → drop (no Page 2, no email capture).

### Indian Curriculum Rule
CBSE/ICSE/State_Boards have stricter rules than IB/IGCSE.

## Deployment
- **Staging:** `staging` → staging-v2-apply-bch-in.netlify.app
- **Production:** `main` → apply.beaconhouse.in

---
**IMPORTANT:** After significant code or decision changes, update the relevant docs in `../.context/`.
