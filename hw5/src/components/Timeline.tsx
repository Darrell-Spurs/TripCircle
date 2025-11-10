"use client";

import {
  ArrowLeftIcon,
  FaceSmileIcon,
  GifIcon,
  MapPinIcon,
  PhotoIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { signIn, useSession } from "next-auth/react";
import { FormEvent, Fragment, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useTimeline } from "@/hooks/api/useTimeline";
import {
  useCreatePost,
  useReplyToPost,
  useToggleLike,
  useToggleRepost,
} from "@/hooks/api/usePostActions";
import { api } from "@/lib/api/endpoints";
import type { PostResponse, ThreadNodeResponse } from "@/lib/api/types";

import { Tweet, TweetCard } from "./TweetCard";

const FEED_TABS = [
  { key: "all", label: "For you" },
  { key: "following", label: "Following" },
] as const;

type FeedTab = (typeof FEED_TABS)[number]["key"];

type ThreadNode = Tweet & { comments?: ThreadNode[] };

function stringToColor(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function mapPostToTweet(post: PostResponse): Tweet {
  const createdAt = new Date(post.createdAt);
  const authorHandle = post.author.handle ? `@${post.author.handle}` : "@unknown";
  const colorSeed = post.author.handle ?? post.author.id;
  return {
    id: post.id,
    author: {
      name: post.author.displayName,
      handle: authorHandle,
      avatarColor: stringToColor(colorSeed),
    },
    timestamp: formatRelativeTime(createdAt),
    content: post.content,
    context: post.context,
    stats: {
      replies: post.stats.replyCount,
      reposts: post.stats.repostCount,
      likes: post.stats.likeCount,
      views: post.stats.viewCount,
    },
    liked: post.liked ?? false,
    reposted: post.reposted ?? false,
    createdAt: createdAt.getTime(),
  };
}

function mapThreadResponse(node: ThreadNodeResponse): ThreadNode {
  const tweet = mapPostToTweet(node.post);
  const replies = node.replies.map(mapThreadResponse);
  return { ...tweet, comments: replies };
}

export function Timeline() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [composerValue, setComposerValue] = useState("");
  const [replyTarget, setReplyTarget] = useState<Tweet | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [threadStack, setThreadStack] = useState<string[]>([]);

  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.handle);

  const {
    posts: apiPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useTimeline(activeTab, isAuthenticated);

  const createPost = useCreatePost();
  const toggleLike = useToggleLike();
  const toggleRepost = useToggleRepost();
  const replyMutation = useReplyToPost(replyTarget?.id ?? null);
  const queryClient = useQueryClient();

  const posts = useMemo(() => apiPosts.map(mapPostToTweet), [apiPosts]);
  const remainingCharacters = 280 - composerValue.length;
  const isOverLimit = remainingCharacters < 0;

  const currentThreadId = threadStack[threadStack.length - 1] ?? null;
  const threadQuery = useQuery({
    queryKey: ["post", "thread", currentThreadId],
    queryFn: () => api.posts.getThread(currentThreadId!),
    enabled: Boolean(currentThreadId),
  });
  const threadRoot = threadQuery.data ? mapThreadResponse(threadQuery.data) : null;
  const isThreadView = threadStack.length > 0;

  if (status === "loading") {
    return (
      <section className="flex-1 border-x border-[var(--border)]">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-zinc-500">
          <span className="h-3 w-3 animate-ping rounded-full bg-brand-primary" />
          <span>Preparing your feed…</span>
        </div>
      </section>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      signIn();
      return;
    }
    const trimmed = composerValue.trim();
    if (!trimmed.length || isOverLimit) return;
    createPost.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          setComposerValue("");
          refetch();
        },
      },
    );
  };

  const openThread = (postId: string, replace: boolean) => {
    setReplyTarget(null);
    setReplyValue("");
    setThreadStack((prev) => {
      if (!replace && prev[prev.length - 1] === postId) {
        return prev;
      }
      return replace ? [postId] : [...prev, postId];
    });
  };

  const handleOpenThreadFromFeed = (tweet: Tweet) => {
    openThread(tweet.id, true);
  };

  const handleOpenThreadFromThread = (tweet: Tweet) => {
    openThread(tweet.id, false);
  };

  const handleBackFromThread = () => {
    setThreadStack((prev) => {
      const next = prev.slice(0, -1);
      if (next.length === 0) {
        queryClient.removeQueries({ queryKey: ["post", "thread"] });
      }
      return next;
    });
  };

  const handleOpenReply = (tweet: Tweet) => {
    if (!isAuthenticated) {
      signIn();
      return;
    }
    setReplyTarget(tweet);
    setReplyValue("");
  };

  const handleSubmitReply = () => {
    if (!isAuthenticated) {
      signIn();
      return;
    }
    const trimmed = replyValue.trim();
    if (!replyTarget || !trimmed.length) return;
    replyMutation.mutate(trimmed, {
      onSuccess: () => {
        setReplyTarget(null);
        setReplyValue("");
        if (isThreadView && currentThreadId) {
          threadQuery.refetch();
        }
        refetch();
      },
    });
  };

  const renderThreadNode = (node: ThreadNode, depth = 0) => (
    <Fragment key={`thread-${node.id}-${depth}`}>
      <TweetCard
        tweet={node}
        nested={depth > 0}
        onComment={handleOpenReply}
        onLike={(selected) =>
          toggleLike.mutate(
            { postId: selected.id, liked: selected.liked ?? false },
            {
              onSuccess: () => {
                if (currentThreadId) {
                  threadQuery.refetch();
                }
              },
            },
          )
        }
        onRepost={(selected) =>
          toggleRepost.mutate(
            { postId: selected.id, reposted: selected.reposted ?? false },
            {
              onSuccess: () => {
                if (currentThreadId) {
                  threadQuery.refetch();
                }
              },
            },
          )
        }
        onOpenThread={handleOpenThreadFromThread}
      />
      {node.comments?.map((child) => renderThreadNode(child, depth + 1))}
    </Fragment>
  );

  return (
    <section className="flex-1 border-x border-[var(--border)]">
      {isThreadView ? (
        <>
          <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-black/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <button
              onClick={handleBackFromThread}
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </button>
            <span className="text-lg font-semibold text-white">Post</span>
          </div>
          {threadQuery.isLoading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-zinc-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-brand-primary" />
              <span>Loading thread…</span>
            </div>
          ) : threadQuery.isError || !threadRoot ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-red-400">
              Unable to load thread.
            </div>
          ) : (
            <div className="flex flex-col">{renderThreadNode(threadRoot)}</div>
          )}
        </>
      ) : (
        <>
          <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex gap-8 text-sm font-semibold">
                {FEED_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      "relative pb-3 pt-1 transition",
                      activeTab === tab.key ? "text-white" : "text-zinc-500",
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.key ? (
                      <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-brand-primary" />
                    ) : null}
                  </button>
                ))}
              </div>
              <button className="rounded-full p-2 text-brand-primary transition hover:bg-white/10">
                <SparklesIcon className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-b border-[var(--border)] px-4 py-4">
            <div className="flex gap-3">
              <div
                className="h-12 w-12 shrink-0 rounded-full"
                style={{
                  backgroundColor: stringToColor(session?.user?.handle ?? session?.user?.email ?? "guest"),
                }}
                aria-hidden
              />
              <div className="flex-1">
                <textarea
                  placeholder={
                    isAuthenticated ? "What is happening?!" : "Sign in to share what’s happening"
                  }
                  value={composerValue}
                  onChange={(event) => setComposerValue(event.target.value)}
                  disabled={!isAuthenticated}
                  className="h-20 w-full resize-none bg-transparent text-lg text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm text-brand-primary">
                  <div className="flex items-center gap-3">
                    {[PhotoIcon, GifIcon, FaceSmileIcon, MapPinIcon].map((Icon, index) => (
                      <Icon key={index} className="h-5 w-5" aria-hidden />
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={clsx(
                        "text-xs",
                        isOverLimit ? "text-red-400" : "text-zinc-500",
                      )}
                    >
                      {remainingCharacters}
                    </span>
                    <button
                      type="submit"
                      disabled={!composerValue.trim().length || isOverLimit || createPost.isPending || !isAuthenticated}
                      className="rounded-full bg-brand-primary px-4 py-1.5 font-semibold text-white disabled:opacity-50"
                    >
                      {!isAuthenticated
                        ? "Sign in"
                        : createPost.isPending
                          ? "Posting…"
                          : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {!isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-zinc-500">
              <span>Sign in to see your personalized feed.</span>
              <button
                onClick={() => signIn()}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-zinc-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-brand-primary" />
              <span>Loading timeline…</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-red-400">
              <span>Unable to load timeline.</span>
              <button
                onClick={() => refetch()}
                className="rounded-full border border-red-400 px-3 py-1 text-xs font-semibold transition hover:bg-red-400/10"
              >
                Retry
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-zinc-500">
              <span>No posts yet.</span>
              <span>Start a conversation by sharing your first post.</span>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <TweetCard
                  key={post.id}
                  tweet={post}
                  onComment={handleOpenReply}
                  onLike={(tweet) =>
                    isAuthenticated
                      ? toggleLike.mutate({ postId: tweet.id, liked: tweet.liked ?? false })
                      : signIn()
                  }
                  onRepost={(tweet) =>
                    isAuthenticated
                      ? toggleRepost.mutate({
                          postId: tweet.id,
                          reposted: tweet.reposted ?? false,
                        })
                      : signIn()
                  }
                  onOpenThread={handleOpenThreadFromFeed}
                />
              ))}
              {hasNextPage ? (
                <div className="flex justify-center border-t border-[var(--border)] px-4 py-4">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading…" : "Show more"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {replyTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-black shadow-2xl">
            <div className="border-b border-[var(--border)] px-6 py-4 text-lg font-semibold text-white">
              Reply to {replyTarget.author.name}
            </div>
            <div className="space-y-4 px-6 py-5">
              <TweetCard tweet={replyTarget} isFocused onComment={undefined} />
              <textarea
                value={replyValue}
                onChange={(event) => setReplyValue(event.target.value)}
                placeholder="Post your reply"
                className="h-28 w-full resize-none rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setReplyTarget(null);
                    setReplyValue("");
                  }}
                  className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyValue.trim().length || replyMutation.isPending}
                  className="rounded-full bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {replyMutation.isPending ? "Replying…" : "Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

