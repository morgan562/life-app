import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "./BottomNav";
import QuoteCard from "./QuoteCard";
import SignOutButton from "./SignOutButton";

type Profile = {
  display_name: string | null;
};

type WorkspaceMember = {
  workspace_id: string;
  role: string | null;
};

type Workspace = {
  id: string;
};

export default async function ProtectedAppPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("[/app] user id:", user?.id ?? null);

  if (userError || !user) {
    redirect("/login");
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .single<Workspace>();

  if (workspaceError || !workspace) {
    return (
      <main className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">App</h1>
            <p className="mt-2 text-neutral-600">
              Protected app home. Create at least one workspace row to proceed.
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-red-600">
            No default workspace found. Please insert at least one row into
            `public.workspaces`.
          </p>
        </div>
      </main>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .limit(1)
    .single<Profile>();

  if (profileError || !profile) {
    redirect("/onboarding");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .limit(1)
    .single<WorkspaceMember>();

  if (membershipError || !membership) {
    redirect("/onboarding");
  }

  return (
    <main className="relative min-h-screen app-bg">
      <div className="absolute right-6 top-6">
        <SignOutButton className="glass-button" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pb-32 pt-24">
        <div className="mb-10 text-center glass-surface px-6 py-5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Menu</div>
          <h1 className="mt-3 text-3xl font-semibold">
            Welcome back, {profile.display_name ?? "friend"}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Choose where to go next or pause for a moment of inspiration.
          </p>
        </div>

        <QuoteCard />
      </div>

      <BottomNav />
    </main>
  );
}
