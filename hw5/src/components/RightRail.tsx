import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type Trend = {
  category: string;
  title: string;
  tweetCount: string;
};

type Suggestion = {
  name: string;
  handle: string;
};

type RightRailProps = {
  trends: Trend[];
  suggestions: Suggestion[];
};

export function RightRail({ trends, suggestions }: RightRailProps) {
  return (
    <aside className="hidden w-[350px] shrink-0 flex-col gap-4 px-6 pt-2 xl:flex">
      <div className="sticky top-0 z-10 bg-black pb-4">
        <label className="relative block">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search"
            className="w-full rounded-full bg-[#16181c] py-3 pl-12 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </label>
      </div>

      <section className="space-y-4 rounded-3xl bg-[#16181c] p-5">
        <h2 className="text-xl font-bold text-white">Subscribe to Premium</h2>
        <p className="text-sm text-zinc-400">
          Subscribe to unlock new features and if eligible, receive a share of
          revenue.
        </p>
        <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
          Subscribe
        </button>
      </section>

      <section className="space-y-4 rounded-3xl bg-[#16181c] p-5">
        <h2 className="text-xl font-bold text-white">What&apos;s happening</h2>
        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.title} className="flex items-start justify-between gap-2 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500">{trend.category}</span>
                <span className="text-base font-semibold text-white">
                  {trend.title}
                </span>
                <span className="text-zinc-500">{trend.tweetCount}</span>
              </div>
              <button className="text-zinc-500 transition hover:text-brand-primary">
                ···
              </button>
            </div>
          ))}
          <button className="text-left text-sm text-brand-primary">Show more</button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-[#16181c] p-5">
        <h2 className="text-xl font-bold text-white">Who to follow</h2>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.handle} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-600" aria-hidden />
              <div className="flex-1 leading-tight">
                <div className="font-semibold text-white">{suggestion.name}</div>
                <div className="text-sm text-zinc-500">{suggestion.handle}</div>
              </div>
              <button className="rounded-full bg-white px-4 py-1 text-sm font-semibold text-black">
                Follow
              </button>
            </div>
          ))}
          <button className="text-left text-sm text-brand-primary">Show more</button>
        </div>
      </section>
    </aside>
  );
}

