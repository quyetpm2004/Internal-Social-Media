import { z } from "zod";

export const KEY_REGEX = /^[A-Z][A-Z0-9_]{0,49}$/;

const keySchema = z
  .string()
  .regex(KEY_REGEX, "Key phải bắt đầu bằng chữ in hoa, chỉ gồm A-Z, 0-9 và _");

const nameSchema = z
  .string()
  .min(1, "Tên không được để trống")
  .max(150, "Tên tối đa 150 ký tự");

const descriptionSchema = z
  .string()
  .max(2000, "Mô tả tối đa 2000 ký tự")
  .nullable()
  .optional();

const sortOrderSchema = z.coerce.number().int().min(0).optional();

const templateStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

const workflowCategorySchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
]);

const approverTypeSchema = z.enum(["PROJECT_ROLE", "TASK_ROLE"]);

const taskRoleSchema = z.enum(["ASSIGNEE", "REVIEWER", "REPORTER"]);

export const templateIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID template không hợp lệ"),
});

export const roleIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID template không hợp lệ"),
  roleId: z.coerce.number().int().positive("ID vai trò không hợp lệ"),
});

export const taskTypeIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID template không hợp lệ"),
  taskTypeId: z.coerce.number().int().positive("ID loại công việc không hợp lệ"),
});

export const workflowIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID template không hợp lệ"),
  workflowId: z.coerce.number().int().positive("ID workflow không hợp lệ"),
});

export const statusIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID template không hợp lệ"),
  workflowId: z.coerce.number().int().positive("ID workflow không hợp lệ"),
  statusId: z.coerce.number().int().positive("ID trạng thái không hợp lệ"),
});

export const transitionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID template không hợp lệ"),
  workflowId: z.coerce.number().int().positive("ID workflow không hợp lệ"),
  transitionId: z.coerce
    .number()
    .int()
    .positive("ID chuyển trạng thái không hợp lệ"),
});

export const approvalRuleIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID template không hợp lệ"),
  workflowId: z.coerce.number().int().positive("ID workflow không hợp lệ"),
  transitionId: z.coerce
    .number()
    .int()
    .positive("ID chuyển trạng thái không hợp lệ"),
  ruleId: z.coerce.number().int().positive("ID quy tắc duyệt không hợp lệ"),
});

export const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  keyword: z.string().optional(),
  status: templateStatusSchema.optional(),
});

export const createTemplateSchema = z.object({
  key: keySchema,
  name: nameSchema,
  description: descriptionSchema,
});

export const updateTemplateSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const duplicateTemplateSchema = z.object({
  key: keySchema,
  name: nameSchema,
  description: descriptionSchema,
});

export const createProjectRoleSchema = z.object({
  key: keySchema,
  name: nameSchema,
  description: descriptionSchema,
  sortOrder: sortOrderSchema,
});

export const updateProjectRoleSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    sortOrder: sortOrderSchema,
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const createTaskTypeSchema = z.object({
  key: keySchema,
  name: nameSchema,
  description: descriptionSchema,
  sortOrder: sortOrderSchema,
  isActive: z.boolean().optional(),
  workflowId: z.coerce.number().int().positive().nullable().optional(),
});

export const updateTaskTypeSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    sortOrder: sortOrderSchema,
    isActive: z.boolean().optional(),
    workflowId: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const createWorkflowSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateWorkflowSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const createStatusSchema = z.object({
  name: nameSchema,
  key: keySchema,
  description: descriptionSchema,
  sortOrder: sortOrderSchema,
  category: workflowCategorySchema,
  color: z.string().max(20).nullable().optional(),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
});

export const updateStatusSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    sortOrder: sortOrderSchema,
    category: workflowCategorySchema.optional(),
    color: z.string().max(20).nullable().optional(),
    isInitial: z.boolean().optional(),
    isFinal: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const createTransitionSchema = z.object({
  fromStatusId: z.coerce.number().int().positive(),
  toStatusId: z.coerce.number().int().positive(),
  name: nameSchema,
  isActive: z.boolean().optional(),
});

export const updateTransitionSchema = z
  .object({
    fromStatusId: z.coerce.number().int().positive().optional(),
    toStatusId: z.coerce.number().int().positive().optional(),
    name: nameSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const createApprovalRuleSchema = z.object({
  approverType: approverTypeSchema,
  projectRoleId: z.coerce.number().int().positive().nullable().optional(),
  taskRole: taskRoleSchema.nullable().optional(),
  minApprovals: z.coerce.number().int().min(1),
  onRejectStatusId: z.coerce.number().int().positive(),
});

export const updateApprovalRuleSchema = z
  .object({
    approverType: approverTypeSchema.optional(),
    projectRoleId: z.coerce.number().int().positive().nullable().optional(),
    taskRole: taskRoleSchema.nullable().optional(),
    minApprovals: z.coerce.number().int().min(1).optional(),
    onRejectStatusId: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Cần ít nhất một trường để cập nhật",
  });

export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type DuplicateTemplateInput = z.infer<typeof duplicateTemplateSchema>;
export type CreateProjectRoleInput = z.infer<typeof createProjectRoleSchema>;
export type UpdateProjectRoleInput = z.infer<typeof updateProjectRoleSchema>;
export type CreateTaskTypeInput = z.infer<typeof createTaskTypeSchema>;
export type UpdateTaskTypeInput = z.infer<typeof updateTaskTypeSchema>;
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateTransitionInput = z.infer<typeof createTransitionSchema>;
export type UpdateTransitionInput = z.infer<typeof updateTransitionSchema>;
export type CreateApprovalRuleInput = z.infer<typeof createApprovalRuleSchema>;
export type UpdateApprovalRuleInput = z.infer<typeof updateApprovalRuleSchema>;
