import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WishlistClient } from "./WishlistClient";
import { UserSwitcher } from "./UserSwitcher";
import type { WishlistItem } from "./actions";

type Profile = {
  id: string;
  display_name: string | null;
};

export default async function WishlistPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  const { data: items } = await supabase
    .from("wishlist_items")
    .select("id, title, url, sort_order")
    .eq("owner_id", user.id)
    .order("sort_order", { ascending: true });

  const safeProfiles: Profile[] = profiles ?? [];
  const safeItems: WishlistItem[] = items ?? [];

  return (
    <main className="min-h-screen bg-[#F6F3EE] px-6 py-10 text-neutral-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Wishlist</p>
            <h1 className="mt-2 text-3xl font-semibold">Your wishlist</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Drag to set priority, add links, and keep track of what matters most.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-900"
            >
              Menu
            </Link>
            <UserSwitcher profiles={safeProfiles} currentUserId={user.id} viewingUserId={user.id} />
          </div>
        </div>

        <WishlistClient items={safeItems} isOwner />
      </div>
    </main>
  );
}
