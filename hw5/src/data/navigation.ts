export type NavKey =
  | "home"
  | "explore"
  | "notifications"
  | "messages"
  | "grok"
  | "lists"
  | "bookmarks"
  | "communities"
  | "premium"
  | "profile"
  | "more"
  | "post";

type NavDefinition = {
  key: NavKey;
  label: string;
  href: string;
};

const NAV_DEFINITIONS: NavDefinition[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "explore", label: "Explore", href: "#" },
  { key: "notifications", label: "Notifications", href: "#" },
  { key: "messages", label: "Messages", href: "#" },
  { key: "grok", label: "Grok", href: "#" },
  { key: "lists", label: "Lists", href: "#" },
  { key: "bookmarks", label: "Bookmarks", href: "#" },
  { key: "communities", label: "Communities", href: "#" },
  { key: "premium", label: "Premium", href: "#" },
  { key: "profile", label: "Profile", href: "/profile" },
  { key: "more", label: "More", href: "#" },
];

export function buildNavItems(activeKey: NavKey) {
  return NAV_DEFINITIONS.map((item) => ({
    label: item.label,
    href: item.href,
    active: item.key === activeKey,
    icon: item.key,
  }));
}

export function buildMobileNav(activeKey: NavKey) {
  const base = buildNavItems(activeKey);
  return base.slice(0, 4);
}


