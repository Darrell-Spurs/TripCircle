"use client";

import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api/endpoints";
import type { NotificationResponse, PaginatedResponse } from "@/lib/api/types";

import { queryKeys } from "./query-keys";

export function useNotifications() {
  const query = useInfiniteQuery<
    PaginatedResponse<NotificationResponse>,
    Error,
    InfiniteData<PaginatedResponse<NotificationResponse>>,
    readonly ["notifications"],
    string | undefined
  >({
    queryKey: queryKeys.notifications,
    queryFn: ({ pageParam }) =>
      api.notifications.list({ cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const notifications =
    query.data?.pages.flatMap((page: PaginatedResponse<NotificationResponse>) => page.items) ?? [];

  return {
    ...query,
    notifications,
    unreadCount: notifications.filter((item: NotificationResponse) => !item.readAt).length,
  };
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.notifications.markRead(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<NotificationResponse>> | undefined
      >(queryKeys.notifications, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              ids.includes(item.id)
                ? { ...item, readAt: new Date().toISOString() }
                : item,
            ),
          })),
        };
      });
    },
  });
}

