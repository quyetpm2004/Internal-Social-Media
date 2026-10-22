import axios, { isAxiosError } from "axios";
import { APP_CONFIG } from "@/constants/app";
import { useAuthStore } from "@/features/auth/store/auth.store";

export const isRefreshRejected = (error: unknown): boolean =>
  isAxiosError(error) &&
  (error.response?.status === 401 || error.response?.status === 403);

let pendingRefresh: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const response = await axios.post(
    `${APP_CONFIG.apiUrl}/auth/refresh-token`,
    {},
    { withCredentials: true },
  );

  const accessToken = response.data?.data?.accessToken;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Access token không hợp lệ");
  }

  useAuthStore.getState().setAccessToken(accessToken);
  return accessToken;
}

/** Một refresh đang chạy thì caller sau dùng chung promise, tránh rotate refresh token hai lần. */
export function refreshAccessToken(): Promise<string> {
  if (!pendingRefresh) {
    pendingRefresh = requestNewAccessToken().finally(() => {
      pendingRefresh = null;
    });
  }

  return pendingRefresh;
}
