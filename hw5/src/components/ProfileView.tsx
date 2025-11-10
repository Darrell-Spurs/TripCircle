"use client";

import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Fragment, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  useReplyToPost,
  useToggleLike,
  useToggleRepost,
} from "@/hooks/api/usePostActions";
import {
  useUserLikes,
  useUserPosts,
  useUserProfile,
  useUserReposts,
} from "@/hooks/api/useUserData";
import { api } from "@/lib/api/endpoints";
import type {
  PostResponse,
  RepostResponse,
  ThreadNodeResponse,
  UserProfileResponse,
} from "@/lib/api/types";

import { Tweet, TweetCard } from "@/components/TweetCard";

const OWNER_TABS = ["Posts", "Likes"] as const;
const VISITOR_TABS = ["Posts"] as const;

type ThreadNode = Tweet & { comments?: ThreadNode[] };

type ProfileViewProps = {
  handle: string;
  isOwner?: boolean;
};

function stringToColor(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function formatRelativeDate(date: Date) {
  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function mapPostToTweet(
  post: PostResponse,
  options: { context?: string; eventDate?: Date } = {},
): Tweet {
  const createdAt = new Date(post.createdAt);
  const eventDate = options.eventDate ?? createdAt;
  const authorHandle = post.author.handle ? `@${post.author.handle}` : "@unknown";
  const colorSeed = post.author.handle ?? post.author.id;
  return {
    id: post.id,
    author: {
      name: post.author.displayName,
      handle: authorHandle,
      avatarColor: stringToColor(colorSeed),
    },
    timestamp: eventDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    content: post.content,
    context: options.context ?? post.context,
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

function sortPostsByEvent(
  posts: PostResponse[],
  reposts: RepostResponse[],
  contextLabel: string,
) {
  const items: Array<{ tweet: Tweet; eventTime: number; key: string }> = [];

  posts.forEach((post) => {
    const tweet = mapPostToTweet(post);
    items.push({
      tweet,
      eventTime: new Date(post.createdAt).getTime(),
      key: `post-${post.id}-${post.updatedAt}`,
    });
  });

  reposts.forEach((entry) => {
    const eventDate = new Date(entry.repostedAt);
    const tweet = mapPostToTweet(entry.post, {
      context: contextLabel,
      eventDate,
    });
    items.push({
      tweet,
      eventTime: eventDate.getTime(),
      key: `repost-${entry.post.id}-${entry.repostedAt}`,
    });
  });

  return items.sort((a, b) => b.eventTime - a.eventTime);
}

export function ProfileView({ handle, isOwner = false }: ProfileViewProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.handle);
  const tabs = useMemo(
    () => (isOwner ? OWNER_TABS : VISITOR_TABS),
    [isOwner],
  );
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [replyTarget, setReplyTarget] = useState<Tweet | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [threadStack, setThreadStack] = useState<string[]>([]);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useUserProfile(handle);
  const postsQuery = useUserPosts(handle);
  const likesQuery = useUserLikes(isOwner ? handle : null);
  const repostsQuery = useUserReposts(handle);

  const toggleLike = useToggleLike();
  const toggleRepost = useToggleRepost();
  const replyMutation = useReplyToPost(replyTarget?.id ?? null);
  const queryClient = useQueryClient();
  const profileResult = profile as UserProfileResponse | undefined;

  const postsTabItems = useMemo(() => {
    if (!profileResult) return [] as Array<{ tweet: Tweet; eventTime: number; key: string }>;
    const contextLabel = isOwner
      ? "You reposted"
      : `${
          profileResult.displayName ||
          (profileResult.handle ? `@${profileResult.handle}` : "This user")
        } reposted`;
    return sortPostsByEvent(
      postsQuery.posts,
      repostsQuery.reposts,
      contextLabel,
    );
  }, [profileResult, isOwner, postsQuery.posts, repostsQuery.reposts]);

  const likesTweets = useMemo(
    () => likesQuery.posts.map((post) => mapPostToTweet(post)),
    [likesQuery.posts],
  );

  const displayedTweets =
    activeTab === "Posts"
      ? postsTabItems
      : likesTweets.map((tweet) => ({
          key: `like-${tweet.id}`,
          tweet,
          eventTime: tweet.createdAt ?? 0,
        }));

  const showLoadMore =
    activeTab === "Posts"
      ? postsQuery.hasNextPage || repostsQuery.hasNextPage
      : likesQuery.hasNextPage;

  const isFetchingMore =
    activeTab === "Posts"
      ? postsQuery.isFetchingNextPage || repostsQuery.isFetchingNextPage
      : likesQuery.isFetchingNextPage;

  const currentThreadId = threadStack[threadStack.length - 1] ?? null;
  const threadQuery = useQuery({
    queryKey: ["post", "thread", currentThreadId],
    queryFn: () => api.posts.getThread(currentThreadId!),
    enabled: Boolean(currentThreadId),
  });
  const threadRoot = threadQuery.data ? mapThreadResponse(threadQuery.data) : null;
  const isThreadView = threadStack.length > 0;

  const handleLoadMore = () => {
    if (activeTab === "Posts") {
      const tasks: Array<Promise<unknown>> = [];
      if (postsQuery.hasNextPage) tasks.push(postsQuery.fetchNextPage());
      if (repostsQuery.hasNextPage) tasks.push(repostsQuery.fetchNextPage());
      return Promise.all(tasks);
    }
    return likesQuery.fetchNextPage();
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

  const handleOpenThreadFromList = (tweet: Tweet) => {
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
        postsQuery.refetch();
        likesQuery.refetch();
        repostsQuery.refetch();
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

  if (profileLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center border-x border-[var(--border)] text-sm text-zinc-500">
        Loading profile…
      </div>
    );
  }

  if (profileError || !profileResult) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center border-x border-[var(--border)] text-sm text-red-400">
        Unable to load profile.
      </div>
    );
  }

  const profileData = profileResult as UserProfileResponse;

  return (
    <div className="flex w-full flex-col border-x border-[var(--border)]">
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[var(--border)] bg-black/70 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-black/50">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="h-5 w-5 text-white" />
        </Link>
        <div>
          <div className="text-lg font-bold text-white">{profileData.displayName}</div>
          <div className="text-xs text-zinc-500">{profileData.postCount} posts</div>
        </div>
      </header>

      <div>
        <div className="h-44 bg-zinc-800 md:h-56">
          {profileData.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileData.bannerUrl}
              alt={`${profileData.displayName} banner`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-sky-500/40 to-indigo-500/40" />
          )}
        </div>
        <div className="relative flex justify-between px-4 pb-4">
          <div className="-mt-16 flex items-end gap-3">
            <div className="relative h-32 w-32 rounded-full border-4 border-black">
              {profileData.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileData.avatarUrl}
                  alt={profileData.displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    backgroundColor: stringToColor(
                      profileData.handle ?? profileData.id,
                    ),
                  }}
                />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {isOwner ? (
              <button className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Edit profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-[var(--border)] p-2 text-white transition hover:bg-white/10">
                  <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
                </button>
                <button
                  className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  onClick={() => {
                    if (!isAuthenticated) {
                      signIn();
                    }
                  }}
                >
                  Follow
                </button>
              </div>
            )}
          </div>
        </div>

        <section className="px-4 pb-4 text-sm leading-6">
          <h1 className="text-xl font-bold text-white">
            {profileData.displayName ||
              (profileData.handle ? `@${profileData.handle}` : "New user")}
          </h1>
          <p className="text-zinc-500">
            {profileData.handle ? `@${profileData.handle}` : "Handle not set"}
          </p>
          {profileData.bio ? (
            <p className="mt-3 whitespace-pre-line text-white">{profileData.bio}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
            <span>Joined {formatRelativeDate(new Date(profileData.createdAt))}</span>
          </div>
          <div className="mt-3 flex gap-4 text-sm text-zinc-500">
            <span>
              <span className="font-semibold text-white">
                {profileData.followingCount}
              </span>{" "}
              Following
            </span>
            <span>
              <span className="font-semibold text-white">
                {profileData.followerCount}
              </span>{" "}
              Followers
            </span>
          </div>
        </section>
      </div>

      <nav className="sticky top-[59px] z-10 flex border-b border-[var(--border)] bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 px-4 py-3 text-sm font-semibold transition hover:bg-white/10",
              activeTab === tab ? "text-white" : "text-zinc-500",
            )}
          >
            <span className="relative inline-flex flex-col items-center">
              {tab}
              {activeTab === tab ? (
                <span className="absolute -bottom-3 h-1 w-full rounded-full bg-brand-primary" />
              ) : null}
            </span>
          </button>
        ))}
      </nav>

      {isThreadView ? (
        <>
          <div className="sticky top-[59px] z-10 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-black/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-black/60">
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
        <section>
          {(activeTab === "Posts" && (postsQuery.isLoading || repostsQuery.isLoading)) ||
          (activeTab === "Likes" && likesQuery.isLoading) ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-zinc-500">
              Loading posts…
            </div>
          ) : displayedTweets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-sm text-zinc-500">
              <span>
                {activeTab === "Posts" ? "No posts yet." : "No liked posts yet."}
              </span>
            </div>
          ) : (
            displayedTweets.map(({ key, tweet }) => (
              <TweetCard
                key={key}
                tweet={tweet}
                onComment={handleOpenReply}
                onLike={(tweet) =>
                  isAuthenticated
                    ? toggleLike.mutate({
                        postId: tweet.id,
                        liked: tweet.liked ?? false,
                      })
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
                onOpenThread={handleOpenThreadFromList}
              />
            ))
          )}

          {showLoadMore ? (
            <div className="flex justify-center border-t border-[var(--border)] px-4 py-4">
              <button
                onClick={handleLoadMore}
                disabled={isFetchingMore}
                className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {isFetchingMore ? "Loading…" : "Show more"}
              </button>
            </div>
          ) : null}
        </section>
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
    </div>
  );
}


