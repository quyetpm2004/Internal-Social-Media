import { z } from "zod";
import { reactionTypeSchema } from "@/modules/post/post.schema";

export const commentIdParamsSchema = z.object({
  commentId: z.coerce.number().int().positive("commentId không hợp lệ"),
});

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Nội dung comment không được để trống"),
  mentionedUserIds: z.array(z.number().int().positive()).optional().default([]),
  mentionAll: z.boolean().optional().default(false),
  isAnonymous: z.boolean().optional().default(false),
});

export const replyCommentSchema = z.object({
  content: z.string().trim().min(1, "Nội dung reply không được để trống"),
  mentionedUserIds: z.array(z.number().int().positive()).optional().default([]),
  mentionAll: z.boolean().optional().default(false),
  isAnonymous: z.boolean().optional().default(false),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, "Nội dung comment không được để trống"),
  mentionedUserIds: z.array(z.number().int().positive()).optional().default([]),
  mentionAll: z.boolean().optional().default(false),
});

export const reactCommentSchema = z.object({
  reactionType: reactionTypeSchema,
});

export const pinCommentSchema = z.object({
  isPinned: z.boolean(),
});

export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReplyCommentInput = z.infer<typeof replyCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ReactCommentInput = z.infer<typeof reactCommentSchema>;
export type PinCommentInput = z.infer<typeof pinCommentSchema>;
