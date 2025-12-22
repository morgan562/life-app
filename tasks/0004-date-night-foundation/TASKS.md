# TASKS — 0004 Date Night Foundation

Status: Not started

Goal: Define schema and minimal foundation for date night planning (to be implemented later).

Schema proposal:
- `date_ideas` — id (uuid), workspace_id (uuid), user_id (uuid), title (text), notes (text), created_at, updated_at
- `date_events` — id (uuid), workspace_id (uuid), user_id (uuid), idea_id (uuid, fk date_ideas, nullable), title (text), scheduled_for (timestamp), location (text), notes (text), created_at, updated_at

Acceptance criteria (future implementation):
- Can create/read date ideas and scheduled date events for the current user/workspace.
- Events can optionally link to an idea.
- CRUD can be via SQL/seed or minimal UI; full UX deferred.

Notes:
- Ownership is per workspace + user.
- No implementation started yet; this file documents scope and schema.
