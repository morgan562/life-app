"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navItems";

function isActive(pathname: string | null, href?: string) {
  if (!pathname || !href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="grid grid-cols-5 gap-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const sharedClasses =
              "flex flex-col items-center justify-center rounded-2xl border px-3 py-2 text-sm transition";

            if (item.disabled) {
              return (
                <div
                  key={item.label + item.icon}
                  className={`${sharedClasses} border-dashed border-black/10 bg-white/50 text-neutral-400`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="mt-1 font-medium">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.08em]">
                    Coming soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href ?? "#"}
                className={`${sharedClasses} border-black/10 bg-white/70 text-neutral-800 hover:-translate-y-[1px] hover:shadow-sm ${
                  active ? "ring-2 ring-black/10" : ""
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="mt-1 font-semibold">{item.label}</span>
                <span
                  className={`h-1 w-1 rounded-full ${
                    active ? "bg-neutral-800" : "bg-transparent"
                  }`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
