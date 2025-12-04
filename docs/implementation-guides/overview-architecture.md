# Application Architecture Overview

**Version:** 2.0
**Last Updated:** 2025-12-04
**Purpose:** High-level architecture and implementation overview

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Key Design Decisions](#key-design-decisions)
6. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

### Purpose
University admissions lead capture and qualification form for Beacon House.

### Key Features
- 2-page progressive form with conditional routing
- Automatic lead qualification and categorization
- Counseling booking for qualified leads
- Real-time data persistence (incremental saves)
- Comprehensive event tracking (35 Meta Pixel events)
- Mobile-first responsive design

### User Journey
```
Landing Page → Form Start → Page 1 (11 fields) → Lead Qualification
    ↓
    ├─ Grade 7/Student → Immediate Submission → Success
    ├─ Qualified (BCH/LUM) → Animation → Page 2A (Booking) → Success
    └─ Disqualified (NURTURE/MASTERS) → Page 2B (Contact) → Success
```

---

## Technology Stack

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Form Management
- **React Hook Form** - Form state and validation
- **Zod** - Schema validation (TypeScript-first)

### State Management
- **Zustand** - Lightweight global state
  - Form data persistence
  - Session tracking
  - Event accumulation
  - UTM parameters

### Database
- **Supabase** (PostgreSQL)
  - Real-time data persistence
  - Incremental saves (upsert pattern)
  - RPC functions for complex operations
  - JSONB for arrays (events, geographies)

### UI Components
- **Radix UI** - Accessible primitives (Select, Dialog, etc.)
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Analytics
- **Meta Pixel** - Facebook/Instagram conversion tracking
  - 35 custom events
  - Event accumulation in database
  - Environment-specific naming

### Integrations
- **Make.com Webhook** - Form submission endpoint
  - CRM integration
  - Email automation
  - Data processing

### Routing
- **React Router** - SPA navigation
  - `/` - Landing page
  - `/application-form` - Form page

---

## Component Architecture

### Component Hierarchy

```
App.tsx
├── LandingPage.tsx
│   ├── Header.tsx (CTA button)
│   └── Hero Section (CTA button)
│
└── FormPage.tsx
    └── FormContainer.tsx (Orchestrator)
        ├── InitialLeadCaptureForm.tsx (Page 1)
        │   ├── Section 1: Student Info (5 fields)
        │   ├── Section 2: Academic Info (5 fields)
        │   └── Section 3: Preferences (2 fields)
        │
        ├── SequentialLoadingAnimation.tsx (Evaluation - 10s)
        │
        ├── QualifiedLeadForm.tsx (Page 2A)
        │   ├── Counselor Profile Card
        │   ├── Date/Time Selector
        │   └── Parent Contact (2 fields)
        │
        └── DisqualifiedLeadForm.tsx (Page 2B)
            ├── Category-Specific Messaging
            └── Parent Contact (2 fields)
```

### Component Responsibilities

**FormContainer (Orchestrator)**
- Manages current step (page 1 or 2)
- Handles form submission routing
- Triggers lead categorization
- Shows/hides evaluation animation
- Decides which Page 2 form to display
- Handles success state

**InitialLeadCaptureForm (Page 1)**
- Renders all 11 form fields
- Manages form validation (Zod schema)
- Triggers incremental saves on section completion
- Handles Continue button submission
- Implements error focusing logic

**QualifiedLeadForm (Page 2A)**
- Displays assigned counselor (based on category)
- Renders 7-day calendar picker
- Implements time slot filtering logic
- Collects parent contact info
- Handles booking submission

**DisqualifiedLeadForm (Page 2B)**
- Displays category-specific messaging
- Collects parent contact info only
- Simpler flow, no booking

**SequentialLoadingAnimation**
- Shows 3-step evaluation animation
- 10-second duration total
- Runs only for qualified leads
- Transitions to Page 2A on completion

---

## Data Flow

### State Management (Zustand)

**Store Structure:**
```typescript
{
  currentStep: number (1 or 2)
  formData: Partial<CompleteFormData>
  isSubmitting: boolean
  isSubmitted: boolean
  startTime: number
  sessionId: string (UUID)
  triggeredEvents: string[]
  utmParameters: UtmParameters
}
```

**Key Actions:**
- `setStep(step)` - Navigate between pages
- `updateFormData(data)` - Merge new form data
- `addTriggeredEvents(events)` - Accumulate pixel events
- `setUtmParameters(utm)` - Store UTM params

---

### Database Persistence

**Strategy:** Incremental saves using upsert pattern

**Write Operations (11 total):**
1. Form start (component mount)
2. Student info complete (section)
3. Academic info complete (section)
4. Preferences complete (section)
5. Page 1 complete (submit)
6. Lead evaluated (after animation - qualified only)
7. Page 2 view (navigation - disqualified only)
8. Counseling slot selected (Page 2A only)
9. Contact details entered (Page 2A & 2B)
10. Form submit (final)
11. Immediate submission (Grade 7/Student)

**Upsert Logic:**
```
ON CONFLICT (session_id) DO UPDATE
  SET field = COALESCE(new_value, existing_value)
```
- Never overwrites existing data with nulls
- Always preserves previously filled fields

**Database Function:**
- `upsert_form_session(session_id, form_data)`
- JSONB parameter for flexible schema
- Returns record UUID

---

### Event Tracking

**Meta Pixel Events (35 total):**

**Categories:**
1. CTA Events (2) - Landing page clicks
2. Primary Classification (8) - Parent/Student, Qualified/Disqualified, Spam
3. General Funnel (4) - Page milestones
4. Category-Specific (12) - BCH, LUM-L1, LUM-L2 events
5. Qualified Funnel (8) - Parent/Student qualified progression

**Event Flow:**
```
Event fires → Meta Pixel tracks → Event name stored in Zustand
→ Included in database save → Sent with webhook
```

**Event Naming:**
- Staging: `event_name_stg`
- Production: `event_name_prod`

---

### Form Submission Flow

```
Page 1 Submit
    ↓
Validation (Zod)
    ↓
Lead Categorization (6 categories)
    ↓
Update Zustand store
    ↓
Fire Meta Pixel events (5-8 events)
    ↓
Save to database (funnel_stage: 05_page1_complete)
    ↓
Routing Decision:
    ├─ Grade 7 / Student → Submit immediately
    ├─ Qualified → Show animation → Page 2A
    └─ Disqualified → Page 2B

Page 2 Submit
    ↓
Validation (Zod)
    ↓
Fire Meta Pixel events (1-3 events)
    ↓
Save to database (funnel_stage: 10_form_submit)
    ↓
Submit to webhook (Make.com)
    ↓
Show success screen
```

---

## Key Design Decisions

### 1. Progressive Form (2 Pages)
**Decision:** Split form into 2 pages with conditional Page 2

**Rationale:**
- Reduce initial overwhelm (11 fields on Page 1)
- Qualify leads early (Page 1 categorization)
- Show relevant Page 2 based on qualification
- Higher completion rates

**Trade-off:** More complex routing logic vs better UX

---

### 2. Incremental Database Saves
**Decision:** Save form data at every section completion

**Rationale:**
- No data loss on abandonment
- Enable funnel drop-off analysis
- Support session recovery (future)
- Track user progress granularly

**Trade-off:** More database writes vs data safety

---

### 3. Immediate Submission for Grade 7/Students
**Decision:** Submit form after Page 1 for certain segments

**Rationale:**
- Grade 7 too young for program (no counseling needed)
- Students less qualified than parents
- Reduce friction for non-viable leads
- Capture data for future nurturing

**Trade-off:** Less data collected vs faster submission

---

### 4. Counselor Assignment by Category
**Decision:** BCH → Vishy, LUM-L1/LUM-L2 → Karthik

**Rationale:**
- Match lead priority to senior counselor (BCH highest)
- Distribute workload based on capacity
- Different availability patterns

---

### 5. Client-Side Lead Categorization
**Decision:** Categorize leads in frontend before submission

**Rationale:**
- Immediate routing decision (no server round-trip)
- Works even if webhook fails
- Stored in database for verification
- Can be recalculated if needed

**Trade-off:** Categorization logic duplicated if server-side needed

---

### 6. COALESCE in Upsert
**Decision:** Use COALESCE to never overwrite existing data with nulls

**Rationale:**
- Incremental saves send incomplete data
- Preserve previously filled fields
- Handle browser refresh / back navigation
- Data accumulation, not replacement

---

### 7. Event Accumulation in Database
**Decision:** Store all fired events in triggered_events JSONB array

**Rationale:**
- Event audit trail
- Debug pixel tracking
- Analyze user paths
- Verify event firing

**Trade-off:** Larger database records vs complete event history

---

### 8. Environment-Specific Event Names
**Decision:** Suffix all events with `_stg` or `_prod`

**Rationale:**
- Separate staging/production events in Meta Pixel
- Prevent test data pollution
- Different optimization for each environment

---

### 9. Webhook as Secondary Data Capture
**Decision:** Database is primary, webhook is secondary

**Rationale:**
- Form continues if webhook fails
- Database saves are real-time
- Webhook can be retried manually
- User never blocked by integration failures

**Trade-off:** Potential data sync issues vs better UX

---

## Implementation Roadmap

### Phase 1: Database Setup
1. Create Supabase project
2. Create form_sessions table (35 columns)
3. Create upsert_form_session function
4. Add indexes
5. Test connection

### Phase 2: Core Form (Page 1)
1. Set up React project with TypeScript
2. Install dependencies (React Hook Form, Zod, Zustand)
3. Create Zustand store
4. Build InitialLeadCaptureForm component
5. Implement all 11 fields with validation
6. Add error focusing logic
7. Style with Tailwind CSS

### Phase 3: Lead Categorization
1. Create leadCategorization.ts
2. Implement 6 category logic
3. Add global override rules
4. Add qualified lead rules
5. Test all categorization paths

### Phase 4: Routing & Page 2
1. Create FormContainer orchestrator
2. Implement routing logic
3. Build SequentialLoadingAnimation
4. Create QualifiedLeadForm (Page 2A)
5. Create DisqualifiedLeadForm (Page 2B)
6. Implement counselor assignment
7. Build calendar picker and time slot logic

### Phase 5: Database Integration
1. Install @supabase/supabase-js
2. Create database.ts connection
3. Create formTracking.ts
4. Implement saveFormDataIncremental
5. Add useEffect watchers for sections
6. Test incremental saves
7. Verify upsert behavior

### Phase 6: Meta Pixel Events
1. Get Meta Pixel ID
2. Create metaPixelEvents.ts
3. Implement initializeMetaPixel
4. Create all 35 event functions
5. Add environment suffix logic
6. Integrate event firing in forms
7. Test event accumulation
8. Verify in Facebook Events Manager

### Phase 7: Webhook Integration
1. Get Make.com webhook URL
2. Create submitFormData function
3. Build webhook payload (snake_case)
4. Add error handling (non-blocking)
5. Test end-to-end submission

### Phase 8: Polish & Testing
1. Add loading states
2. Implement success screens
3. Test all user paths
4. Test validation and errors
5. Mobile responsive testing
6. Cross-browser testing
7. Performance optimization

### Phase 9: Deployment
1. Configure environment variables
2. Build production bundle
3. Deploy to hosting (Netlify/Vercel)
4. Configure custom domain
5. Set up monitoring
6. Test production environment

---

## File Structure

```
src/
├── components/
│   ├── forms/
│   │   ├── FormContainer.tsx
│   │   ├── InitialLeadCaptureForm.tsx
│   │   ├── QualifiedLeadForm.tsx
│   │   └── DisqualifiedLeadForm.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── label.tsx
│   │   └── SequentialLoadingAnimation.tsx
│   ├── LandingPage.tsx
│   ├── Header.tsx
│   └── FormPage.tsx
│
├── lib/
│   ├── database.ts (Supabase connection)
│   ├── formTracking.ts (Incremental saves)
│   ├── leadCategorization.ts (Category logic)
│   ├── metaPixelEvents.ts (Event tracking)
│   ├── form.ts (Submission & validation)
│   ├── formUtils.ts (Error focusing)
│   └── utm.ts (UTM capture)
│
├── schemas/
│   └── form.ts (Zod schemas)
│
├── types/
│   └── form.ts (TypeScript types)
│
├── store/
│   └── formStore.ts (Zustand store)
│
├── App.tsx
└── main.tsx

docs/
└── implementation-guides/
    ├── overview-architecture.md (this file)
    ├── db-schema.md (Database specs)
    └── form-structure.md (Fields & branching)
```

---

## Environment Variables

### Required Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Meta Pixel
VITE_META_PIXEL_ID=549164201502176

# Environment
VITE_ENVIRONMENT=stg  # or 'prod'

# Webhook
VITE_REGISTRATION_WEBHOOK_URL=https://hook.us2.make.com/...
```

---

## Testing Checklist

### Functional Testing
- [ ] All 11 Page 1 fields validate correctly
- [ ] Lead categorization assigns correct categories
- [ ] Grade 7/Student submit immediately
- [ ] Qualified leads see animation then Page 2A
- [ ] Disqualified leads see Page 2B
- [ ] BCH shows Vishy, LUM shows Karthik
- [ ] Calendar and time slots work correctly
- [ ] Karthik's availability restrictions apply
- [ ] Form submission completes successfully
- [ ] Success messages display correctly

### Data Testing
- [ ] All incremental saves work
- [ ] Database upsert doesn't overwrite existing data
- [ ] All 35 columns saved correctly
- [ ] triggered_events array accumulates
- [ ] UTM parameters captured
- [ ] Webhook receives correct payload

### Event Testing
- [ ] Meta Pixel initializes
- [ ] All 35 events fire at correct times
- [ ] Events have correct environment suffix
- [ ] Events stored in database
- [ ] Events visible in Facebook Events Manager

### UX Testing
- [ ] Error messages display correctly
- [ ] Error focusing works
- [ ] Sticky buttons appear after scroll
- [ ] Loading states show during submission
- [ ] Mobile responsive on all screens
- [ ] Back button preserves data

---

**END OF ARCHITECTURE OVERVIEW**

This document provides the high-level architecture and implementation guide. Refer to companion documents for detailed specifications.
