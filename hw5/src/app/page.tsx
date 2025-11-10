import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import {
  BellIcon,
  BookmarkIcon,
  EllipsisHorizontalCircleIcon,
  HashtagIcon,
  HomeIcon,
  InboxStackIcon,
  LightBulbIcon,
  ListBulletIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { RightRail } from "@/components/RightRail";
import { Sidebar } from "@/components/Sidebar";
import { Timeline } from "@/components/Timeline";
import { buildMobileNav, buildNavItems } from "@/data/navigation";
import { authOptions } from "@/lib/auth/options";

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

const TRENDS = [
  {
    category: "Music · Trending",
    title: "Lily Allen",
    tweetCount: "1,525 posts",
  },
  {
    category: "Trending",
    title: "GRAMMY NOMINEE ROSÉ",
    tweetCount: "16.5K posts",
  },
  {
    category: "Sports · Trending",
    title: "Bregman",
    tweetCount: "1,726 posts",
  },
];

const SUGGESTIONS = [
  { name: "sad cardinals", handle: "@sadcardinals" },
  { name: "SIS Baseball", handle: "@sis_baseball" },
  { name: "St. Louis Cardinals", handle: "@Cardjinals" },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login");
  }
  
  // If authenticated but no handle, redirect to register
  if (!session.user?.handle) {
    redirect("/register");
  }
  
  const navItems = buildNavItems("home");
  const mobileNav = buildMobileNav("home");

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl justify-center text-white">
        <Sidebar navItems={navItems} />
        <main className="flex w-full max-w-3xl flex-1 flex-col">
          <Timeline />
        </main>
        <RightRail trends={TRENDS} suggestions={SUGGESTIONS} />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-[var(--border)] bg-black/95 py-3 text-xs text-zinc-400 backdrop-blur lg:hidden">
        {mobileNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              item.active ? "text-white" : ""
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
    </>
  );
}
