# TASKS — 0003 Budget Foundation

Status: Not started

Goal: Deliver an MVP, workspace-scoped shared budget experience with basic schema, RLS, and minimal UI/API to record and view transactions.

Schema (workspace-scoped; `created_by` tracks author):
- `budget_categories` — id (uuid, pk), workspace_id (uuid, fk workspaces), created_by (uuid, fk profiles), name (text), created_at (timestamptz default now()).
- `budget_transactions` — id (uuid, pk), workspace_id (uuid, fk workspaces), created_by (uuid, fk profiles), category_id (uuid, fk budget_categories), type (text: income|expense), description (text), amount (numeric), occurred_at (timestamptz), created_at (timestamptz default now()).
- `budget_category_budgets` (optional, monthly allocations) — id (uuid, pk), workspace_id (uuid, fk workspaces), created_by (uuid, fk profiles), category_id (uuid, fk budget_categories), period_month (date or first-of-month), amount (numeric), created_at (timestamptz default now()).

Scope notes:
- All data is shared per workspace; no per-user isolation beyond `created_by` audit.
- Follow existing workspaces/workspace_members/profiles patterns for RLS and ownership.

Acceptance criteria:
- [ ] `/budget` protected route exists under `(protected)` and requires membership.
- [ ] Last 20 transactions for the current workspace list on `/budget` with type, description, amount, occurred_at, category name.
- [ ] Month-to-date totals show income, expense, and net for the workspace.
- [ ] Adding a transaction (type, category, amount, occurred_at, description) works for the current workspace.
- [ ] RLS policies ensure only members of a workspace can read/write that workspace’s budget tables.

Non-goals:
- No styling overhaul beyond basic usability.
- No multi-currency support.
- No recurring or automated transactions yet.

Progress notes:
- Step 8 (Budget read-only page) done — added `app/(protected)/budget/page.tsx` for categories, transactions, and MTD totals.
