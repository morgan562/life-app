# Specs

This repo uses lightweight specs to capture intent before we build. Each spec lives in its own folder under `specs/` and pairs with a task list in `tasks/`.

- Specs outline the goal, requirements, non-goals, and acceptance criteria for a slice of work.
- Tasks translate a spec into an ordered checklist of files to touch and steps to complete.
- Implementation happens only after the spec and task list exist; code changes stay in the existing app structure (e.g. `app/login/page.tsx`, `app/(protected)/app/page.tsx`, `app/(protected)/onboarding/page.tsx`, `lib/supabase/client.ts`, `lib/supabase/server.ts`).

Flow:
1) Draft or update a spec in `specs/XXXX-scope/`.
2) Break it down into `tasks/XXXX-scope/TASKS.md` with concrete steps.
3) Implement the tasks in code, keeping notes in the task file as you go.

Add new specs by copying the existing format, incrementing the `XXXX` prefix, and keeping names short and descriptive.
