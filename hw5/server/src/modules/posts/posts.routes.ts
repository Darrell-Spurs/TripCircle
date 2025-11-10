import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import {
  createPostSchema,
  postIdParamSchema,
} from "./posts.schemas.js";
import { buildPostSelect, serializePost } from "./postSerializer.js";
import type { SelectedPost } from "./postSerializer.js";

type ThreadNode = {
  post: SelectedPost;
  replies: ThreadNode[];
};

const postsRoutes: FastifyPluginAsync = async (app) => {
  const buildThreadRecursive = async (
    postId: string,
    select: ReturnType<typeof buildPostSelect>,
  ): Promise<ThreadNode | null> => {
    const post = await app.prisma.post.findUnique({
      where: { id: postId },
      select,
    });

    if (!post) {
      return null;
    }

    const replies = await app.prisma.post.findMany({
      where: { inReplyToId: postId },
      orderBy: { createdAt: "asc" },
      select,
    });

    const children: ThreadNode[] = [];
    for (const reply of replies) {
      const nested = await buildThreadRecursive(reply.id, select);
      if (nested) {
        children.push(nested);
      }
    }

    return { post, replies: children };
  };

  app.post("/", {
    schema: {
      body: createPostSchema,
    },
    handler: async (request) => {
      const authorId = request.currentUserId;
      if (!authorId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      const { content, inReplyToId } = request.body as z.infer<
        typeof createPostSchema
      >;

      if (inReplyToId) {
        const parent = await app.prisma.post.findUnique({
          where: { id: inReplyToId },
          select: { id: true },
        });

        if (!parent) {
          throw app.httpErrors.notFound("Parent post not found");
        }
      }

      const post = await app.prisma.post.create({
        data: {
          authorId,
          content,
          inReplyToId: inReplyToId ?? null,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          inReplyToId: true,
          author: {
            select: {
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await app.prisma.postStat.create({
        data: {
          postId: post.id,
          likeCount: 0,
          replyCount: 0,
          repostCount: 0,
          viewCount: 0,
        },
      });

      if (inReplyToId) {
        await app.prisma.postStat.update({
          where: { postId: inReplyToId },
          data: {
            replyCount: { increment: 1 },
          },
        });
      }

      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        inReplyToId: post.inReplyToId,
        author: post.author,
        stats: {
          likeCount: 0,
          replyCount: 0,
          repostCount: 0,
          viewCount: 0,
        },
      };
    },
  });

  app.post("/:postId/like", {
    schema: {
      params: postIdParamSchema,
    },
    handler: async (request) => {
      const { postId } = request.params as z.infer<typeof postIdParamSchema>;
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      try {
        await app.prisma.postLike.create({
          data: {
            userId,
            postId,
          },
        });
        await app.prisma.postStat.update({
          where: { postId },
          data: {
            likeCount: { increment: 1 },
          },
        });
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          // already liked
        } else {
          throw error;
        }
      }

      return { status: "liked" };
    },
  });

  app.post("/:postId/unlike", {
    schema: {
      params: postIdParamSchema,
    },
    handler: async (request) => {
      const { postId } = request.params as z.infer<typeof postIdParamSchema>;
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      await app.prisma.postLike
        .delete({
          where: {
            userId_postId: {
              postId,
              userId,
            },
          },
        })
        .catch(() => undefined);

      await app.prisma.postStat.update({
        where: { postId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });

      return { status: "unliked" };
    },
  });

  app.post("/:postId/repost", {
    schema: {
      params: postIdParamSchema,
    },
    handler: async (request) => {
      const { postId } = request.params as z.infer<typeof postIdParamSchema>;
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      try {
        await app.prisma.postRepost.create({
          data: {
            userId,
            postId,
          },
        });
        await app.prisma.postStat.update({
          where: { postId },
          data: {
            repostCount: { increment: 1 },
          },
        });
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          // already reposted
        } else {
          throw error;
        }
      }

      return { status: "reposted" };
    },
  });

  app.post("/:postId/unrepost", {
    schema: {
      params: postIdParamSchema,
    },
    handler: async (request) => {
      const { postId } = request.params as z.infer<typeof postIdParamSchema>;
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      await app.prisma.postRepost
        .delete({
          where: {
            userId_postId: {
              postId,
              userId,
            },
          },
        })
        .catch(() => undefined);

      await app.prisma.postStat.update({
        where: { postId },
        data: {
          repostCount: {
            decrement: 1,
          },
        },
      });

      return { status: "unreposted" };
    },
  });

  app.post("/:postId/reply", {
    schema: {
      params: postIdParamSchema,
      body: createPostSchema.pick({ content: true }),
    },
    handler: async (request) => {
      const { postId } = request.params as z.infer<typeof postIdParamSchema>;
      const { content } = request.body as { content: string };
      const authorId = request.currentUserId;
      if (!authorId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }

      const parent = await app.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!parent) {
        throw app.httpErrors.notFound("Parent post not found");
      }

      const reply = await app.prisma.post.create({
        data: {
          authorId,
          content,
          inReplyToId: postId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await app.prisma.postStat.create({
        data: {
          postId: reply.id,
          likeCount: 0,
          replyCount: 0,
          repostCount: 0,
          viewCount: 0,
        },
      });

      await app.prisma.postStat.update({
        where: { postId },
        data: {
          replyCount: { increment: 1 },
        },
      });

      return {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        inReplyToId: postId,
        author: reply.author,
        stats: {
          likeCount: 0,
          replyCount: 0,
          repostCount: 0,
          viewCount: 0,
        },
      };
    },
  });

  app.get("/:postId/thread", {
    schema: {
      params: postIdParamSchema,
    },
    handler: async (request) => {
      const { postId } = request.params as z.infer<typeof postIdParamSchema>;
      const select = buildPostSelect(request.currentUserId ?? undefined);
      const thread = await buildThreadRecursive(postId, select);

      if (!thread) {
        throw app.httpErrors.notFound("Post not found");
      }

      type ThreadResponse = {
        post: ReturnType<typeof serializePost>;
        replies: ThreadResponse[];
      };

      const toResponse = (node: ThreadNode): ThreadResponse => ({
        post: serializePost(node.post),
        replies: node.replies.map(toResponse),
      });

      return toResponse(thread);
    },
  });
};

export default postsRoutes;

