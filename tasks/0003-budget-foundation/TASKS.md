# TASKS — 0003 Budget Foundation

Status: Not started

Goal: Define budgeting schema and basic CRUD foundation (to be implemented later).

Schema proposal (Markdown):
- `budget_categories` — id (uuid), workspace_id (uuid), user_id (uuid), name (text), created_at, updated_at
- `budgets` — id (uuid), workspace_id (uuid), user_id (uuid), category_id (uuid, fk budget_categories), period_start (date), period_end (date), amount (numeric), created_at, updated_at
- `transactions` — id (uuid), workspace_id (uuid), user_id (uuid), budget_id (uuid, fk budgets), category_id (uuid, fk budget_categories), description (text), amount (numeric), occurred_at (timestamp), created_at, updated_at

Acceptance criteria (for future implementation):
- Can create/read transactions for the current user/workspace.
- Categories and budgets can be created/linked to transactions.
- CRUD can be via SQL/seed or minimal UI; full UI deferred.

Notes:
- Ownership is per workspace + user.
- No implementation started yet; this file documents scope and schema.
