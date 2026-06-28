import { z } from "zod";

const registerGenderSchema = z.enum(["Nam", "Nữ", "Khác"], {
  message: "Giới tính không hợp lệ",
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Họ tên không được để trống"),
    email: z.string().trim().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(1, "Xác nhận mật khẩu không được để trống"),
    phone: z
      .string()
      .trim()
      .min(9, "Số điện thoại phải có ít nhất 9 ký tự")
      .max(15, "Số điện thoại không hợp lệ"),
    gender: registerGenderSchema,
    birthdate: z
      .string()
      .trim()
      .min(1, "Ngày sinh không được để trống")
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Ngày sinh không hợp lệ",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Xác nhận mật khẩu không khớp",
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại không được để trống"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmNewPassword: z
      .string()
      .min(1, "Xác nhận mật khẩu không được để trống"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Xác nhận mật khẩu không khớp",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Token không hợp lệ"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmNewPassword: z
      .string()
      .min(1, "Xác nhận mật khẩu không được để trống"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Xác nhận mật khẩu không khớp",
  });

export const verifyTokenPasswordResetSchema = z.object({
  token: z.string().trim().min(1, "Token không hợp lệ"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyTokenPasswordResetInput = z.infer<
  typeof verifyTokenPasswordResetSchema
>;
