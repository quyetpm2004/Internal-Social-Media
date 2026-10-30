import { z } from "zod";
import {
  taskChildSchema,
  taskDateSchema,
} from "@/modules/project/project.schema";

export const departmentTaskParamsSchema = z.object({
  taskId: z.coerce.number().int().positive("ID công việc không hợp lệ"),
});

export const saveDepartmentTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên không được để trống")
    .max(200, "Tên tối đa 200 ký tự"),
  description: z.string().max(20000, "Mô tả tối đa 20000 ký tự").nullable(),
  statusId: z
    .number()
    .int()
    .positive("Trạng thái không hợp lệ")
    .nullable()
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  startDate: taskDateSchema.nullable(),
  dueDate: taskDateSchema.nullable(),
  estimatedMinutes: z.number().int().min(0).max(1_000_000).nullable(),
  parentTaskId: z.number().int().positive().nullable(),
  assigneeId: z.number().int().positive().nullable(),
  children: z
    .array(taskChildSchema)
    .max(20, "Tối đa 20 việc con mỗi lần")
    .default([]),
  attachmentIds: z
    .array(z.number().int().positive())
    .max(20, "Tối đa 20 tệp đính kèm")
    .optional(),
});

export const updateDepartmentTaskStatusSchema = z.object({
  statusId: z.number().int().positive("Trạng thái không hợp lệ"),
});

const configStatusSchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z
    .string()
    .trim()
    .min(1, "Trạng thái không được để trống tên")
    .max(150, "Tên trạng thái tối đa 150 ký tự"),
  category: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Màu không hợp lệ")
    .nullable(),
  isInitial: z.boolean(),
  isFinal: z.boolean(),
});

export const saveDepartmentTaskConfigSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên quy trình")
    .max(150, "Tên quy trình tối đa 150 ký tự"),
  description: z
    .string()
    .trim()
    .max(300, "Mô tả tối đa 300 ký tự")
    .nullable()
    .optional(),
  statuses: z
    .array(configStatusSchema)
    .min(1, "Cần ít nhất một trạng thái")
    .max(30, "Tối đa 30 trạng thái"),
});

export type DepartmentTaskParams = z.infer<typeof departmentTaskParamsSchema>;
export type SaveDepartmentTaskInput = z.infer<typeof saveDepartmentTaskSchema>;
export type UpdateDepartmentTaskStatusInput = z.infer<
  typeof updateDepartmentTaskStatusSchema
>;
export type SaveDepartmentTaskConfigInput = z.infer<
  typeof saveDepartmentTaskConfigSchema
>;
