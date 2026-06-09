import { z } from "zod";
import { postListQuerySchema } from "@/modules/post/post.schema";

export const groupPermissionSchema = z.enum(["ADMIN_ONLY", "ANY_MEMBER"]);
export const groupTypeSchema = z.enum(["PUBLIC", "PRIVATE", "DEPARTMENT"]);
export const groupMemberRoleSchema = z.enum(["MEMBER", "MODERATOR", "ADMIN"]);

export const groupIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive("groupId không hợp lệ"),
});

export const groupIdUserIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive("groupId không hợp lệ"),
  userId: z.coerce.number().int().positive("userId không hợp lệ"),
});

export const groupIdPostIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive("groupId không hợp lệ"),
  postId: z.coerce.number().int().positive("postId không hợp lệ"),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const groupListQuerySchema = z.object({
  search: z.string().optional().default(""),
  groupType: groupTypeSchema.optional(),
  scope: z.enum(["my", "all"]).optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(6),
});

export const groupMembersQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().default(""),
  role: groupMemberRoleSchema.optional(),
});

export const groupMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  search: z.string().optional().default(""),
});

export const groupFilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional().default(""),
});

export const createGroupSchema = z.object({
  groupName: z.string().trim().min(1, "Tên nhóm không được để trống"),
  description: z.string().optional(),
  groupType: groupTypeSchema.optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

export const updateGroupSchema = z.object({
  groupName: z.string().trim().min(1).optional(),
  description: z.string().optional(),
});

export const addMemberSchema = z
  .object({
    userId: z.coerce.number().int().positive().optional(),
    email: z.string().trim().email().optional(),
    memberRole: groupMemberRoleSchema.optional(),
  })
  .refine((data) => data.userId != null || data.email != null, {
    message: "Vui lòng nhập email thành viên",
  });

export const updateMemberRoleSchema = z.object({
  memberRole: groupMemberRoleSchema,
});

export const createGroupPostSchema = z.object({
  content: z.string().trim().min(1, "Nội dung bài viết không được để trống"),
  isAnonymous: z.boolean().optional(),
});

export const updateGroupSettingSchema = z.object({
  groupName: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  isHidden: z.boolean().optional(),
  joinApprovalPolicy: groupPermissionSchema.optional(),
  allowAnonymousJoin: z.boolean().optional(),
  postPermission: groupPermissionSchema.optional(),
  postApprovalRequired: z.boolean().optional(),
});

export const groupPostListQuerySchema = postListQuerySchema.omit({
  groupId: true,
});

export type GroupListQuery = z.infer<typeof groupListQuerySchema>;
export type GroupMembersQuery = z.infer<typeof groupMembersQuerySchema>;
export type GroupMediaQuery = z.infer<typeof groupMediaQuerySchema>;
export type GroupFilesQuery = z.infer<typeof groupFilesQuerySchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateGroupPostInput = z.infer<typeof createGroupPostSchema>;
export type UpdateGroupSettingInput = z.infer<typeof updateGroupSettingSchema>;
export type GroupPostListQuery = z.infer<typeof groupPostListQuerySchema>;
