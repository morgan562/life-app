# TASKS — 0005 Dashboard v1

Status: Not started

Goal: Replace the v0 auth/membership display with real dashboard summary cards.

Dependencies:
- 0003 Budget Foundation — budget data for summary.
- 0004 Date Night Foundation — upcoming date event for summary.

Scope / checklist (to do later):
- Pull budget summary data (e.g., total spent vs. budget) for the current workspace.
- Pull the next upcoming date event (title + scheduled_for).
- Render summary cards on `/app` (server-side) while keeping auth/membership redirects intact.
- Keep styling minimal but informative; no design overhaul.

Acceptance criteria (future):
- `/app` shows budget summary card and next date event card when data exists.
- `/app` still redirects to `/onboarding` when membership/profile missing.
- No client-side errors; server rendering handles data fetching.
