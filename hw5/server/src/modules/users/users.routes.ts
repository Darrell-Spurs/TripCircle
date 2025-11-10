import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { buildPostSelect, serializePost } from "../posts/postSerializer.js";

const handleParamSchema = z.object({
  handle: z.string().min(1),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:handle", {
    schema: {
      params: handleParamSchema,
    },
    handler: async (request) => {
      const { handle } = request.params as z.infer<typeof handleParamSchema>;

      const user = await app.prisma.user.findUnique({
        where: { handle },
        select: {
          id: true,
          handle: true,
          displayName: true,
          bio: true,
          location: true,
          avatarUrl: true,
          bannerUrl: true,
          createdAt: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
        },
      });

      if (!user) {
        throw app.httpErrors.notFound("User not found");
      }

      return {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        bio: user.bio,
        location: user.location,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        createdAt: user.createdAt,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        postCount: user._count.posts,
      };
    },
  });

  app.get("/:handle/posts", {
    schema: {
      params: handleParamSchema,
      querystring: paginationSchema,
    },
    handler: async (request) => {
      const { handle } = request.params as z.infer<typeof handleParamSchema>;
      const { limit, cursor } = request.query as z.infer<
        typeof paginationSchema
      >;

      const currentUserId = request.currentUserId ?? undefined;

      const user = await app.prisma.user.findUnique({
        where: { handle },
        select: { id: true },
      });

      if (!user) {
        throw app.httpErrors.notFound("User not found");
      }

      const posts = await app.prisma.post.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        select: buildPostSelect(currentUserId),
      });

      let nextCursor: string | null = null;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id ?? null;
      }

      return {
        items: posts.map((item) => serializePost(item)),
        nextCursor,
      };
    },
  });

  app.get("/:handle/likes", {
    schema: {
      params: handleParamSchema,
      querystring: paginationSchema,
    },
    handler: async (request) => {
      const { handle } = request.params as z.infer<typeof handleParamSchema>;
      const { limit, cursor } = request.query as z.infer<
        typeof paginationSchema
      >;

      const currentUserId = request.currentUserId ?? undefined;

      const user = await app.prisma.user.findUnique({
        where: { handle },
        select: { id: true },
      });

      if (!user) {
        throw app.httpErrors.notFound("User not found");
      }

      const likes = await app.prisma.postLike.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor
          ? { postId_userId: { postId: cursor, userId: user.id } }
          : undefined,
        skip: cursor ? 1 : 0,
        select: {
          createdAt: true,
          post: {
            select: buildPostSelect(currentUserId),
          },
        },
      });

      let nextCursor: string | null = null;
      if (likes.length > limit) {
        const nextItem = likes.pop();
        nextCursor = nextItem?.post.id ?? null;
      }

      return {
        items: likes.map((like) =>
          serializePost(like.post, {
            liked: true,
          }),
        ),
        nextCursor,
      };
    },
  });

  app.get("/:handle/reposts", {
    schema: {
      params: handleParamSchema,
      querystring: paginationSchema,
    },
    handler: async (request) => {
      const { handle } = request.params as z.infer<typeof handleParamSchema>;
      const { limit, cursor } = request.query as z.infer<
        typeof paginationSchema
      >;

      const currentUserId = request.currentUserId ?? undefined;

      const user = await app.prisma.user.findUnique({
        where: { handle },
        select: { id: true, displayName: true },
      });

      if (!user) {
        throw app.httpErrors.notFound("User not found");
      }

      const reposts = await app.prisma.postRepost.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor
          ? { postId_userId: { postId: cursor, userId: user.id } }
          : undefined,
        skip: cursor ? 1 : 0,
        select: {
          postId: true,
          createdAt: true,
          post: {
            select: buildPostSelect(currentUserId),
          },
        },
      });

      let nextCursor: string | null = null;
      if (reposts.length > limit) {
        const nextItem = reposts.pop();
        nextCursor = nextItem?.postId ?? null;
      }

      const isOwner = user.id === currentUserId;

      return {
        items: reposts.map((entry) => ({
          post: serializePost(entry.post, {
            reposted: !!currentUserId && isOwner,
            context: isOwner
              ? "You reposted"
              : `${user.displayName ?? handle} reposted`,
          }),
          repostedAt: entry.createdAt,
        })),
        nextCursor,
      };
    },
  });
};

export default usersRoutes;

