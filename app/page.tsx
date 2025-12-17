"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RootRedirectPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking session…");

  useEffect(() => {
    let alive = true;

    async function checkSession() {
      try {
        setStatus("Checking session…");
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error) {
          console.error("Session check failed", error);
          setStatus("Error checking session");
          return;
        }

        const session = data.session;
        router.replace(session ? "/app" : "/login");
      } catch (err) {
        console.error("Unexpected session error", err);
        if (!alive) return;
        setStatus("Error checking session");
      }
    }

    checkSession();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
        {status}
      </div>
    </main>
  );
}
