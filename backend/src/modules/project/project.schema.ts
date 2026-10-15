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

const WORKFLOW_KEY_REGEX = /^[A-Z][A-Z0-9_]{0,49}$/;

const workflowNameSchema = z
  .string()
  .trim()
  .min(1, "Tên không được để trống")
  .max(150, "Tên tối đa 150 ký tự");

const workflowDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Mô tả tối đa 2000 ký tự")
  .nullable()
  .transform((value) => (value ? value : null));

const workflowCategorySchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
]);

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Màu phải là mã hex gồm # và 6 ký tự");

const approverTypeSchema = z.enum(["PROJECT_ROLE", "TASK_ROLE"]);

const taskRoleSchema = z.enum(["ASSIGNEE", "REVIEWER", "REPORTER"]);

const hasAnyField = (data: Record<string, unknown>) =>
  Object.values(data).some((value) => value !== undefined);

export const workflowIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID dự án không hợp lệ"),
  workflowId: z.coerce.number().int().positive("ID quy trình không hợp lệ"),
});

export const statusIdParamsSchema = workflowIdParamsSchema.extend({
  statusId: z.coerce.number().int().positive("ID trạng thái không hợp lệ"),
});

export const transitionIdParamsSchema = workflowIdParamsSchema.extend({
  transitionId: z.coerce
    .number()
    .int()
    .positive("ID đường đi không hợp lệ"),
});

export const approvalRuleIdParamsSchema = transitionIdParamsSchema.extend({
  ruleId: z.coerce.number().int().positive("ID quy tắc duyệt không hợp lệ"),
});

