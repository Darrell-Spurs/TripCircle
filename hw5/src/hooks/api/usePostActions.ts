"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";
import type { PostResponse } from "@/lib/api/types";

import { queryKeys } from "./query-keys";

type CreatePostInput = {
  content: string;
  inReplyToId?: string;
};

function invalidatePostFeeds(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.timeline("all") });
  queryClient.invalidateQueries({ queryKey: queryKeys.timeline("following") });
  // Invalidate all user specific feeds
  queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "user" });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => api.posts.create(input),
    onSuccess: () => {
      invalidatePostFeeds(queryClient);
    },
  });
}

export function useReplyToPost(postId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!postId) {
        return Promise.reject(new Error("postId is required"));
      }
      return api.posts.reply(postId, content);
    },
    onSuccess: () => {
      invalidatePostFeeds(queryClient);
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { postId: string; liked: boolean }) => {
      if (input.liked) {
        await api.posts.unlike(input.postId);
      } else {
        await api.posts.like(input.postId);
      }
    },
    onSuccess: () => {
      invalidatePostFeeds(queryClient);
    },
  });
}

export function useToggleRepost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { postId: string; reposted: boolean }) => {
      if (input.reposted) {
        await api.posts.unrepost(input.postId);
      } else {
        await api.posts.repost(input.postId);
      }
    },
    onSuccess: () => {
      invalidatePostFeeds(queryClient);
    },
  });
}

