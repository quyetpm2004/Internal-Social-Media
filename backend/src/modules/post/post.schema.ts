import { z } from "zod";
import { pollInputSchema, pollUpdateSchema } from "@/modules/poll/poll.schema";

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

export const savedPostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const postIdParamsSchema = z.object({
  postId: z.coerce.number().int().positive("postId không hợp lệ"),
});

export const mentionedUserIdsSchema = z
  .array(z.coerce.number().int().positive())
  .optional()
  .default([]);

export const mentionAllSchema = z.boolean().optional().default(false);

export const createPostSchema = z
  .object({
    content: z.string().max(20000).optional().default(""),
    contentFormat: contentFormatSchema.default("HTML"),
    visibility: z.enum(["PUBLIC", "PRIVATE", "GROUP"]).default("PUBLIC"),
    groupId: z.number().int().positive().optional(),
    attachmentIds: z.array(z.number().int().positive()).optional(),
    isAnonymous: z.boolean().optional(),
    mentionedUserIds: mentionedUserIdsSchema,
    mentionAll: mentionAllSchema,
    poll: pollInputSchema.optional(),
    event: z
      .object({
        title: z
          .string()
          .trim()
          .min(1, "Tiêu đề sự kiện không được để trống")
          .max(200),
        description: z.string().trim().max(1000).optional(),
        startAt: z.coerce.date(),
        endAt: z.coerce.date().optional(),
        location: z.string().trim().max(255).optional(),
      })
      .superRefine((data, ctx) => {
        if (data.endAt && data.endAt < data.startAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endAt"],
            message: "Thời gian kết thúc phải sau thời gian bắt đầu",
          });
        }
      })
      .optional(),
  })
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasPoll = Boolean(data.poll);
      const hasEvent = Boolean(data.event);
      const hasAttachments = (data.attachmentIds?.length ?? 0) > 0;
      return hasContent || hasPoll || hasEvent || hasAttachments;
    },
    {
      message: "Bài viết cần có nội dung, bình chọn, sự kiện hoặc tệp đính kèm",
    },
  )
  .refine((data) => !(data.poll && data.event), {
    message: "Chỉ được chọn một loại: bình chọn hoặc sự kiện",
  });

export const updatePostSchema = z
  .object({
    content: z.string().max(20000).optional().default(""),
    contentFormat: contentFormatSchema.default("HTML"),
    mentionedUserIds: mentionedUserIdsSchema,
    mentionAll: mentionAllSchema,
    poll: pollUpdateSchema.optional(),
    event: z
      .object({
        title: z
          .string()
          .trim()
          .min(1, "Tiêu đề sự kiện không được để trống")
          .max(200),
        description: z.string().trim().max(1000).optional(),
        startAt: z.coerce.date(),
        endAt: z.coerce.date().optional(),
        location: z.string().trim().max(255).optional(),
      })
      .superRefine((data, ctx) => {
        if (data.endAt && data.endAt < data.startAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endAt"],
            message: "Thời gian kết thúc phải sau thời gian bắt đầu",
          });
        }
      })
      .optional(),
  })
  .refine((data) => !(data.poll && data.event), {
    message: "Chỉ được cập nhật một loại: bình chọn hoặc sự kiện",
  })
  .refine(
    (data) => {
      const hasContent = data.content.trim().length > 0;
      const hasPoll = Boolean(data.poll);
      const hasEvent = Boolean(data.event);
      return hasContent || hasPoll || hasEvent;
    },
    { message: "Bài viết cần có nội dung, bình chọn hoặc sự kiện" },
  );

export const reactPostSchema = z.object({
  reactionType: reactionTypeSchema,
});

export const postReactionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  reactionType: reactionTypeSchema.optional(),
});

export const pinPostSchema = z.object({
  isPinned: z.boolean(),
  groupId: z.number().int().positive().optional().nullable(),
});

export type PostListQuery = z.infer<typeof postListQuerySchema>;
export type SavedPostListQuery = z.infer<typeof savedPostListQuerySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ReactPostInput = z.infer<typeof reactPostSchema>;
export type PostReactionListQuery = z.infer<typeof postReactionListQuerySchema>;
export type PinPostInput = z.infer<typeof pinPostSchema>;
