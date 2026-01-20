"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ProfileOption = {
  id: string;
  display_name: string | null;
};

type UserSwitcherProps = {
  profiles: ProfileOption[];
  currentUserId: string;
  viewingUserId: string;
};

export function UserSwitcher({ profiles, currentUserId, viewingUserId }: UserSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-neutral-800 shadow-sm">
      <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Viewing</span>
      <select
        className="min-w-[180px] rounded-full border border-black/10 bg-white/70 px-3 py-1 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-60"
        value={viewingUserId}
        disabled={pending}
        onChange={(event) => {
          const targetId = event.target.value;
          startTransition(() => {
            if (targetId === currentUserId) {
              router.push("/wishlist");
              return;
            }
            router.push(`/wishlist/${targetId}`);
          });
        }}
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.display_name || "Unnamed user"}
            {profile.id === currentUserId ? " (you)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
