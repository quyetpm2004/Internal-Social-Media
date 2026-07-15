import prisma from "@/shared/utils/prisma";

const profileWithUserSelect = {
  bio: true,
  phone: true,
  gender: true,
  birthdate: true,
  address: true,
  avatarKey: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      departmentId: true,
      positionId: true,
    },
  },
} as const;

export type UpdateUserProfileData = {
  fullName?: string;
  email?: string;
  departmentId?: number | null;
  positionId?: number | null;
  profile: {
    bio?: string | null;
    phone?: string | null;
    address?: string | null;
    gender?: string | null;
    birthdate?: Date | null;
  };
};

export const findProfileByUserId = (userId: number) =>
  prisma.profile.findUnique({
    where: { userId },
    select: profileWithUserSelect,
  });

export const findUserWithProfile = (userId: number) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const updateUserWithProfile = (
  userId: number,
  data: UpdateUserProfileData,
) =>
  prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      email: data.email,
      departmentId: data.departmentId,
      positionId: data.positionId,
      profile: {
        upsert: {
          create: {
            bio: data.profile.bio,
            phone: data.profile.phone,
            address: data.profile.address,
            gender: data.profile.gender,
            birthdate: data.profile.birthdate,
          },
          update: {
            bio: data.profile.bio,
            phone: data.profile.phone,
            address: data.profile.address,
            gender: data.profile.gender,
            birthdate: data.profile.birthdate,
          },
        },
      },
    },
    include: {
      profile: true,
    },
  });

export const findAvatarKeyByUserId = (userId: number) =>
  prisma.profile.findUnique({
    where: { userId },
    select: { avatarKey: true },
  });

export const clearAvatarKey = (userId: number) =>
  prisma.profile.update({
    where: { userId },
    data: { avatarKey: null },
  });
