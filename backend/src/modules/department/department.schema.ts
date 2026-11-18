import { z } from "zod";

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

const searchField = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value : undefined));

const projectIdField = z.coerce.number().int().positive().optional();

export const memberListQuerySchema = z.object({
  ...paginationFields,
  search: searchField,
  projectId: projectIdField,
  period: z.enum(["week", "month", "quarter"]).default("month"),
  sort: z.enum(["default", "kpi", "load", "overdue"]).default("default"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const memberTaskListQuerySchema = z.object({
  ...paginationFields,
  projectId: projectIdField,
});

export const candidateListQuerySchema = z.object({
  ...paginationFields,
  search: searchField,
});

export const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  positionId: z.number().int().positive().nullable().optional(),
});

export const updateMemberSchema = z.object({
  positionId: z.number().int().positive().nullable(),
});

export const departmentIdParamsSchema = z.object({
  departmentId: z.coerce.number().int().positive("departmentId không hợp lệ"),
});

export const memberParamsSchema = departmentIdParamsSchema.extend({
  userId: z.coerce.number().int().positive("userId không hợp lệ"),
});

const descriptionField = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((value) => (value ? value : null));

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Tên phòng ban không được để trống").max(100),
  description: descriptionField,
});

export const updateDepartmentSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: descriptionField.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Không có dữ liệu để cập nhật",
  });

export const appointManagerSchema = z.object({
  userId: z.number().int().positive(),
});

export const transferMemberSchema = z.object({
  toDepartmentId: z.number().int().positive(),
});

export type MemberListQuery = z.infer<typeof memberListQuerySchema>;
export type MemberTaskListQuery = z.infer<typeof memberTaskListQuerySchema>;
export type CandidateListQuery = z.infer<typeof candidateListQuerySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type AppointeeListQuery = CandidateListQuery;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type AppointManagerInput = z.infer<typeof appointManagerSchema>;
export type TransferMemberInput = z.infer<typeof transferMemberSchema>;
