export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  gender: "Nam" | "Nữ" | "Khác";
  birthdate: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    status: "PENDING";
    createdAt: string;
  };
  requiresApproval: true;
}

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
