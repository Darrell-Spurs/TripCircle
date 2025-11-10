import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { timelineQuerySchema } from "./timeline.schemas.js";
import { buildPostSelect, serializePost } from "../posts/postSerializer.js";

const timelineRoutes: FastifyPluginAsync = async (app) => {
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

      const following = await app.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followedId: true },
      });
      const authorIds = [currentUserId, ...following.map((row) => row.followedId)];

      const posts = await app.prisma.post.findMany({
        where: {
          authorId: {
            in: authorIds,
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

