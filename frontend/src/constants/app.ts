export const APP_CONFIG = {
  appName: "CollabNet",
  apiUrl:
    import.meta.env.VITE_BASE_URL_BACKEND + "/api" ||
    "http://localhost:8080/api",
  accessTokenKey: "access_token",
};

export const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80";
