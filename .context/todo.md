# Todo List

Last updated: 2026-04-17

## Priority 1 - Active
- [ ] Make.com scenario update (Krishna)
  - Add router after Google Sheets module, check needs_manual_followup
  - Route A (failure): send red-header failure email to founders + savitha + krishna
  - Route B (normal): existing email + calendar event flow
  - Re-determine webhook data structure to pick up 6 new booking fields
  - Add failure email HTML template

## Priority 2 - Planned
- [ ] "None of these times work" escape hatch for fully booked days
  - When all slots on all 7 days are booked, user has no way to submit
  - Add callback request option that triggers needs_manual_followup
- [ ] Form abandonment recovery
  - Session recovery for returning users
  - Abandoned session notifications
- [ ] Enhanced analytics
  - Time-on-field tracking
  - Drop-off point identification

## Priority 3 - Backlog
- [ ] WhatsApp integration
  - Post-submission confirmation
  - Nurture sequence triggers
- [ ] A/B testing framework
  - CTA copy variants
  - Form field ordering tests

## Tech Debt
- [ ] Add unit tests for leadCategorization.ts
- [ ] Consolidate form utility functions
- [ ] TypeScript strict mode cleanup

## Completed
- [x] Google Calendar API integration (read-only FreeBusy) — shipped Apr 17, 2026
- [x] Booked/available slot UI with greyed-out booked slots — shipped Apr 17, 2026
- [x] Booking failure handling + needs_manual_followup flag — shipped Apr 17, 2026
- [x] Static fallback when API unavailable — shipped Apr 17, 2026
- [x] Decoupled submission (Supabase/Meta/Make.com always fire) — shipped Apr 17, 2026
- [x] 6 booking status fields in webhook + Supabase — shipped Apr 17, 2026

## Won't Do
- Multi-language support (English-only audience)
- Social login (not needed for lead gen)
- SMS notifications (WhatsApp preferred)
- gcal-booking Netlify function (removed — Make.com handles event creation)
