import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "../app/SignOutButton";

type Workspace = {
  id: string;
};

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("[/onboarding] user exists:", Boolean(user));

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
            <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
            <p className="mt-2 text-neutral-600">
              A default workspace is required before we can finish setup.
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-red-600">
            No workspace found. Please insert at least one row into
            `public.workspaces`, then refresh this page.
          </p>
        </div>
      </main>
    );
  }

  async function completeSetup() {
    "use server";
    const supabaseActionClient = await getSupabaseServerClient();

    const {
      data: { user: actionUser },
      error: actionUserError,
    } = await supabaseActionClient.auth.getUser();

    if (actionUserError || !actionUser) {
      redirect("/login");
    }

    const { data: actionWorkspace, error: actionWorkspaceError } = await supabaseActionClient
      .from("workspaces")
      .select("id")
      .limit(1)
      .single<Workspace>();

    if (actionWorkspaceError || !actionWorkspace) {
      redirect("/onboarding?e=workspace_missing");
    }

    const displayName = actionUser.user_metadata?.full_name ?? actionUser.email ?? "User";

    const { error: profileError } = await supabaseActionClient.from("profiles").upsert(
      {
        user_id: actionUser.id,
        display_name: displayName,
      },
      {
        onConflict: "user_id",
      }
    );

    if (profileError) {
      redirect("/onboarding?e=profile_failed");
    }

    console.log("[onboarding] creating workspace_members", {
      userId: actionUser.id,
      workspaceId: actionWorkspace.id,
    });
    const { error: memberError } = await supabaseActionClient.from("workspace_members").upsert(
      {
        workspace_id: actionWorkspace.id,
        user_id: actionUser.id,
        role: "member",
      },
      {
        onConflict: "workspace_id,user_id",
      }
    );

    if (memberError) {
      redirect("/onboarding?e=membership_failed");
    }

    redirect("/app");
  }

  return (
    <main className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
          <p className="mt-2 text-neutral-600">Complete setup to access your workspace.</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-neutral-700">
          Click the button below to finish setting up your profile and workspace membership.
        </p>
        <form action={completeSetup} className="mt-4">
          <button className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50">
            Complete setup
          </button>
        </form>
      </div>
    </main>
  );
}
