import type { Prisma } from "@prisma/client";

export function buildPostSelect(currentUserId?: string) {
  const select: Prisma.PostSelect = {
    id: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    inReplyToId: true,
    author: {
      select: {
        id: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
      },
    },
    stats: true,
  };

  if (currentUserId) {
    select.likes = {
      where: { userId: currentUserId },
      select: { userId: true },
    };
    select.reposts = {
      where: { userId: currentUserId },
      select: { userId: true },
    };
  }

  return select;
}

export type SelectedPost = Prisma.PostGetPayload<{
  select: ReturnType<typeof buildPostSelect>;
}>;

export function serializePost(
  post: SelectedPost,
  extras: { context?: string; liked?: boolean; reposted?: boolean } = {},
) {
  const likesArray = (post as { likes?: Array<{ userId: string }> }).likes ?? [];
  const repostsArray = (post as { reposts?: Array<{ userId: string }> }).reposts ?? [];
  const liked = extras.liked ?? likesArray.length > 0;
  const reposted = extras.reposted ?? repostsArray.length > 0;

  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    inReplyToId: post.inReplyToId,
    author: {
      id: post.author.id,
      handle: post.author.handle,
      displayName: post.author.displayName,
      avatarUrl: post.author.avatarUrl,
    },
    stats: {
      likeCount: post.stats?.likeCount ?? 0,
      replyCount: post.stats?.replyCount ?? 0,
      repostCount: post.stats?.repostCount ?? 0,
      viewCount: post.stats?.viewCount ?? 0,
    },
    liked,
    reposted,
    context: extras.context,
  };
}
