import { z } from "zod";

export const userIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive("ID người dùng không hợp lệ"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  bio: z.string().nullish(),
  phone: z.string().nullish(),
  gender: z.string().nullish(),
  address: z.string().nullish(),
  birthdate: z.union([z.string(), z.date()]).nullish(),
  departmentId: z.union([z.string(), z.number()]).nullish(),
  positionId: z.union([z.string(), z.number()]).nullish(),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
