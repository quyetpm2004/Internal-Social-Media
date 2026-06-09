import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên không được để trống"),
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  role: z.nativeEnum(Role).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
