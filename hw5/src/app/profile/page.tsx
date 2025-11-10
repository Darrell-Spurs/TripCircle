import Link from "next/link";
import { getServerSession } from "next-auth";

import { RightRail } from "@/components/RightRail";
import { Sidebar } from "@/components/Sidebar";
import { ProfileView } from "@/components/ProfileView";
import { buildMobileNav, buildNavItems } from "@/data/navigation";
import { authOptions } from "@/lib/auth/options";

const TRENDS = [
  {
    category: "Only on X · Trending",
    title: "#LingOrm1st_ImpactFANCON",
    tweetCount: "76.8K posts",
  },
  {
    category: "Trending in Taiwan",
    title: "#taipéi",
    tweetCount: "8,204 posts",
  },
  {
    category: "Sports · Trending",
    title: "Wizards",
    tweetCount: "5,268 posts",
  },
];

const SUGGESTIONS = [
  { name: "Pop Base", handle: "@PopBase" },
  { name: "SZA", handle: "@sza" },
  { name: "ice spice", handle: "@icespicee_" },
];

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const navItems = buildNavItems("profile");
  const mobileNav = buildMobileNav("profile");
  const handle = session?.user?.handle ?? null;

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl justify-center text-white">
        <Sidebar navItems={navItems} />
        <main className="flex w-full max-w-3xl flex-1 flex-col">
          {handle ? (
            <ProfileView handle={handle} isOwner />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
              Sign in and choose a handle to view your profile.
            </div>
          )}
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
            <span
              className={`h-6 w-6 rounded-full ${
                item.active ? "bg-white" : "bg-zinc-600/60"
              }`}
            />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}


