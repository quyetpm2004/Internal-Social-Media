import { axiosClient } from "@/lib/axios";
import type {
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  UserPublicInfo,
} from "@/features/auth/types/auth.type";
import type { ApiResponse } from "@/types/api.type";

export const authApi = {
  login(payload: LoginPayload) {
    return axiosClient.post<ApiResponse<LoginResponse>>("/auth/login", payload);
  },

  refreshToken() {
    return axiosClient.post<ApiResponse<RefreshTokenResponse>>(
      "/auth/refresh-token",
      {},
      {
        skipAuthRefresh: true,
      } as any,
    );
  },

  logout() {
    return axiosClient.post("/auth/logout", {}, {
      skipAuthRefresh: true,
    } as any);
  },

  getMe() {
    return axiosClient.get<ApiResponse<UserPublicInfo>>("/auth/me");
  },
};
