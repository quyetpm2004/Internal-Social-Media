import { axiosClient } from "@/lib/axios";
import type {
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  RegisterPayload,
  RegisterResponse,
  UserPublicInfo,
} from "@/features/auth/types/auth.type";
import type { ApiResponse } from "@/types/api.type";

const skipRefreshConfig = {
  skipAuthRefresh: true,
} as unknown as Parameters<typeof axiosClient.post>[2];

export const authApi = {
  register(payload: RegisterPayload) {
    return axiosClient.post<ApiResponse<RegisterResponse>>(
      "/auth/register",
      payload,
      skipRefreshConfig,
    );
  },

  login(payload: LoginPayload) {
    return axiosClient.post<ApiResponse<LoginResponse>>("/auth/login", payload);
  },

  refreshToken() {
    return axiosClient.post<ApiResponse<RefreshTokenResponse>>(
      "/auth/refresh-token",
      {},
      skipRefreshConfig,
    );
  },

  logout() {
    return axiosClient.post("/auth/logout", {}, skipRefreshConfig);
  },

  getMe() {
    return axiosClient.get<ApiResponse<UserPublicInfo>>("/auth/me");
  },

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    return axiosClient.post<ApiResponse<null>>(
      "/auth/change-password",
      payload,
    );
  },

  forgotPassword(email: string) {
    return axiosClient.post<
      ApiResponse<{
        ok: boolean;
        resetToken?: string;
        expiresAt?: string;
      }>
    >("/auth/forgot-password", { email });
  },

  resetPassword(payload: {
    token: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    return axiosClient.post<ApiResponse<null>>("/auth/reset-password", payload);
  },

  verifyResetToken(token: string) {
    return axiosClient.get<ApiResponse<null>>(
      `/auth/verify-reset-token/${token}`,
    );
  },
};
