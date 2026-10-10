import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Tên không được để trống")
    .max(150, "Tên tối đa 150 ký tự"),
  description: z
    .string()
    .max(2000, "Mô tả tối đa 2000 ký tự")
    .nullable()
    .optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  isUrgent: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  templateId: z.number().min(1, "Template ID không được để trống"),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;

export const getProjectListSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  keyword: z.string().optional(),
});

export type GetProjectListSchema = z.infer<typeof getProjectListSchema>;

const projectDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Tên không được để trống")
      .max(150, "Tên tối đa 150 ký tự"),
    description: z
      .string()
      .trim()
      .max(2000, "Mô tả tối đa 2000 ký tự")
      .nullable(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    status: z.enum([
      "PLANNING",
      "IN_PROGRESS",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
    ]),
    isUrgent: z.boolean(),
    startDate: projectDateSchema,
    endDate: projectDateSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
    path: ["endDate"],
  });

export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;

export const projectIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID dự án không hợp lệ"),
});

export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;

export const projectMemberUserParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID dự án không hợp lệ"),
  userId: z.coerce.number().int().positive("ID người dùng không hợp lệ"),
});

export type ProjectMemberUserParams = z.infer<
  typeof projectMemberUserParamsSchema
>;

export const projectMemberListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type ProjectMemberListQuery = z.infer<
  typeof projectMemberListQuerySchema
>;

export const memberCandidateQuerySchema = z.object({
  keyword: z.string().trim().min(1, "Nhập tên hoặc email để tìm"),
});

export type MemberCandidateQuery = z.infer<typeof memberCandidateQuerySchema>;

const roleIdsSchema = z
  .array(z.number().int().positive("Vai trò không hợp lệ"))
  .min(1, "Chọn ít nhất một vai trò");

export const addProjectMemberSchema = z.object({
  userId: z.number().int().positive("ID người dùng không hợp lệ"),
  roleIds: roleIdsSchema,
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

export const updateProjectMemberRolesSchema = z.object({
  roleIds: roleIdsSchema,
});

export type UpdateProjectMemberRolesInput = z.infer<
  typeof updateProjectMemberRolesSchema
>;
