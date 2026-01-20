export type NavItem = {
  label: string;
  icon: string;
  href?: string;
  disabled?: boolean;
  note?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Budget",
    icon: "💰",
    href: "/budget",
  },
  {
    label: "Calendar",
    icon: "📅",
    href: "/budget/calendar",
  },
  {
    label: "Coming soon",
    icon: "🌿",
    disabled: true,
  },
  {
    label: "Coming soon",
    icon: "🧭",
    disabled: true,
  },
  {
    label: "Coming soon",
    icon: "✨",
    disabled: true,
  },
];
