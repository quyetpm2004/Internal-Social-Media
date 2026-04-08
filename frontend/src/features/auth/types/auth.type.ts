import type { UserProfile } from "@/features/profile/types/profile.type";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
