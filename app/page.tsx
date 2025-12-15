"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Booting…");

  async function ensureUserSetup(user: { id: string; email?: string | null; user_metadata?: any }) {
    setStatus("Ensuring user setup…");

    // 1) Get the default workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1)
      .single();

    if (workspaceError) {
      console.error("Workspace fetch failed:", workspaceError);
      setStatus("Workspace fetch failed (check console)");
      return;
    }

    // 2) Create/update profile row
    const { error: profileError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? "User",
    });

    if (profileError) {
      console.error("Profile upsert failed:", profileError);
      setStatus("Profile upsert failed (check console)");
      return;
    }

    // 3) Add membership row (safe to run multiple times)
    const { error: memberError } = await supabase.from("workspace_members").upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        role: "member",
      },
      { onConflict: "workspace_id,user_id" }
    );

    if (memberError) {
      console.error("Member upsert failed:", memberError);
      setStatus("Member upsert failed (check console)");
      return;
    }

    setStatus("User setup complete ✅");
  }

  useEffect(() => {
    console.log("✅ HomePage mounted");
    setStatus("Mounted ✅ (starting session check)");

    let alive = true;

    async function init() {
      try {
        setStatus("Calling supabase.auth.getSession()…");

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const user = data.session?.user ?? null;

        if (!alive) return;

        setEmail(user?.email ?? null);

        if (user) {
          await ensureUserSetup(user);
        } else {
          setStatus("No session (not signed in)");
        }
      } catch (err) {
        console.error("❌ init error:", err);
        if (!alive) return;
        setStatus(`Init error: ${(err as Error).message}`);
      }
    }

    init();

    return () => {
      alive = false;
    };
  }, []);

  async function signInWithGoogle() {
    setStatus("Redirecting to Google…");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error(error);
      setStatus(`Google sign-in error: ${error.message}`);
      alert(error.message);
    }
  }

  async function signOut() {
    setStatus("Signing out…");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      setStatus(`Sign out error: ${error.message}`);
      alert(error.message);
      return;
    }
    setEmail(null);
    setStatus("Signed out ✅");
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">The Life App</h1>

        <div className="mt-4 text-sm">
          <div className="text-neutral-500">Status</div>
          <div className="mt-1 font-medium">{status}</div>
        </div>

        <div className="mt-4 text-sm">
          <div className="text-neutral-500">Email</div>
          <div className="mt-1 font-medium">{email ?? "(none)"}</div>
        </div>

        <div className="mt-6">
          {email ? (
            <button
              onClick={signOut}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
