import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { Role } from "@prisma/client";
import { getFileUrl } from "./file.service";

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
    throw new Error("Email đã tồn tại");
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
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Email hoặc mật khẩu không đúng");
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
    throw new Error("Refresh token không tồn tại");
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new Error("Refresh token không hợp lệ");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token đã hết hạn");
  }

  const decoded = verifyRefreshToken(refreshToken);

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
    throw new Error("Refresh token không tồn tại");
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

  const avatarUrl = user?.profile?.avatarKey
    ? await getFileUrl(user.profile.avatarKey)
    : null;

  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl,
  };
}
