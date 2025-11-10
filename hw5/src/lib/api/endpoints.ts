import { apiClient, PaginationQuery } from "./client";
import type {
  DraftResponse,
  NotificationResponse,
  PaginatedResponse,
  PostResponse,
  RepostResponse,
  UserProfileResponse,
  ThreadNodeResponse,
} from "./types";

export const api = {
  users: {
    getProfile: (handle: string) =>
      apiClient.get<UserProfileResponse>(`/users/${handle}`),
    updateProfile: (
      handle: string,
      data: {
        displayName?: string;
        bio?: string;
        location?: string;
        website?: string;
        avatarUrl?: string;
        bannerUrl?: string;
      },
    ) => apiClient.patch<UserProfileResponse>(`/users/${handle}`, data),
    getPosts: (handle: string, params?: PaginationQuery) =>
      apiClient.get<PaginatedResponse<PostResponse>>(
        `/users/${handle}/posts`,
        { query: params },
      ),
    getLikes: (handle: string, params?: PaginationQuery) =>
      apiClient.get<PaginatedResponse<PostResponse>>(
        `/users/${handle}/likes`,
        { query: params },
      ),
    getReposts: (handle: string, params?: PaginationQuery) =>
      apiClient.get<PaginatedResponse<RepostResponse>>(
        `/users/${handle}/reposts`,
        { query: params },
      ),
  },
  timeline: {
    getAll: (params?: PaginationQuery) =>
      apiClient.get<PaginatedResponse<PostResponse>>("/timeline", {
        query: params,
      }),
    getFollowing: (params?: PaginationQuery) =>
      apiClient.get<PaginatedResponse<PostResponse>>("/timeline/following", {
        query: params,
      }),
  },
  posts: {
    create: (data: { content: string; inReplyToId?: string }) =>
      apiClient.post<PostResponse>("/posts", data),
    like: (postId: string) =>
      apiClient.post<{ status: string }>(`/posts/${postId}/like`),
    unlike: (postId: string) =>
      apiClient.post<{ status: string }>(`/posts/${postId}/unlike`),
    repost: (postId: string) =>
      apiClient.post<{ status: string }>(`/posts/${postId}/repost`),
    unrepost: (postId: string) =>
      apiClient.post<{ status: string }>(`/posts/${postId}/unrepost`),
    reply: (postId: string, content: string) =>
      apiClient.post<PostResponse>(`/posts/${postId}/reply`, { content }),
    getThread: (postId: string) =>
      apiClient.get<ThreadNodeResponse>(`/posts/${postId}/thread`),
  },
  drafts: {
    list: () => apiClient.get<DraftResponse[]>(`/drafts`),
    create: (content: string) =>
      apiClient.post<DraftResponse>(`/drafts`, { content }),
    update: (draftId: string, content: string) =>
      apiClient.put<DraftResponse>(`/drafts/${draftId}`, { content }),
    delete: (draftId: string) =>
      apiClient.delete<{ status: string }>(`/drafts/${draftId}`),
  },
  notifications: {
    list: (params?: PaginationQuery) =>
      apiClient.get<PaginatedResponse<NotificationResponse>>(
        `/notifications`,
        { query: params },
      ),
    markRead: (ids: string[]) =>
      apiClient.post<{ status: string }>(`/notifications/mark-read`, { ids }),
  },
};

