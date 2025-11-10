export type UserProfileResponse = {
  id: string;
  handle: string | null;
  displayName: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
};

export type PostStats = {
  likeCount: number;
  replyCount: number;
  repostCount: number;
  viewCount: number;
};

export type PostAuthor = {
  id: string;
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
};

export type PostResponse = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  inReplyToId: string | null;
  author: PostAuthor;
  stats: PostStats;
  liked?: boolean;
  reposted?: boolean;
  context?: string;
};

export type RepostResponse = {
  post: PostResponse;
  repostedAt: string;
};

export type PaginatedResponse<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export type DraftResponse = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType = "LIKE" | "REPOST" | "REPLY" | "FOLLOW";

export type NotificationResponse = {
  id: string;
  type: NotificationType;
  postId: string | null;
  metadata?: unknown;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type ThreadNodeResponse = {
  post: PostResponse;
  replies: ThreadNodeResponse[];
};

