import prisma from "../utils/prisma";

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  gender?: string;
  address?: string;
  birthDate?: string | Date;
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
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error("Hồ sơ không tồn tại");
  }

  return profile;
}

export async function updateProfile(userId: number, data: UpdateProfileInput) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error("Email đã được sử dụng bởi người dùng khác");
    }
  }

  const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      email: data.email,
      avatarUrl: data.avatarUrl,
      profile: {
        upsert: {
          create: {
            bio: data.bio,
            phone: data.phone,
            address: data.address,
            gender: data.gender,
            birthDate: birthDate,
          },
          update: {
            bio: data.bio,
            phone: data.phone,
            address: data.address,
            gender: data.gender,
            birthDate: birthDate,
          },
        },
      },
    },
    include: {
      profile: true,
    },
  });

  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}
