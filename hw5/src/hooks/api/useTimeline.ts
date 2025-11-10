"use client";

import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";
import type { PaginatedResponse, PostResponse } from "@/lib/api/types";

import { queryKeys } from "./query-keys";

type TimelineVariant = "all" | "following";

const fetchers: Record<
  TimelineVariant,
  (params?: { cursor?: string | null }) => Promise<PaginatedResponse<PostResponse>>
> = {
  all: (params) =>
    api.timeline.getAll({
      cursor: params?.cursor ?? undefined,
    }),
  following: (params) =>
    api.timeline.getFollowing({
      cursor: params?.cursor ?? undefined,
    }),
};

export function useTimeline(variant: TimelineVariant = "all", enabled = true) {
  const query = useInfiniteQuery<
    PaginatedResponse<PostResponse>,
    Error,
    InfiniteData<PaginatedResponse<PostResponse>>,
    readonly ["timeline", TimelineVariant],
    string | undefined
  >({
    queryKey: queryKeys.timeline(variant),
    queryFn: ({ pageParam }) => fetchers[variant]({ cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled,
  });

  const posts = query.data?.pages.flatMap((page: PaginatedResponse<PostResponse>) => page.items) ?? [];

  return {
    ...query,
    posts,
  };
}

