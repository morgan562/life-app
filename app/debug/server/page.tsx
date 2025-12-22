import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function ServerDebugPage() {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((c) => c.name);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Auth Debug (Server)</h1>
      <p className="mt-2 text-neutral-600">Server-side view of Supabase auth and cookies.</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Cookies seen by server</div>
          <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-sm">{JSON.stringify(cookieNames, null, 2)}</pre>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">supabase.auth.getUser()</div>
          <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-sm">
            {JSON.stringify({ user, error }, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}