export const createProjectWorkflowSchema = z.object({
  name: workflowNameSchema,
  description: workflowDescriptionSchema,
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export const updateProjectWorkflowSchema = z
  .object({
    name: workflowNameSchema.optional(),
    description: workflowDescriptionSchema.optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(hasAnyField, { message: "Cần ít nhất một trường để cập nhật" });

export const createProjectWorkflowStatusSchema = z.object({
  name: workflowNameSchema,
  key: z
    .string()
    .regex(
      WORKFLOW_KEY_REGEX,
      "Key phải bắt đầu bằng chữ in hoa, chỉ gồm A-Z, 0-9 và _",
    ),
  description: workflowDescriptionSchema,
  sortOrder: z.number().int().min(0, "Thứ tự không được âm"),
  category: workflowCategorySchema,
  color: hexColorSchema.nullable(),
  isInitial: z.boolean(),
  isFinal: z.boolean(),
});

export const updateProjectWorkflowStatusSchema = z
  .object({
    name: workflowNameSchema.optional(),
    description: workflowDescriptionSchema.optional(),
    sortOrder: z.number().int().min(0, "Thứ tự không được âm").optional(),
    category: workflowCategorySchema.optional(),
    color: hexColorSchema.nullable().optional(),
    isInitial: z.boolean().optional(),
    isFinal: z.boolean().optional(),
    key: z.unknown().optional(),
  })
  .refine((data) => data.key === undefined, {
    message: "Không được đổi key trạng thái",
    path: ["key"],
  })
  .refine((data) => {
    const { key: _key, ...rest } = data;
    return hasAnyField(rest);
  }, { message: "Cần ít nhất một trường để cập nhật" })
  .transform(({ key: _key, ...rest }) => rest);

export const reorderProjectWorkflowStatusesSchema = z.object({
  statusIds: z.array(z.number().int().positive("ID trạng thái không hợp lệ")),
});

export const createProjectWorkflowTransitionSchema = z.object({
  fromStatusId: z.number().int().positive("Trạng thái nguồn không hợp lệ"),
  toStatusId: z.number().int().positive("Trạng thái đích không hợp lệ"),
  name: workflowNameSchema,
});

export const updateProjectWorkflowTransitionSchema = z
  .object({
    fromStatusId: z
      .number()
      .int()
      .positive("Trạng thái nguồn không hợp lệ")
      .optional(),
    toStatusId: z
      .number()
      .int()
      .positive("Trạng thái đích không hợp lệ")
      .optional(),
    name: workflowNameSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(hasAnyField, { message: "Cần ít nhất một trường để cập nhật" });

export const createProjectApprovalRuleSchema = z.object({
  approverType: approverTypeSchema,
  projectRoleId: z.number().int().positive().nullable(),
  taskRole: taskRoleSchema.nullable(),
  minApprovals: z.number().int().min(1, "Số người duyệt phải từ 1"),
  onRejectStatusId: z.number().int().positive("Trạng thái từ chối không hợp lệ"),
});

export const updateProjectApprovalRuleSchema = z
  .object({
    approverType: approverTypeSchema.optional(),
    projectRoleId: z.number().int().positive().nullable().optional(),
    taskRole: taskRoleSchema.nullable().optional(),
    minApprovals: z.number().int().min(1, "Số người duyệt phải từ 1").optional(),
    onRejectStatusId: z
      .number()
      .int()
      .positive("Trạng thái từ chối không hợp lệ")
      .optional(),
  })
  .refine(hasAnyField, { message: "Cần ít nhất một trường để cập nhật" });

export type WorkflowIdParams = z.infer<typeof workflowIdParamsSchema>;
export type StatusIdParams = z.infer<typeof statusIdParamsSchema>;
export type TransitionIdParams = z.infer<typeof transitionIdParamsSchema>;
export type ApprovalRuleIdParams = z.infer<typeof approvalRuleIdParamsSchema>;
export type CreateProjectWorkflowInput = z.infer<
  typeof createProjectWorkflowSchema
>;
export type UpdateProjectWorkflowInput = z.infer<
  typeof updateProjectWorkflowSchema
>;
export type CreateProjectWorkflowStatusInput = z.infer<
  typeof createProjectWorkflowStatusSchema
>;
export type UpdateProjectWorkflowStatusInput = z.infer<
  typeof updateProjectWorkflowStatusSchema
>;
export type ReorderProjectWorkflowStatusesInput = z.infer<
  typeof reorderProjectWorkflowStatusesSchema
>;
export type CreateProjectWorkflowTransitionInput = z.infer<
  typeof createProjectWorkflowTransitionSchema
>;
export type UpdateProjectWorkflowTransitionInput = z.infer<
  typeof updateProjectWorkflowTransitionSchema
>;
export type CreateProjectApprovalRuleInput = z.infer<
  typeof createProjectApprovalRuleSchema
>;
export type UpdateProjectApprovalRuleInput = z.infer<
  typeof updateProjectApprovalRuleSchema
>;

const catalogKeySchema = z
  .string()
  .regex(
    WORKFLOW_KEY_REGEX,
    "Key phải bắt đầu bằng chữ in hoa, chỉ gồm A-Z, 0-9 và _",
  );

export const projectRoleParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID dự án không hợp lệ"),
  roleId: z.coerce.number().int().positive("ID vai trò không hợp lệ"),
});

export const projectTaskTypeParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID dự án không hợp lệ"),
  taskTypeId: z.coerce.number().int().positive("ID loại công việc không hợp lệ"),
});

export const createProjectRoleCatalogSchema = z.object({
  key: catalogKeySchema,
  name: workflowNameSchema,
  description: workflowDescriptionSchema,
  sortOrder: z.number().int().min(0, "Thứ tự không được âm").default(0),
});

export const updateProjectRoleCatalogSchema = z
  .object({
    name: workflowNameSchema.optional(),
    description: workflowDescriptionSchema.optional(),
    sortOrder: z.number().int().min(0, "Thứ tự không được âm").optional(),
  })
  .refine(hasAnyField, { message: "Cần ít nhất một trường để cập nhật" });

export const createProjectTaskTypeSchema = z.object({
  key: catalogKeySchema,
  name: workflowNameSchema,
  description: workflowDescriptionSchema,
  sortOrder: z.number().int().min(0, "Thứ tự không được âm").default(0),
  isActive: z.boolean().default(true),
  workflowId: z.number().int().positive().nullable().default(null),
});

export const updateProjectTaskTypeSchema = z
  .object({
    name: workflowNameSchema.optional(),
    description: workflowDescriptionSchema.optional(),
    sortOrder: z.number().int().min(0, "Thứ tự không được âm").optional(),
    isActive: z.boolean().optional(),
    workflowId: z.number().int().positive().nullable().optional(),
  })
  .refine(hasAnyField, { message: "Cần ít nhất một trường để cập nhật" });

export type ProjectRoleParams = z.infer<typeof projectRoleParamsSchema>;
export type ProjectTaskTypeParams = z.infer<typeof projectTaskTypeParamsSchema>;
export type CreateProjectRoleCatalogInput = z.infer<
  typeof createProjectRoleCatalogSchema
>;
export type UpdateProjectRoleCatalogInput = z.infer<
  typeof updateProjectRoleCatalogSchema
>;
export type CreateProjectTaskTypeInput = z.infer<
  typeof createProjectTaskTypeSchema
>;
export type UpdateProjectTaskTypeInput = z.infer<
  typeof updateProjectTaskTypeSchema
>;

const taskDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

const taskChildSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .max(200, "Tên tối đa 200 ký tự"),
  estimatedMinutes: z.number().int().min(0).max(1_000_000).nullable(),
});

