import type { Role } from "@prisma/client";
import type { UpdateProfileInput } from "@/modules/user/user.schema";
import type { UpdateUserProfileData } from "@/modules/user/user.repository";

type ProfileUserRow = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  departmentId: number | null;
  positionId: number | null;
};

type ProfileWithUserRow = {
  bio: string | null;
  phone: string | null;
  gender: string | null;
  birthdate: Date | null;
  address: string | null;
  user: ProfileUserRow;
};

type UpdatedUserRow = {
  fullName: string;
  email: string;
  role: Role;
  departmentId: number | null;
  positionId: number | null;
  profile: {
    bio: string | null;
    phone: string | null;
    gender: string | null;
    birthdate: Date | null;
    address: string | null;
  } | null;
};

export function mapProfile(profile: ProfileWithUserRow, avatarUrl: string | null) {
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

export function mapUpdatedUser(user: UpdatedUserRow) {
  return {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    bio: user.profile?.bio,
    phone: user.profile?.phone,
    gender: user.profile?.gender,
    birthdate: user.profile?.birthdate,
    address: user.profile?.address,
    departmentId: user.departmentId,
    positionId: user.positionId,
  };
}

export function mapUpdateProfileData(
  data: UpdateProfileInput,
): UpdateUserProfileData {
  return {
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
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
    },
  };
}
