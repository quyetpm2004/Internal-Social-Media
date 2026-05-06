import { s3 } from "../lib/s3";
import prisma from "../utils/prisma";
import { getFileUrl } from "./file.service";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  bio?: string;
  phone?: string;
  gender?: string;
  address?: string;
  birthdate?: string | Date;
  departmentId?: string;
  positionId?: string;
}

export async function getProfile(userId: number) {
  const profile = await prisma.profile.findUnique({
    where: {
      userId: userId,
    },
    select: {
      bio: true,
      phone: true,
      gender: true,
      birthdate: true,
      address: true,
      avatarKey: true,
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
          departmentId: true,
          positionId: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error("Hồ sơ không tồn tại");
  }

  // 🔥 tạo presigned URL nếu có avatar
  const avatarUrl = profile.avatarKey
    ? await getFileUrl(profile.avatarKey)
    : null;

  return {
    fullName: profile.user.fullName,
    email: profile.user.email,
    role: profile.user.role,
    bio: profile.bio,
    phone: profile.phone,
    gender: profile.gender,
    birthdate: profile.birthdate,
    address: profile.address,
    avatarUrl,
    departmentId: profile.user.departmentId,
    positionId: profile.user.positionId,
  };
}

export async function updateProfile(userId: number, data: UpdateProfileInput) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  // Kiểm tra nếu email mới khác với email hiện tại
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error("Email đã được sử dụng bởi người dùng khác");
    }
  }

  const birthdate = data.birthdate ? new Date(data.birthdate) : undefined;

  // Cập nhật thông tin người dùng và hồ sơ cá nhân
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      email: data.email,
      departmentId: data.departmentId ? parseInt(data.departmentId) : undefined,
      positionId: data.positionId ? parseInt(data.positionId) : undefined,
      profile: {
        upsert: {
          create: {
            bio: data.bio,
            phone: data.phone,
            address: data.address,
            gender: data.gender,
            birthdate: birthdate,
          },
          update: {
            bio: data.bio,
            phone: data.phone,
            address: data.address,
            gender: data.gender,
            birthdate: birthdate,
          },
        },
      },
    },
    include: {
      profile: true,
    },
  });

  return {
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    role: updatedUser.role,
    bio: updatedUser.profile?.bio,
    phone: updatedUser.profile?.phone,
    gender: updatedUser.profile?.gender,
    birthdate: updatedUser.profile?.birthdate,
    address: updatedUser.profile?.address,
    departmentId: updatedUser.departmentId,
    positionId: updatedUser.positionId,
  };
}

export async function deleteAvatar(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: {
      userId: +userId,
    },
  });

  if (!profile?.avatarKey) {
    throw new Error("AVATAR_NOT_FOUND");
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: profile.avatarKey,
    }),
  );

  await prisma.profile.update({
    where: {
      userId: +userId,
    },
    data: {
      avatarKey: null,
    },
  });

  return {
    success: true,
  };
}
