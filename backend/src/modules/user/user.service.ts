import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "@/shared/errors/app-error";
import { s3 } from "@/shared/lib/s3";
import { getFileUrl } from "@/modules/file/file.service";
import type { UpdateProfileInput } from "@/modules/user/user.schema";
import {
  mapProfile,
  mapUpdatedUser,
  mapUpdateProfileData,
} from "@/modules/user/user.mapper";
import * as userRepo from "@/modules/user/user.repository";

const AVATAR_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function getProfile(userId: number) {
  const profile = await userRepo.findProfileByUserId(userId);

  if (!profile) {
    throw new AppError(404, "Hồ sơ không tồn tại");
  }

  const avatarUrl = profile.avatarKey
    ? await getFileUrl(profile.avatarKey, AVATAR_URL_TTL_SECONDS)
    : null;

  return mapProfile(profile, avatarUrl);
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

  const updatedUser = await userRepo.updateUserWithProfile(
    userId,
    mapUpdateProfileData(data),
  );

  return mapUpdatedUser(updatedUser);
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
