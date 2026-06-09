import { z } from "zod";

export const contentFormatSchema = z.enum(["PLAIN", "HTML"]);

export const reactionTypeSchema = z.enum([
  "LIKE",
  "LOVE",
  "HAHA",
  "WOW",
  "SAD",
  "ANGRY",
]);

export const postListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["latest", "trending"]).default("latest"),
  groupId: z.coerce.number().int().positive().optional(),
});

export const postIdParamsSchema = z.object({
  postId: z.coerce.number().int().positive("postId không hợp lệ"),
});

export const createPostSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  contentFormat: contentFormatSchema.default("HTML"),
  visibility: z.enum(["PUBLIC", "PRIVATE", "GROUP"]).default("PUBLIC"),
  groupId: z.number().int().positive().optional(),
  attachmentIds: z.array(z.number().int().positive()).optional(),
  isAnonymous: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  contentFormat: contentFormatSchema.default("HTML"),
});

export const reactPostSchema = z.object({
  reactionType: reactionTypeSchema,
});

export const pinPostSchema = z.object({
  isPinned: z.boolean(),
  groupId: z.number().int().positive().optional(),
});

export type PostListQuery = z.infer<typeof postListQuerySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ReactPostInput = z.infer<typeof reactPostSchema>;
export type PinPostInput = z.infer<typeof pinPostSchema>;
