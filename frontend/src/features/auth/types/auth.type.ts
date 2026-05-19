export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserPublicInfo;
}

export interface RefreshTokenResponse {
  accessToken: string;
  user: UserPublicInfo;
}

export interface UserPublicInfo {
  id: number;
  fullName: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN" | "MANAGER";
  avatarUrl?: string;
}
