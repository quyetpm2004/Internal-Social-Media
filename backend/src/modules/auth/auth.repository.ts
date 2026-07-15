import { Role, Status } from "@prisma/client";
import prisma from "@/shared/utils/prisma";

const registerUserSelect = {
  id: true,
  fullName: true,
  email: true,
  status: true,
  createdAt: true,
  profile: {
    select: {
      phone: true,
      gender: true,
      birthdate: true,
    },
  },
} as const;

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findUserByIdWithAvatar = (userId: number) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          avatarKey: true,
        },
      },
    },
  });

export const findUserPasswordById = (userId: number) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

export const findUserEmailByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

export const createUser = (data: {
  fullName: string;
  email: string;
  password: string;
  profile: { phone: string; gender: string; birthdate: Date };
}) =>
  prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: Role.EMPLOYEE,
      status: Status.PENDING,
      profile: {
        create: {
          phone: data.profile.phone,
          gender: data.profile.gender,
          birthdate: data.profile.birthdate,
        },
      },
    },
    select: registerUserSelect,
  });

export const createRefreshToken = (data: {
  token: string;
  expiresAt: Date;
  userId: number;
}) =>
  prisma.refreshToken.create({
    data: {
      token: data.token,
      expiresAt: data.expiresAt,
      userId: data.userId,
    },
  });

export const findRefreshTokenWithUser = (token: string) =>
  prisma.refreshToken.findFirst({
    where: { token },
    include: { user: true },
  });

export const deleteRefreshTokenById = (id: number) =>
  prisma.refreshToken.delete({ where: { id } });

export const deleteRefreshTokensByToken = (token: string) =>
  prisma.refreshToken.deleteMany({ where: { token } });

export const createPasswordResetToken = (data: {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}) =>
  prisma.passwordResetToken.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    },
  });

export const findValidPasswordResetToken = (tokenHash: string, now: Date) =>
  prisma.passwordResetToken.findFirst({
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

export const changePasswordAndRevokeTokens = (
  userId: number,
  hashedPassword: string,
) =>
  prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await tx.refreshToken.deleteMany({
      where: { userId },
    });
  });

export const resetPasswordAndMarkTokenUsed = (data: {
  userId: number;
  resetTokenId: number;
  hashedPassword: string;
  usedAt: Date;
}) =>
  prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: data.userId },
      data: { password: data.hashedPassword },
    });

    await tx.passwordResetToken.update({
      where: { id: data.resetTokenId },
      data: { usedAt: data.usedAt },
    });

    await tx.refreshToken.deleteMany({
      where: { userId: data.userId },
    });
  });
