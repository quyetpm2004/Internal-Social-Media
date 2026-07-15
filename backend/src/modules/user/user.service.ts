import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "@/shared/errors/app-error";
import { s3 } from "@/shared/lib/s3";
import { getFileUrl } from "@/modules/file/file.service";
import type { UpdateProfileInput } from "@/modules/user/user.schema";
import * as userRepo from "@/modules/user/user.repository";

export async function getProfile(userId: number) {
  const profile = await userRepo.findProfileByUserId(userId);

  if (!profile) {
    throw new AppError(404, "Hồ sơ không tồn tại");
  }

  const avatarUrl = profile.avatarKey
    ? await getFileUrl(profile.avatarKey, 7 * 24 * 60 * 60)
    : null;

  return {
    id: profile.user.id,
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
  const existingUser = await userRepo.findUserWithProfile(userId);

  if (!existingUser) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  if (data.email && data.email !== existingUser.email) {
    const emailExists = await userRepo.findUserByEmail(data.email);

    if (emailExists) {
      throw new AppError(400, "Email đã được sử dụng bởi người dùng khác");
    }
  }

  const birthdate = data.birthdate ? new Date(data.birthdate) : undefined;

  const updatedUser = await userRepo.updateUserWithProfile(userId, {
    fullName: data.fullName,
    email: data.email,
    departmentId:
      data.departmentId != null ? Number(data.departmentId) : undefined,
    positionId: data.positionId != null ? Number(data.positionId) : undefined,
    profile: {
      bio: data.bio,
      phone: data.phone,
      address: data.address,
      gender: data.gender,
      birthdate,
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

export async function deleteAvatar(userId: number) {
  const profile = await userRepo.findAvatarKeyByUserId(userId);

  if (!profile?.avatarKey) {
    throw new AppError(404, "Avatar không tồn tại");
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: profile.avatarKey,
    }),
  );

  await userRepo.clearAvatarKey(userId);

  return { success: true };
}
