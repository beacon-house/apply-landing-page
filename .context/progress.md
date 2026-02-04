# Progress Tracker

Last updated: 2026-02-04

## Completed

### Core Features
- [x] 2-page form flow with conditional routing
- [x] Lead categorization engine (6 categories)
- [x] Supabase persistence via RPC (incremental saves)
- [x] Make.com webhook integration (dual-save)
- [x] Zustand state management
- [x] Zod validation schemas
- [x] Responsive design (mobile-first)

### Lead Qualification Rules
- [x] Global overrides (student, spam, scholarship, grade)
- [x] Indian curriculum rules (CBSE/ICSE/State_Boards stricter)
- [x] Destination-based rules (ROW-only, non-US grades 8-9)
- [x] Qualified lead categorization (BCH, Luminaire L1/L2)

### Counselor Slot Booking
- [x] Calendar date picker (7-day lookahead)
- [x] Time slot selection with availability logic
- [x] Viswanathan restrictions (Mon off, Sun 11-3, Tue-Sat 11-7)
- [x] Karthik restrictions (Sun off, 11-1 & 4-7)
- [x] 8 PM slot removed for both counselors

### Analytics & Tracking
- [x] Meta Pixel integration (~37 events)
- [x] Meta CAPI server-side tracking via Edge Function
- [x] Event deduplication (Pixel + CAPI)
- [x] Cookie polling for _fbp/_fbc
- [x] Enrichment events (phone/email capture)
- [x] Google Analytics (production only)
- [x] UTM parameter capture

### Infrastructure
- [x] Netlify deployment (staging + production)
- [x] Supabase branching (staging + main)
- [x] Environment-based configuration

## In Progress
- [ ] Google Calendar API integration (real-time availability)

## Blocked
- None currently

## Recently Shipped (Jan 2026)
| Date | Change |
|------|--------|
| Jan 23 | Remove 8 PM slot for both counselors |
| Jan 19 | Viswanathan slot availability restrictions |
| Jan 19 | Destination-based lead categorization rules |
| Jan 19 | ROW-only override |
| Jan 13 | Indian curriculum lead categorization rules |
| Jan 13 | CBSE/ICSE stricter qualification |
