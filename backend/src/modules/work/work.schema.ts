import { z } from "zod";

export const myTaskListQuerySchema = z.object({
  scope: z.enum(["mine", "assigned"]).default("mine"),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : undefined)),
  projectId: z.coerce.number().int().positive().optional(),
  role: z.enum(["ASSIGNEE", "REVIEWER", "REPORTER"]).optional(),
  due: z.enum(["overdue", "today", "week", "none"]).optional(),
});

export type MyTaskListQuery = z.infer<typeof myTaskListQuerySchema>;
