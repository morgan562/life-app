"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SessionResult = {
  session: any;
  error: any;
};

type UserResult = {
  user: any;
  error: any;
};

export default function AuthDebugPage() {
  const [locationHref, setLocationHref] = useState<string>("");
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [userResult, setUserResult] = useState<UserResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const href = window.location.href;
    setLocationHref(href);
    const url = new URL(href);
    const eParam = url.searchParams.get("e");
    if (eParam) setCallbackError(eParam);

    async function loadAuthState() {
      const sessionResponse = await supabase.auth.getSession();
      const userResponse = await supabase.auth.getUser();
      setSessionResult({ session: sessionResponse.data?.session, error: sessionResponse.error });
      setUserResult({ user: userResponse.data?.user, error: userResponse.error });
    }

    loadAuthState();
  }, []);

  async function handleSignIn() {
    setActionError(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log("[debug/auth] redirectTo", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    console.log("[debug/auth] signInWithOAuth", { data, error });
    if (error) {
      console.error("[debug/auth] signInWithOAuth error", error);
      setActionError(error.message);
    }
  }

  async function handleSignOut() {
    setActionError(null);
    const { error } = await supabase.auth.signOut();
    console.log("[debug/auth] signOut", { error });
    if (error) {
      console.error("[debug/auth] signOut error", error);
      setActionError(error.message);
    } else {
      setSessionResult(null);
      setUserResult(null);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Auth Debug (Client)</h1>
      <p className="mt-2 text-neutral-600">Use this page to inspect client auth state.</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Location</div>
          <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-sm">{locationHref}</pre>
        </div>

        {callbackError ? (
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Callback error (?e=)</div>
            <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-sm">{callbackError}</pre>
          </div>
        ) : null}

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">getSession()</div>
          <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-sm">
            {JSON.stringify(sessionResult, null, 2)}
          </pre>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">getUser()</div>
          <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-sm">
            {JSON.stringify(userResult, null, 2)}
          </pre>
        </div>

        {actionError ? <p className="text-sm text-red-600">Error: {actionError}</p> : null}

        <div className="flex gap-3">
          <button
            onClick={handleSignIn}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Sign in with Google
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
