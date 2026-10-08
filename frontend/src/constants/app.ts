export const APP_CONFIG = {
  appName: "CollabNet",
  apiUrl: import.meta.env.VITE_BASE_URL_BACKEND
    ? `${import.meta.env.VITE_BASE_URL_BACKEND}/api`
    : "http://localhost:8080/api",
  accessTokenKey: "access_token",
};

export const DEFAULT_COVER =
  "https://thegoldengroup.vn/uploads/danhmuc/m-a-1626418198-m5tue.jpg";
