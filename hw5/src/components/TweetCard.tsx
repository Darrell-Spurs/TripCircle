"use client";

import {
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  BookmarkIcon,
  ChartBarIcon,
  ChatBubbleOvalLeftIcon,
  CheckBadgeIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { MouseEvent, useMemo, useState } from "react";

export type TweetStats = {
  replies: number;
  reposts: number;
  likes: number;
  views: number;
};

export type Tweet = {
  id: string;
  author: {
    name: string;
    handle: string;
    verified?: boolean;
    avatarColor: string;
  };
  timestamp: string;
  content: string;
  media?: {
    alt: string;
    src: string;
  };
  context?: string;
  stats: TweetStats;
  isOwn?: boolean;
  isFollowing?: boolean;
  liked?: boolean;
  reposted?: boolean;
  comments?: Tweet[];
  parentId?: string;
  createdAt?: number;
};

type TweetCardProps = {
  tweet: Tweet;
  onComment?: (tweet: Tweet) => void;
  onRepost?: (tweet: Tweet) => void;
  onLike?: (tweet: Tweet) => void;
  onDelete?: (tweet: Tweet) => void;
  onOpenThread?: (tweet: Tweet) => void;
  canDelete?: boolean;
  isFocused?: boolean;
  nested?: boolean;
};

function formatStat(count: number) {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${count}`;
}

export function TweetCard({
  tweet,
  onComment,
  onRepost,
  onLike,
  onDelete,
  onOpenThread,
  canDelete = false,
  isFocused = false,
  nested = false,
}: TweetCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasThreadInteraction = Boolean(onOpenThread);

  const handleRootClick = () => {
    if (!hasThreadInteraction) return;
    onOpenThread?.(tweet);
  };

  const handleButtonClick = (
    event: MouseEvent<HTMLButtonElement>,
    callback?: (tweet: Tweet) => void,
  ) => {
    event.stopPropagation();
    callback?.(tweet);
  };

  const menuItems = useMemo(() => {
    const items = [];
    if (canDelete && onDelete) {
      items.push({
        label: "Delete",
        action: onDelete,
        tone: "danger" as const,
        icon: TrashIcon,
      });
    }
    items.push({
      label: "Bookmark",
      action: () => undefined,
      tone: "default" as const,
      icon: BookmarkIcon,
    });
    return items;
  }, [canDelete, onDelete]);

  return (
    <article
      onClick={handleRootClick}
      className={clsx(
        "relative flex gap-3 border-b border-[var(--border)] px-4 py-4 text-sm transition hover:bg-white/5",
        nested && "pl-12",
        isFocused && "bg-white/5",
      )}
      role={hasThreadInteraction ? "button" : undefined}
      tabIndex={hasThreadInteraction ? 0 : undefined}
    >
      <div
        className={clsx(
          "relative h-12 w-12 shrink-0 rounded-full",
          nested && "before:absolute before:-left-6 before:top-0 before:h-full before:w-px before:bg-[var(--border)]",
        )}
        style={{ backgroundColor: tweet.author.avatarColor }}
        aria-hidden
      >
        {nested && (
          <ArrowUturnLeftIcon
            className="absolute -left-10 top-1 h-4 w-4 text-zinc-600"
        aria-hidden
      />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {tweet.context ? (
          <div className="text-xs font-medium text-sky-500">{tweet.context}</div>
        ) : null}
        <header className="flex items-start justify-between gap-3 leading-tight">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              onClick={(event) => event.stopPropagation()}
              href={`/profile/${tweet.author.handle.replace("@", "")}`}
              className="flex items-center gap-1 font-semibold text-white transition hover:underline"
            >
            {tweet.author.name}
            {tweet.author.verified ? (
              <CheckBadgeIcon className="h-4 w-4 text-sky-500" aria-hidden />
            ) : null}
            </Link>
            <span className="text-zinc-500">
              {tweet.author.handle} · {tweet.timestamp}
          </span>
          </div>
          <div className="relative">
            <button
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className="rounded-full p-1 text-zinc-500 transition hover:bg-white/10"
              aria-label="More"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
            </button>
            {isMenuOpen ? (
              <div className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-black text-sm shadow-xl">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={(event) =>
                      handleButtonClick(event, (tweetArg) => {
                        setIsMenuOpen(false);
                        item.action(tweetArg);
                      })
                    }
                    className={clsx(
                      "flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-white/10",
                      item.tone === "danger" ? "text-red-400" : "text-white",
                    )}
                  >
                    <item.icon
                      className={clsx("h-4 w-4", item.tone === "danger" && "text-red-400")}
                      aria-hidden
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </header>
        <div className="space-y-3">
          <p className="whitespace-pre-line text-[15px] leading-6 text-white">
            {tweet.content.split(/(https?:\/\/\S+)/g).map((chunk, index) => {
              if (/^https?:\/\/\S+$/i.test(chunk)) {
                return (
                  <a
                    key={`link-${tweet.id}-${index}`}
                    href={chunk}
                    className="text-sky-400 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {chunk}
                  </a>
                );
              }
              return <span key={`text-${tweet.id}-${index}`}>{chunk}</span>;
            })}
          </p>
        {tweet.media ? (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <Image
              src={tweet.media.src}
              alt={tweet.media.alt}
              width={600}
              height={400}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}
        </div>
        <footer className="flex items-center justify-between text-xs text-zinc-500">
          <button
            disabled={!onComment}
            onClick={(event) => handleButtonClick(event, onComment)}
            className={clsx(
              "flex items-center gap-2 rounded-full px-2 py-1 transition",
              onComment ? "hover:bg-sky-500/10 hover:text-sky-400" : "cursor-default",
            )}
          >
            <ChatBubbleOvalLeftIcon
              className={clsx(
                "h-4 w-4",
                onComment ? "text-sky-400" : "text-zinc-600",
              )}
              aria-hidden
            />
            {formatStat(tweet.stats.replies)}
          </button>
          <button
            disabled={!onRepost}
            onClick={(event) => handleButtonClick(event, onRepost)}
            className={clsx(
              "flex items-center gap-2 rounded-full px-2 py-1 transition",
              tweet.reposted
                ? "text-emerald-400"
                : onRepost
                  ? "hover:bg-emerald-500/10 hover:text-emerald-400"
                  : "cursor-default",
            )}
          >
            <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden />
            {formatStat(tweet.stats.reposts)}
          </button>
          <button
            disabled={!onLike}
            onClick={(event) => handleButtonClick(event, onLike)}
            className={clsx(
              "flex items-center gap-2 rounded-full px-2 py-1 transition",
              tweet.liked
                ? "text-rose-400"
                : onLike
                  ? "hover:bg-rose-500/10 hover:text-rose-400"
                  : "cursor-default",
            )}
          >
            <HeartIcon className="h-4 w-4" aria-hidden />
            {formatStat(tweet.stats.likes)}
          </button>
          <span className="flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4" aria-hidden />
            {formatStat(tweet.stats.views)}
          </span>
        </footer>
      </div>
    </article>
  );
}

