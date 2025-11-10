export const queryKeys = {
  timeline: (variant: "all" | "following") =>
    ["timeline", variant] as const,
  userProfile: (handle: string) => ["user", "profile", handle] as const,
  userPosts: (handle: string) => ["user", "posts", handle] as const,
  userLikes: (handle: string) => ["user", "likes", handle] as const,
  userReposts: (handle: string) => ["user", "reposts", handle] as const,
  drafts: ["drafts"] as const,
  notifications: ["notifications"] as const,
};

