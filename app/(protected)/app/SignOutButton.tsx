"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
};

export default function SignOutButton({ className }: SignOutButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setPending(true);
    setError(null);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setPending(false);
      return;
    }

    window.location.href = "/login";
  }

  return (
    <div className={className}>
      <button
        onClick={handleSignOut}
        disabled={pending}
        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
