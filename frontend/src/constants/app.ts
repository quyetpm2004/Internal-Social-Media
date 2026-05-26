export const APP_CONFIG = {
  appName: "CollabNet",
  apiUrl:
    import.meta.env.VITE_BASE_URL_BACKEND + "/api" ||
    "http://localhost:8080/api",
  accessTokenKey: "access_token",
};
