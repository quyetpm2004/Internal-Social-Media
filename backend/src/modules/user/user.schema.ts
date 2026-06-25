import { z } from "zod";

export const userIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive("ID người dùng không hợp lệ"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.union([z.string(), z.date()]).optional(),
  departmentId: z.number().optional(),
  positionId: z.number().optional(),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
