# Next Session — Budget MVP

## Current state (done)
- Supabase tables `budget_categories` and `budget_transactions` exist; `created_by` uses `auth.uid()` (auth.users.id FK).
- `budget_categories.created_by` now defaults to `auth.uid()` NOT NULL; `created_at` defaults to `now()` NOT NULL; backfilled any NULL `created_at` rows.
- `/budget` protected route is live enough to create/view data for the current workspace (read-only UI today).

## Known weirdness/notes
- Month boundaries use UTC; needs user-local timezone refinement later.
- Transactions list shows `created_by` as raw UUID (no profile join yet).

## Next step (do first)
- Add a minimal transaction add flow on `/budget` (server action + form) for type/category/amount/occurred_at/description.

## Next tasks
- Show category selection from workspace categories when adding a transaction; handle uncategorized gracefully.
- Add month-to-date calculations using user-local timezone once available.
- Surface friendly names for `created_by` via profiles join or map.
