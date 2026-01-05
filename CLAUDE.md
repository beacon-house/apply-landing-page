# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

University admissions lead capture landing page for Beacon House. Features a 2-page form flow with conditional routing based on lead qualification. Dual-save architecture: Supabase (primary) + Make.com webhook (backup to Google Sheets).

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build to dist/
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS with custom design system (primary: #002F5C, accent: #FFC736)
- Supabase (PostgreSQL with RPC functions)
- Zustand for state management
- React Hook Form + Zod validation
- Radix UI primitives for accessible components

## Architecture

### Form Flow
1. **Page 1** (`InitialLeadCaptureForm`): Student info, academics, preferences
2. **Evaluation**: Lead categorization determines routing
3. **Page 2A** (`QualifiedLeadForm`): Counseling booking for qualified leads (BCH, Luminaire L1/L2)
4. **Page 2B** (`DisqualifiedLeadForm`): Contact info only for nurture/drop/masters leads

### Lead Categories
- **Qualified**: BCH (grades 8-11), Luminaire L1/L2 (grades 11-12) → show counseling booking
- **Disqualified**: Nurture (students, full scholarship), Drop (grade 7 and below), Masters → contact form only
- **Spam detection**: GPA=10 or percentage=100 triggers spam classification

### Key Files
- `src/lib/leadCategorization.ts` - Business rules for lead qualification
- `src/lib/formTracking.ts` - Incremental form data persistence via Supabase RPC
- `src/lib/metaPixelEvents.ts` - Analytics event tracking (35+ custom events)
- `src/store/formStore.ts` - Zustand store with session management
- `src/schemas/form.ts` - Zod validation schemas

### Database
Uses `upsert_form_session` RPC function for all writes. Table: `form_sessions` with RLS enabled. See `docs/db-schema.md` for complete schema.

## Environment Variables

Required `VITE_` prefixed variables:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `VITE_ENVIRONMENT` (prod/stg) - appended to all analytics events
- `VITE_META_PIXEL_ID`
- `VITE_REGISTRATION_WEBHOOK_URL`

## Deployment

- **Staging**: `staging` branch → staging-v2-apply-bch-in.netlify.app
- **Production**: `main` branch → apply.beaconhouse.in

Both use Netlify with branch-based auto-deploy and separate Supabase branches.

## Path Alias

`@` maps to `src/` (configured in vite.config.ts and tsconfig.json)

## Responsive Breakpoints

- `sm`: 577px (tablet)
- `md`: 1025px (desktop)
- `lg`: 1441px (large desktop)
