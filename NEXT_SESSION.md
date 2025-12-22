# Next Session

## Where We Are
- Supabase auth with Google OAuth is live with PKCE and SSR cookies fully wired.
- Protected routes live under `app/(protected)/`; `/login`, `/auth/callback`, `/app`, and `/onboarding` are working end-to-end.
- Profiles are created on sign-in; workspace membership gates `/app`, redirects missing members to onboarding, and onboarding creates the membership.
- Tasks: 0001-auth-routing ✅, 0002-app-dashboard ✅, 0003-budget is next, 0004-date-night-foundation, 0005-dashboard-v1.

## What Was Last Tested
- `/login` → Google sign-in completes and returns to the app.
- `/auth/callback` finishes PKCE flow and sets SSR cookies.
- `/app` loads when membership exists.
- Missing membership redirects to `/onboarding`, and completing onboarding creates the workspace membership.

## What’s Next
- 0003-budget is the next task.

## How to Start Next Time
- Open the repo: `cd /Users/tylermorgan/Desktop/repos/life-app`.
- Start the dev server: `npm run dev`.
- In the browser, go to `http://localhost:3000/login` and sign in with Google.
- If redirected to onboarding, complete it to land in `/app`; otherwise go straight to `/app`.

## Constraints & Notes
- Do not change auth flows; they are complete.
- No middleware in place yet.
- Keep work workspace-scoped; assume membership is required for app access.
