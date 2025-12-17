# 0002 — App Dashboard

**Goal**
- Show the signed-in user's profile and workspace membership on `/app`.

**Requirements**
- Fetch the current session/user for requests hitting `/app`.
- Load the user's profile record (e.g., display name) from `profiles`.
- Load the user's membership row from `workspace_members` for the default workspace.
- If either profile or membership is missing, redirect the user to `/onboarding` to finish setup.

**Non-goals**
- No styling overhaul or design system changes.
- No new database tables or auth providers.

**Acceptance criteria**
- [ ] `/app` retrieves the authenticated user/session before rendering.
- [ ] Profile data is fetched and displayed for the signed-in user.
- [ ] Workspace membership is fetched and displayed for the signed-in user.
- [ ] Missing profile or membership triggers a redirect to `/onboarding`.
- [ ] Happy path renders without client-side errors in the browser console.
