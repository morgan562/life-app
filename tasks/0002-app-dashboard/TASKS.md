# TASKS — 0002 App Dashboard

Ordered checklist for implementing spec 0002 (`/app` shows profile + workspace membership).

1. [x] Re-read `specs/0002-app-dashboard/README.md` and confirm the happy/redirect paths.
2. [x] Confirm existing auth flow in `app/login/page.tsx` and current `/app` scaffold in `app/(protected)/app/page.tsx`.
3. [x] Add or update server-side Supabase helper in `lib/supabase/server.ts` to create a client with cookies/headers for server components.
4. [x] In `app/(protected)/app/page.tsx`, fetch the current session/user on the server; redirect to `/login` if no session.
5. [x] Query `profiles` for the signed-in user; redirect to `/onboarding` if missing.
6. [x] Query `workspace_members` (for the default workspace) for the same user; redirect to `/onboarding` if missing.
7. [x] Render the profile + membership details on `/app` (keep styling minimal per non-goals).
8. [ ] Smoke-test manually: login flow, `/app` render, missing-row redirects to `/onboarding`; note results in this file. (Not run yet.)
