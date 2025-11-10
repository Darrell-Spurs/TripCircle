"use client";

import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";
import type {
  PaginatedResponse,
  PostResponse,
  RepostResponse,
  UserProfileResponse,
} from "@/lib/api/types";

import { queryKeys } from "./query-keys";

export function useUserProfile(handle: string | null) {
  return useQuery<UserProfileResponse>({
    queryKey: handle ? queryKeys.userProfile(handle) : undefined,
    queryFn: () => {
      if (!handle) throw new Error("handle required");
      return api.users.getProfile(handle);
    },
    enabled: Boolean(handle),
  });
}

function useUserPostFeed(
  handle: string | null,
  fetcher: (
    handle: string,
    cursor?: string | null,
  ) => Promise<PaginatedResponse<PostResponse>>,
  queryKeyFactory: (handle: string) => unknown[],
) {
  const query = useInfiniteQuery({
    queryKey: handle ? queryKeyFactory(handle) : undefined,
    enabled: Boolean(handle),
    queryFn: ({ pageParam }) => {
      if (!handle) throw new Error("handle required");
      return fetcher(handle, pageParam ?? undefined);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    posts,
  };
}

export function useUserPosts(handle: string | null) {
  return useUserPostFeed(
    handle,
    (userHandle, cursor) =>
      api.users.getPosts(userHandle, { cursor: cursor ?? undefined }),
    queryKeys.userPosts,
  );
}

export function useUserLikes(handle: string | null) {
  return useUserPostFeed(
    handle,
    (userHandle, cursor) =>
      api.users.getLikes(userHandle, { cursor: cursor ?? undefined }),
    queryKeys.userLikes,
  );
}

export function useUserReposts(handle: string | null) {
  const query = useInfiniteQuery({
    queryKey: handle ? queryKeys.userReposts(handle) : undefined,
    enabled: Boolean(handle),
    queryFn: ({ pageParam }) => {
      if (!handle) throw new Error("handle required");
      return api.users.getReposts(handle, { cursor: pageParam ?? undefined });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const reposts =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    reposts,
  };
}

