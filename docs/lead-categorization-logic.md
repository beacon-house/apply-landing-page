# Lead Categorization Logic

From the repo root, the current source of truth is `../.context/lead-qualification.md` and `src/lib/leadCategorization.ts`.

Do not maintain a separate rule snapshot in this repo. The previous snapshot was archived because it became stale after:

- `masters` was removed from the active form.
- spam parents with GPA `10` or percentage `100` were changed to `drop`.
- all qualified leads were routed to Viswanathan.
