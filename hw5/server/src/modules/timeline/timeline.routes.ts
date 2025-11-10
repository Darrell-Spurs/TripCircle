import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { timelineQuerySchema } from "./timeline.schemas.js";
import { buildPostSelect, serializePost } from "../posts/postSerializer.js";

const timelineRoutes: FastifyPluginAsync = async (app) => {
  // "For You" - All posts/reposts across the platform, newest first
  app.get("/", {
    schema: {
      querystring: timelineQuerySchema,
    },
    handler: async (request) => {
      const { limit, cursor } = request.query as z.infer<
        typeof timelineQuerySchema
      >;

      const currentUserId = request.currentUserId;
      if (!currentUserId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      // Get all posts from everyone
      const posts = await app.prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
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
        items: posts.map((post) => serializePost(post)),
        nextCursor,
      };
    },
  });

  // "Following" - Only posts from users I follow
  app.get("/following", {
    schema: {
      querystring: timelineQuerySchema,
    },
    handler: async (request) => {
      const { limit, cursor } = request.query as z.infer<
        typeof timelineQuerySchema
      >;

      const currentUserId = request.currentUserId;
      if (!currentUserId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      const followingIds = await app.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followedId: true },
      });

      if (!followingIds.length) {
        return {
          items: [],
          nextCursor: null,
        };
      }

      // Get posts only from followed users (not including my own posts)
      const posts = await app.prisma.post.findMany({
        where: {
          authorId: {
            in: followingIds.map((f) => f.followedId),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
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
        items: posts.map((post) => serializePost(post)),
        nextCursor,
      };
    },
  });
};

export default timelineRoutes;

