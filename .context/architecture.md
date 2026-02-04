# Architecture

Last updated: 2026-02-04
Source: Codebase structure analysis

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Meta Pixel  │  │ React App   │  │ GA4 (prod)  │     │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘     │
└─────────┼────────────────┼───────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────┐  ┌─────────────────┐
│ Meta Servers    │  │ Supabase        │
│ (Pixel Events)  │  │ - PostgreSQL    │
└─────────────────┘  │ - Edge Functions│
          ▲          └────────┬────────┘
          │                   │
┌─────────┴───────┐          ▼
│ Supabase Edge   │   ┌─────────────────┐
│ (Meta CAPI)     │   │ Make.com        │
└─────────────────┘   └────────┬────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌──────────┐         ┌──────────┐
              │ Google   │         │ Email    │
              │ Sheets   │         │ Notifs   │
              └──────────┘         └──────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18.3 + TypeScript 5.5 |
| Build | Vite 5.4 |
| Routing | React Router 6.22 |
| Styling | Tailwind CSS 3.4 |
| UI Components | Radix UI (dialog, select, label, progress) |
| Forms | React Hook Form 7.51 + Zod 3.22 |
| State | Zustand 4.5 |
| Database | Supabase PostgreSQL |
| Hosting | Netlify |

## Directory Structure

```
src/
├── components/
│   ├── forms/
│   │   ├── FormContainer.tsx      # Form orchestration
│   │   ├── InitialLeadCaptureForm.tsx  # Page 1
│   │   ├── QualifiedLeadForm.tsx       # Page 2A
│   │   └── DisqualifiedLeadForm.tsx    # Page 2B
│   ├── ui/                        # Radix-based components
│   ├── LandingPage.tsx
│   ├── FormPage.tsx
│   └── Header.tsx
├── lib/
│   ├── leadCategorization.ts      # Lead qualification rules
│   ├── formTracking.ts            # Supabase persistence
│   ├── metaPixelEvents.ts         # Client-side tracking
│   ├── metaCAPI.ts                # Server-side tracking
│   ├── database.ts                # Supabase client
│   ├── cookiePolling.ts           # Meta cookie wait
│   └── utils.ts                   # CSS utilities
├── schemas/
│   └── form.ts                    # Zod schemas
├── store/
│   └── formStore.ts               # Zustand store
└── types/
    └── form.ts                    # TypeScript interfaces
```

## Data Flow

### Form Submission Pipeline

1. **Page 1 Fill** → Zustand store updated
2. **Section Complete** → `trackFormSection()` → Supabase save
3. **Continue Click** → `determineLeadCategory()` → Route decision
4. **Page 2 Load** → Page 2A (calendar) or 2B (contact)
5. **Page 2 Fill** → Zustand store updated
6. **Submit Click** → Final Supabase save + Make.com webhook
7. **Thank You** → Form state reset

### Dual Persistence

**Primary:** Supabase PostgreSQL
- Real-time queries
- CRM integration ready
- Incremental saves at each step

**Backup:** Make.com → Google Sheets
- Team access for manual review
- Triggered on final submit only

## State Management

```typescript
// Zustand store (src/store/formStore.ts)
interface FormState {
  currentStep: number;           // 1 or 2
  formData: Partial<CompleteFormData>;
  sessionId: string;             // UUID
  triggeredEvents: string[];     // Meta events
  utmParameters: UtmParameters;
  eventCounter: number;          // For event deduplication
  isSubmitting: boolean;
  isSubmitted: boolean;
  startTime: number;
}
```

## Key Design Patterns

### Incremental Saves
Form data saved at each section completion, not just final submit. Enables abandonment tracking and partial lead recovery.

### Lead Category as Router
Category determines UX flow:
- `bch`, `lum-l1`, `lum-l2` → Page 2A (calendar)
- `nurture`, `masters` → Page 2B (contact)
- `drop` → Immediate submit

### Event Deduplication
Same `eventId` sent to both Pixel and CAPI:
```
{sessionId}_{eventName}_{timestamp}_{counter}
```

### Cookie Polling
Events queued until Meta cookies available. Improves event match quality by 15-20%.

## Environment Isolation

| Environment | Branch | Domain | Supabase |
|-------------|--------|--------|----------|
| Staging | staging | staging-v2-apply-bch-in.netlify.app | staging branch |
| Production | main | apply.beaconhouse.in | main branch |

Analytics events suffixed with environment (`_stg` or `_prod`).