export const projectTaskParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID dự án không hợp lệ"),
  taskId: z.coerce.number().int().positive("ID công việc không hợp lệ"),
});

export const projectTaskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  keyword: z.string().trim().optional(),
  match: z.enum(["title", "title_or_code"]).optional().default("title"),
  workflowId: z.coerce.number().int().positive().optional(),
  taskTypeId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  statusIds: z.preprocess((value) => {
    if (value == null || value === "") return undefined;
    const raw = Array.isArray(value) ? value : [value];
    const parts = raw
      .flatMap((item) => String(item).split(","))
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : undefined;
  }, z.array(z.coerce.number().int().positive()).optional()),
  assigneeId: z.coerce.number().int().positive().optional(),
  reporterId: z.coerce.number().int().positive().optional(),
  reviewerId: z.coerce.number().int().positive().optional(),
  date: taskDateSchema.optional(),
});

export const saveProjectTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .max(200, "Tên tối đa 200 ký tự"),
  description: z.string().max(20000, "Mô tả tối đa 20000 ký tự").nullable(),
  workflowId: z.number().int().positive("Quy trình không hợp lệ"),
  taskTypeId: z.number().int().positive("Loại công việc không hợp lệ"),
  statusId: z.number().int().positive("Trạng thái không hợp lệ").nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  startDate: taskDateSchema.nullable(),
  dueDate: taskDateSchema.nullable(),
  estimatedMinutes: z.number().int().min(0).max(1_000_000).nullable(),
  parentTaskId: z.number().int().positive().nullable(),
  assignees: z
    .array(
      z.object({
        projectRoleId: z.number().int().positive(),
        userId: z.number().int().positive(),
      }),
    )
    .default([]),
  reporterId: z.number().int().positive(),
  reviewerIds: z.array(z.number().int().positive()).default([]),
  children: z
    .array(taskChildSchema)
    .max(20, "Tối đa 20 việc con mỗi lần")
    .default([]),
});

export const updateProjectTaskStatusSchema = z.object({
  statusId: z.number().int().positive("Trạng thái không hợp lệ"),
});

export const createProjectTaskCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Nội dung không được để trống")
    .max(5000, "Bình luận tối đa 5000 ký tự"),
});

export type ProjectTaskParams = z.infer<typeof projectTaskParamsSchema>;
export type ProjectTaskListQuery = z.infer<typeof projectTaskListQuerySchema>;
export type SaveProjectTaskInput = z.infer<typeof saveProjectTaskSchema>;
export type UpdateProjectTaskStatusInput = z.infer<
  typeof updateProjectTaskStatusSchema
>;
export type CreateProjectTaskCommentInput = z.infer<
  typeof createProjectTaskCommentSchema
>;
