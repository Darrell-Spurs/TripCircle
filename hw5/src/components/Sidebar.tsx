"use client";

import {
  BellIcon,
  BookmarkIcon,
  EllipsisHorizontalCircleIcon,
  HashtagIcon,
  HomeIcon,
  InboxStackIcon,
  ListBulletIcon,
  LightBulbIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const ICON_MAP = {
  home: HomeIcon,
  explore: HashtagIcon,
  notifications: BellIcon,
  messages: InboxStackIcon,
  grok: LightBulbIcon,
  lists: ListBulletIcon,
  bookmarks: BookmarkIcon,
  communities: UsersIcon,
  premium: SparklesIcon,
  profile: UserCircleIcon,
  more: EllipsisHorizontalCircleIcon,
} as const;

type NavIconKey = keyof typeof ICON_MAP;

type NavItem = {
  label: string;
  href: string;
  active?: boolean;
  icon: NavIconKey;
};

type SidebarProps = {
  navItems: NavItem[];
};

function initialsFromName(name?: string | null) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function Sidebar({ navItems }: SidebarProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userDisplay = useMemo(() => {
    const name = session?.user?.name ?? session?.user?.handle ?? "";
    const handle = session?.user?.handle
      ? `@${session.user.handle}`
      : session?.user?.email ?? "";
    return { name, handle };
  }, [session]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isMenuOpen]);

  return (
    <aside className="relative hidden w-72 shrink-0 flex-col justify-between pb-6 pl-6 pt-4 lg:flex xl:w-80">
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold text-brand-primary transition hover:bg-white/10"
          aria-label="Home"
        >
          X
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 rounded-full px-4 py-3 text-lg font-semibold transition-colors hover:bg-white/10 ${
                item.active ? "text-white" : "text-zinc-400"
              }`}
            >
              {(() => {
                const Icon = ICON_MAP[item.icon];
                return <Icon className="h-6 w-6" aria-hidden />;
              })()}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            if (session) {
              router.push("/post");
            } else {
              signIn();
            }
          }}
          className="block w-full rounded-full bg-brand-primary py-3 text-center text-lg font-semibold text-white shadow-lg transition hover:bg-sky-500"
        >
          {session ? "Post" : "Sign in to post"}
        </button>
      </div>
      <div className="relative" ref={menuRef}>
        {status === "authenticated" && session?.user ? (
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2 transition hover:bg-white/10"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-sky-500 font-semibold">
              {initialsFromName(userDisplay.name) || "@"}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">
                {userDisplay.name || "Anonymous"}
              </div>
              <div className="text-sm text-zinc-500">{userDisplay.handle}</div>
            </div>
            <span className="ml-auto text-zinc-500">···</span>
          </button>
        ) : (
          <div className="rounded-2xl border border-white/10 p-4 text-sm text-zinc-400">
            <p className="mb-3 font-semibold text-white">New here?</p>
            <p className="mb-4">Sign in to follow creators, like posts, and share updates.</p>
            <button
              type="button"
              onClick={() => signIn()}
              className="w-full rounded-full bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200"
            >
              Sign in
            </button>
          </div>
        )}
        {isMenuOpen ? (
          <div className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl bg-[#16181c] p-2 shadow-lg ring-1 ring-black/40">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                signOut();
              }}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              Log out {userDisplay.handle}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

