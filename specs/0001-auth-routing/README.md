# 0001 — Auth Routing

Summary of what's already in place:
- Supabase environment is wired (client setup via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Google OAuth sign-in flow on `/login` using Supabase auth.
- Protected `/app` area scaffolded under `app/(protected)/app/page.tsx`.
- Redirect behavior established to send unauthenticated users to `/login` and keep signed-in users within the protected section.
