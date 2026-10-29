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

export type MemberListQuery = z.infer<typeof memberListQuerySchema>;
export type MemberTaskListQuery = z.infer<typeof memberTaskListQuerySchema>;
export type CandidateListQuery = z.infer<typeof candidateListQuerySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
