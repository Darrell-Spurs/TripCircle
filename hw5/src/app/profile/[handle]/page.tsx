import Link from "next/link";
import { getServerSession } from "next-auth";

import { RightRail } from "@/components/RightRail";
import { Sidebar } from "@/components/Sidebar";
import { ProfileView } from "@/components/ProfileView";
import { buildMobileNav, buildNavItems } from "@/data/navigation";
import { authOptions } from "@/lib/auth/options";

const TRENDS = [
  { category: "Entertainment · Trending", title: "Denzel", tweetCount: "5,845 posts" },
  { category: "Politics · Trending", title: "Support the White One", tweetCount: "1,453 posts" },
  { category: "Business and finance · Trending", title: "Fed Day", tweetCount: "3,344 posts" },
];

const SUGGESTIONS = [
  { name: "Web Game Dev", handle: "@webgamedevs" },
  { name: "P. Martin Ortiz", handle: "@BeardScript" },
  { name: "Azdin Medel", handle: "@azdinmedel" },
];

export default async function OtherProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.handle === handle;

  const navItems = buildNavItems("profile").map((item) => ({
    ...item,
    active: item.href === `/profile/${handle}` ? true : item.active,
  }));
  const mobileNav = buildMobileNav("profile");

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl justify-center text-white">
        <Sidebar navItems={navItems} />
        <main className="flex w-full max-w-3xl flex-1 flex-col">
          <ProfileView handle={handle} isOwner={isOwner} />
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


