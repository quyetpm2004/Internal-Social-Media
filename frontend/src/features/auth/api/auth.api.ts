import { axiosClient } from "@/lib/axios";
import type {
  LoginPayload,
  LoginResponse,
  RefreshTokenResponse,
  UserPublicInfo,
} from "@/features/auth/types/auth.type";

export const authApi = {
  login(payload: LoginPayload) {
    return axiosClient.post<LoginResponse>("/auth/login", payload);
  },

  refreshToken() {
    return axiosClient.post<RefreshTokenResponse>("/auth/refresh-token", {}, {
      skipAuthRefresh: true,
    } as any);
  },

  logout() {
    return axiosClient.post("/auth/logout", {}, {
      skipAuthRefresh: true,
    } as any);
  },

  getMe() {
    return axiosClient.get<UserPublicInfo>("/auth/me");
  },
};
