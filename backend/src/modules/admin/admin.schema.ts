import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminUserListQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const adminPostListQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().default(""),
  status: z
    .enum(["ACTIVE", "PENDING_REVIEW", "HIDDEN", "DELETED"])
    .optional(),
});

export const adminGroupListQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});

export const adminGroupMembersQuerySchema = paginationQuerySchema;

export const userIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive("userId không hợp lệ"),
});

export const postIdParamsSchema = z.object({
  postId: z.coerce.number().int().positive("postId không hợp lệ"),
});

export const groupIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive("groupId không hợp lệ"),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
export type AdminPostListQuery = z.infer<typeof adminPostListQuerySchema>;
export type AdminGroupListQuery = z.infer<typeof adminGroupListQuerySchema>;
export type AdminGroupMembersQuery = z.infer<typeof adminGroupMembersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
