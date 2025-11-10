import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import {
  createDraftSchema,
  updateDraftSchema,
  draftIdParamSchema,
} from "./drafts.schemas.js";

const draftsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const userId = request.currentUserId;
    if (!userId) {
      throw app.httpErrors.unauthorized("Authentication required");
    }

    const drafts = await app.prisma.draft.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return drafts;
  });

  app.post("/", {
    schema: {
      body: createDraftSchema,
    },
    handler: async (request) => {
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }
      const { content } = request.body as z.infer<typeof createDraftSchema>;

      const draft = await app.prisma.draft.create({
        data: {
          authorId: userId,
          content,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return draft;
    },
  });

  app.put("/:draftId", {
    schema: {
      params: draftIdParamSchema,
      body: updateDraftSchema,
    },
    handler: async (request) => {
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }
      const { draftId } = request.params as z.infer<typeof draftIdParamSchema>;
      const { content } = request.body as z.infer<typeof updateDraftSchema>;

      const draft = await app.prisma.draft.findUnique({
        where: { id: draftId },
        select: { authorId: true },
      });

      if (!draft || draft.authorId !== userId) {
        throw app.httpErrors.notFound("Draft not found");
      }

      const updated = await app.prisma.draft.update({
        where: { id: draftId },
        data: { content },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updated;
    },
  });

  app.delete("/:draftId", {
    schema: {
      params: draftIdParamSchema,
    },
    handler: async (request) => {
      const userId = request.currentUserId;
      if (!userId) {
        throw app.httpErrors.unauthorized("Authentication required");
      }
      const { draftId } = request.params as z.infer<typeof draftIdParamSchema>;

      const draft = await app.prisma.draft.findUnique({
        where: { id: draftId },
        select: { authorId: true },
      });

      if (!draft || draft.authorId !== userId) {
        throw app.httpErrors.notFound("Draft not found");
      }

      await app.prisma.draft.delete({
        where: { id: draftId },
      });

      return { status: "deleted" };
    },
  });
};

export default draftsRoutes;

