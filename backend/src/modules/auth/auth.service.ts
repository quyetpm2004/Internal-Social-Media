import bcrypt from "bcrypt";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/shared/utils/jwt";
import { getFileUrl } from "@/modules/file/file.service";

function generateTokens(payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  role?: Role,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(400, "Email đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      role: role || Role.EMPLOYEE,
    },
  });

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };

  const tokens = generateTokens(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      expiresAt,
      userId: user.id,
    },
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, "Email hoặc mật khẩu không đúng");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(401, "Email hoặc mật khẩu không đúng");
  }

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };

  const tokens = generateTokens(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      expiresAt,
      userId: user.id,
    },
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function refresh(refreshToken: string) {
  if (!refreshToken) {
    throw new AppError(401, "Refresh token không tồn tại");
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, "Refresh token không hợp lệ");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token đã hết hạn");
  }

  let decoded: JwtPayload;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Refresh token không hợp lệ");
  }

  const payload: JwtPayload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    fullName: decoded.fullName,
  };

  const tokens = generateTokens(payload);

  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      expiresAt: newExpiresAt,
      userId: storedToken.user.id,
    },
  });

  return {
    user: {
      id: storedToken.user.id,
      fullName: storedToken.user.fullName,
      email: storedToken.user.email,
      role: storedToken.user.role,
    },
    ...tokens,
  };
}

export async function logout(refreshToken: string) {
  if (!refreshToken) {
    throw new AppError(400, "Refresh token không tồn tại");
  }

  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });

  return true;
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          avatarKey: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  const avatarUrl = user.profile?.avatarKey
    ? await getFileUrl(user.profile.avatarKey, 7 * 24 * 60 * 60)
    : null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl,
  };
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(400, "Mật khẩu hiện tại không chính xác");
  }

  const samePassword = await bcrypt.compare(newPassword, user.password);
  if (samePassword) {
    throw new AppError(400, "Mật khẩu mới phải khác mật khẩu hiện tại");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await tx.refreshToken.deleteMany({
      where: { userId },
    });
  });

  return true;
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // Trả cùng message để tránh lộ thông tin email tồn tại/không tồn tại.
  if (!user) {
    return { ok: true };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // TODO: gửi email thật. Hiện trả token để FE/demo sử dụng.
  return {
    ok: true,
    resetToken: rawToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      user: {
        select: {
          id: true,
          password: true,
        },
      },
    },
  });

  if (!resetToken) {
    throw new AppError(
      400,
      "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
    );
  }

  const samePassword = await bcrypt.compare(
    newPassword,
    resetToken.user.password,
  );
  if (samePassword) {
    throw new AppError(400, "Mật khẩu mới phải khác mật khẩu hiện tại");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.user.id },
      data: { password: hashedPassword },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now },
    });

    await tx.refreshToken.deleteMany({
      where: { userId: resetToken.user.id },
    });
  });

  return true;
}
