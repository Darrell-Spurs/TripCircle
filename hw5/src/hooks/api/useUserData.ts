"use client";

import {
  InfiniteData,
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
    queryKey: handle ? queryKeys.userProfile(handle) : ["user", "profile", ""],
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
  queryKeyFactory: (handle: string) => readonly unknown[],
) {
  const query = useInfiniteQuery<
    PaginatedResponse<PostResponse>,
    Error,
    InfiniteData<PaginatedResponse<PostResponse>>,
    readonly unknown[],
    string | undefined
  >({
    queryKey: handle ? queryKeyFactory(handle) : ["user", "posts", ""],
    enabled: Boolean(handle),
    queryFn: ({ pageParam }) => {
      if (!handle) throw new Error("handle required");
      return fetcher(handle, pageParam as string | undefined);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const posts = query.data?.pages.flatMap((page: PaginatedResponse<PostResponse>) => page.items) ?? [];

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
  const query = useInfiniteQuery<
    PaginatedResponse<RepostResponse>,
    Error,
    InfiniteData<PaginatedResponse<RepostResponse>>,
    readonly unknown[],
    string | undefined
  >({
    queryKey: handle ? queryKeys.userReposts(handle) : ["user", "reposts", ""],
    enabled: Boolean(handle),
    queryFn: ({ pageParam }) => {
      if (!handle) throw new Error("handle required");
      return api.users.getReposts(handle, { cursor: pageParam as string | undefined });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const reposts =
    query.data?.pages.flatMap((page: PaginatedResponse<RepostResponse>) => page.items) ?? [];

  return {
    ...query,
    reposts,
  };
}

