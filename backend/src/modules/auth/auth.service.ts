import dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/shared/utils/jwt";
import { getFileUrl } from "@/modules/file/file.service";
import { sendResetPasswordEmail } from "./email.service";
import * as authRepo from "@/modules/auth/auth.repository";

dotenv.config();

function generateTokens(payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

function assertUserCanAuthenticate(user: { status: Status }) {
  if (user.status === Status.PENDING) {
    throw new AppError(403, "Tài khoản đang chờ admin duyệt");
  }

  if (user.status === Status.INACTIVE) {
    throw new AppError(403, "Tài khoản đã bị khóa");
  }
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  profile: { phone: string; gender: string; birthdate: string },
) {
  const existingUser = await authRepo.findUserByEmail(email);

  if (existingUser) {
    if (existingUser.status === Status.PENDING) {
      throw new AppError(400, "Email đã được đăng ký và đang chờ admin duyệt");
    }

    throw new AppError(400, "Email đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const birthdate = new Date(profile.birthdate);

  const user = await authRepo.createUser({
    fullName,
    email,
    password: hashedPassword,
    profile: {
      phone: profile.phone,
      gender: profile.gender,
      birthdate,
    },
  });

  return {
    user,
    requiresApproval: true,
  };
}

export async function login(email: string, password: string) {
  const user = await authRepo.findUserByEmail(email);

  if (!user) {
    throw new AppError(401, "Email hoặc mật khẩu không đúng");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(401, "Email hoặc mật khẩu không đúng");
  }

  assertUserCanAuthenticate(user);

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };

  const tokens = generateTokens(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await authRepo.createRefreshToken({
    token: tokens.refreshToken,
    expiresAt,
    userId: user.id,
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

  const storedToken = await authRepo.findRefreshTokenWithUser(refreshToken);

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

  assertUserCanAuthenticate(storedToken.user);

  const payload: JwtPayload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    fullName: decoded.fullName,
  };

  const tokens = generateTokens(payload);

  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  await authRepo.deleteRefreshTokenById(storedToken.id);

  await authRepo.createRefreshToken({
    token: tokens.refreshToken,
    expiresAt: newExpiresAt,
    userId: storedToken.user.id,
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

  await authRepo.deleteRefreshTokensByToken(refreshToken);

  return true;
}

export async function getMe(userId: number) {
  const user = await authRepo.findUserByIdWithAvatar(userId);

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
  const user = await authRepo.findUserPasswordById(userId);

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

  await authRepo.changePasswordAndRevokeTokens(userId, hashedPassword);

  return true;
}

export async function forgotPassword(email: string) {
  const user = await authRepo.findUserEmailByEmail(email);

  if (!user) {
    return { ok: true };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await authRepo.createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetLink = `${process.env.URL_FRONTEND}/reset-password/${rawToken}`;

  await sendResetPasswordEmail(email, resetLink);

  return {
    ok: true,
    resetToken: rawToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifyTokenPasswordReset(token: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const resetToken = await authRepo.findValidPasswordResetToken(tokenHash, now);

  if (!resetToken) {
    throw new AppError(
      400,
      "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
    );
  }

  return {
    ok: true,
    userId: resetToken.user.id,
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const resetToken = await authRepo.findValidPasswordResetToken(tokenHash, now);

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

  await authRepo.resetPasswordAndMarkTokenUsed({
    userId: resetToken.user.id,
    resetTokenId: resetToken.id,
    hashedPassword,
    usedAt: now,
  });

  return true;
}
