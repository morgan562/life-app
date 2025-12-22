# FEATURES (Global)

## FOUNDATION / PLATFORM

- Authentication & Session Management — ✅ Complete — Google OAuth + Supabase SSR callback, session redirects enforced.
- User Profiles — ✅ Complete — profile row exists per user_id; displayed on `/app`.
- Workspaces — ✅ Complete — default workspace required; membership gating in place.
- Onboarding Flow — ✅ Complete — `/onboarding` completes profile + membership on button click and returns to `/app`.
- Protected App Shell (/app) — ✅ Complete — redirects to `/login` when unauthenticated.
- Dashboard Data Loading (v0) — ✅ Complete — `/app` loads profile + workspace membership and redirects to onboarding if missing.

## CORE PRODUCT FEATURES

- Budgeting — ❌ Not Started — budgeting schema + CRUD not yet built.
- Date Night Planning — ❌ Not Started — planning schema + UI not yet built.
- Shared Life Planning — ❌ Not Started — collaborative planning not yet started.
- Dashboard v1 — ❌ Not Started — replace v0 auth/membership display with real dashboard cards.

## FUTURE / OPTIONAL

- Middleware — ⏳ Deferred — add edge middleware for auth enforcement later.
