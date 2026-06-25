import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(1, "Không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  departmentId: z.number().optional(),
  positionId: z.number().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.enum(["Nam", "Nữ", "Khác"]).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
