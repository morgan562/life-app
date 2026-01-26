"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type NamedUser = {
  id: string;
  name: string;
};

type UserSwitcherProps = {
  currentUser: NamedUser;
  viewing: NamedUser;
  partner: NamedUser | null;
};

export function UserSwitcher({ currentUser, viewing, partner }: UserSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSwitch = (targetId: string) => {
    startTransition(() => {
      if (targetId === currentUser.id) {
        router.push("/wishlist");
        return;
      }
      router.push(`/wishlist/${targetId}`);
    });
  };

  const partnerTargetId = viewing.id === partner?.id ? currentUser.id : partner?.id;
  const partnerLabel =
    pending || !partner
      ? pending
        ? "Switching…"
        : "Partner"
      : viewing.id === partner.id
        ? currentUser.name
        : partner.name;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-3 py-1 text-xs text-neutral-800 backdrop-blur-md shadow-sm">
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Viewing:</span>
        <span className="font-semibold text-neutral-900">{viewing.name}</span>
      </div>

      {partner ? (
        <button
          type="button"
          className="glass-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => partnerTargetId && handleSwitch(partnerTargetId)}
          disabled={pending || !partnerTargetId}
        >
          {partnerLabel}
        </button>
      ) : null}
    </div>
  );
}
