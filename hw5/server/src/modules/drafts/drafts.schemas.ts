import { z } from "zod";

export const createDraftSchema = z.object({
  content: z.string().trim().min(1).max(280),
});

export const updateDraftSchema = z.object({
  content: z.string().trim().min(1).max(280),
});

export const draftIdParamSchema = z.object({
  draftId: z.string().min(1),
});

