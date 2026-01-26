import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WishlistClient } from "./WishlistClient";
import type { WishlistItem } from "./actions";

type Profile = {
  user_id: string;
  display_name: string | null;
  created_at?: string;
};

function deriveName(profile: Profile | null, email: string | null): string {
  const profileName = profile?.display_name;
  if (profileName?.trim()) return profileName.trim();

  const normalizedEmail = email?.toLowerCase() ?? "";
  if (normalizedEmail.includes("tyler")) return "Tyler";
  if (normalizedEmail.includes("tessa")) return "Tessa";

  return "Tyler"; // safe default
}

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
    .select("user_id, display_name, created_at")
    .order("created_at", { ascending: true });

  const safeProfiles: Profile[] = profiles ?? [];

  const currentProfile = safeProfiles.find((profile) => String(profile.user_id) === String(user.id)) ?? null;
  const currentName = deriveName(currentProfile, user.email ?? null);

  const partnerProfile =
    safeProfiles.find((profile) => String(profile.user_id) !== String(user.id)) ?? null;
  const partnerName = partnerProfile
    ? deriveName(partnerProfile, null)
    : currentName === "Tyler"
      ? "Tessa"
      : "Tyler";
  const partnerUserId = partnerProfile?.user_id ?? null;

  const idsToFetch = Array.from(new Set([user.id, partnerUserId].filter(Boolean))) as string[];

  const { data: items } = await supabase
    .from("wishlist_items")
    .select("id, title, url, sort_order, owner_id")
    .in("owner_id", idsToFetch)
    .order("sort_order", { ascending: true });

  const safeItems: (WishlistItem & { owner_id: string })[] = (items ?? []) as (WishlistItem & {
    owner_id: string;
  })[];

  const itemsByUser = idsToFetch.reduce<Record<string, (WishlistItem & { owner_id: string })[]>>((acc, id) => {
    acc[id] = safeItems.filter((item) => item.owner_id === id);
    return acc;
  }, {});

  return (
    <main className="min-h-screen app-bg px-4 py-10 md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <WishlistClient
          itemsByUser={itemsByUser}
          currentUserId={user.id}
          partnerUserId={partnerUserId}
          currentName={currentName}
          partnerName={partnerUserId ? partnerName : null}
          initialViewingUserId={user.id}
          profiles={safeProfiles}
        />
      </div>
    </main>
  );
}
