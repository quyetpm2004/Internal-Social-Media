import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { APP_CONFIG } from "@/constants/app";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { CustomAxiosInstance } from "@/types/axios.type";

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
}

export const axiosClient = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
}) as CustomAxiosInstance;

// request interceptor to add access token to headers
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const persistedData = localStorage.getItem("auth-storage");

    let token = null;
    if (persistedData) {
      try {
        const parsed = JSON.parse(persistedData);
        token = parsed?.state?.accessToken || null; // 👈 lấy đúng token
      } catch (e) {
        console.error("❌ Lỗi parse auth_storage:", e);
      }
    }

    // Thêm header Authorization nếu có token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// response interceptor để xử lý lỗi 401 và tự động refresh token khi cần thiết
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const { setAccessToken, clearAuth } = useAuthStore.getState();

    const originalRequest = error.config as AxiosRequestConfig | undefined;

    // Nếu không có request gốc, trả về lỗi luôn
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Lấy status code của response
    const status = error.response?.status;

    // Kiểm tra có nên bỏ qua refresh token không:
    // - Nếu request có flag skipAuthRefresh
    // - Hoặc là các endpoint liên quan đến auth (login, refresh, logout)
    const shouldSkip =
      originalRequest.skipAuthRefresh ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout");

    // Nếu không phải lỗi 401 hoặc nên bỏ qua, trả về lỗi luôn
    if (status !== 401 || shouldSkip) {
      return Promise.reject(error);
    }

    // Nếu request đã retry rồi mà vẫn lỗi, xóa token và chuyển về trang login
    if (originalRequest._retry) {
      clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Nếu đang có 1 request refresh token khác đang chạy, đợi kết quả rồi retry lại request này sau
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newAccessToken: string) => {
            // Khi có token mới, gắn vào header và gửi lại request gốc
            if (!originalRequest.headers) {
              originalRequest.headers = {};
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(axiosClient(originalRequest));
          },
          reject,
        });
      });
    }

    // Đánh dấu request này đã retry và bắt đầu refresh token
    originalRequest._retry = true;
    isRefreshing = true;

    // Thử gọi API refresh token
    try {
      const response = await axios.post(
        `${APP_CONFIG.apiUrl}/auth/refresh-token`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // Lấy access token mới từ response
      const newAccessToken = response.data.data.accessToken;

      // Lưu lại access token mới vào storage
      setAccessToken(newAccessToken);

      // Xử lý lại các request đang chờ refresh token
      processQueue(null, newAccessToken);

      // Gắn access token mới vào header của request gốc
      if (!originalRequest.headers) {
        originalRequest.headers = {};
      }
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Gửi lại request gốc với token mới
      return axiosClient(originalRequest);
    } catch (refreshError) {
      // Nếu refresh token thất bại, clear token và chuyển về trang login
      processQueue(refreshError, null);
      clearAuth();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      // Đánh dấu đã xong quá trình refresh
      isRefreshing = false;
    }
  },
);
