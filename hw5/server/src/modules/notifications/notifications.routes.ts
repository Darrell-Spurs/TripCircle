import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

const notificationsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", {
    schema: {
      querystring: paginationSchema,
    },
    handler: async (request) => {
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }
      const { limit, cursor } = request.query as z.infer<
        typeof paginationSchema
      >;

      const notifications = await app.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        select: {
          id: true,
          type: true,
          postId: true,
          metadata: true,
          readAt: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      let nextCursor: string | null = null;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id ?? null;
      }

      return {
        items: notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          postId: notification.postId,
          metadata: notification.metadata,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
          actor: notification.actor,
        })),
        nextCursor,
      };
    },
  });

  app.post("/mark-read", {
    schema: {
      body: markReadSchema,
    },
    handler: async (request) => {
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }
      const { ids } = request.body as z.infer<typeof markReadSchema>;

      await app.prisma.notification.updateMany({
        where: {
          id: { in: ids },
          recipientId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return { status: "ok" };
    },
  });
};

export default notificationsRoutes;

