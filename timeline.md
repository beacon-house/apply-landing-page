# Project timeline

Append new work at the **top** (newest first). One short block per meaningful change, migration phase, or PR. Link commits or PRs when helpful. This file complements `.context/` (source of truth for behavior) with a human-readable history.

---

## 2026-04-14 — Optional Supabase (local UI without DB)

**Summary:** Supabase is no longer required at runtime. If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing/empty, or if values match the documented template placeholders (`https://your-project.supabase.co` / `your-anon-key`), the exported client is `null`, the app boots, and funnel writes in `formTracking` are skipped (debug logs only). When both env vars are set to a real project, behavior matches the previous client.

**Motivation:** Local work on form/calendar UI without a second Supabase project and without writing to production.

**Files touched:** `src/lib/database.ts`, `src/lib/formTracking.ts`, `timeline.md`, `.context/integrations.md`.

**Revert:** Revert the commit that introduced this change, or restore the listed files from before the merge.

**Notes:**

- `insertFormSession` throws `Error('Supabase is not configured')` if called with no client (nothing in `src/` currently calls it).
- `getSessionData` returns `null` when Supabase is disabled.
- Follow-ups (not done here): Convex migration; optional dev-only switch for Meta CAPI if you want zero server calls locally.
