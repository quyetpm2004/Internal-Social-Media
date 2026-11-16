import { Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { AuthUser, verifyAccessToken } from "@/shared/utils/jwt";
import prisma from "@/shared/utils/prisma";

/**
 * Xác thực access token và nạp người dùng từ DB.
 * Role, status và phòng ban luôn lấy từ DB nên đổi role / khóa tài khoản có hiệu lực ngay;
 * tokenVersion khác nhau nghĩa là token đã bị thu hồi.
 */
export async function authenticateAccessToken(
  token: string,
): Promise<AuthUser> {
  const decoded = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      tokenVersion: true,
      departmentId: true,
    },
  });

  if (!user || user.status !== Status.ACTIVE) {
    throw new AppError(401, "Tài khoản không khả dụng");
  }
  if (decoded.tokenVersion !== user.tokenVersion) {
    throw new AppError(401, "Phiên đăng nhập đã bị thu hồi");
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tokenVersion: user.tokenVersion,
    departmentId: user.departmentId,
  };
}
