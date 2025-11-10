import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post cannot be empty")
    .max(280, "Post exceeds 280 characters"),
  inReplyToId: z.string().optional(),
});

export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const postIdParamSchema = z.object({
  postId: z.string().min(1),
});

