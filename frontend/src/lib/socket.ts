import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_BASE_URL_BACKEND || "http://localhost:8080";

let socket: Socket | null = null;
let currentToken: string | null = null;
let manualDisconnect = false;
let opening = false;
let staleTokenRecoveries = 0;
let refreshRejected = false;

const readTokenFromStorage = (): string | null => {
  const raw = localStorage.getItem("auth-storage");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const token = parsed?.state?.accessToken;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
};

const isAccessTokenExpired = (token: string): boolean => {
  try {
    const segment = token.split(".")[1];
    if (!segment) return false;
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now() + 15_000;
  } catch {
    return false;
  }
};

const isAuthConnectError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return message.includes("unauthorized") || message.includes("jwt");
};

const forceLogout = async () => {
  const { useAuthStore } = await import("@/features/auth/store/auth.store");
  useAuthStore.getState().clearAuth();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
};

const openSocket = () => {
  if (!socket || manualDisconnect || socket.connected || opening) return;
  opening = true;
  socket.io.opts.reconnection = true;
  socket.connect();
};

const resolveHandshakeToken = async (): Promise<string> => {
  let token = currentToken ?? readTokenFromStorage();
  if (!token || !isAccessTokenExpired(token)) {
    return token ?? "";
  }

  const { refreshAccessToken } = await import("@/lib/refresh-access-token");
  token = await refreshAccessToken();
  currentToken = token;
  return token;
};

/**
 * Ghi token mới cho lần handshake sau. Không đứt socket đang kết nối.
 */
export const syncSocketAuth = (token: string): void => {
  currentToken = token;
};

/**
 * Một socket dùng chung cho chat và notification.
 * `null` nghĩa là chưa có token (store chưa hydrate), không lấy token cũ trong storage.
 */
export const connectSocket = (token?: string | null): Socket | null => {
  const accessToken = token === undefined ? readTokenFromStorage() : token;
  if (!accessToken) {
    return null;
  }

  currentToken = accessToken;
  manualDisconnect = false;

  if (!socket) {
    staleTokenRecoveries = 0;
    socket = io(SOCKET_URL, {
      auth: (cb) => {
        void resolveHandshakeToken()
          .then((nextToken) => {
            cb({ token: nextToken });
          })
          .catch(async (error) => {
            const { isRefreshRejected } = await import(
              "@/lib/refresh-access-token"
            );
            if (isRefreshRejected(error)) {
              refreshRejected = true;
              cb({ token: "" });
              return;
            }
            cb({ token: currentToken ?? "" });
          });
      },
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      opening = false;
      staleTokenRecoveries = 0;
      refreshRejected = false;
    });

    socket.on("connect_error", (error: Error) => {
      opening = false;
      if (manualDisconnect || !socket || !isAuthConnectError(error)) return;

      if (refreshRejected || staleTokenRecoveries >= 1) {
        socket.io.opts.reconnection = false;
        void forceLogout();
        return;
      }

      staleTokenRecoveries += 1;
      socket.io.opts.reconnection = false;

      void (async () => {
        try {
          const { refreshAccessToken } = await import(
            "@/lib/refresh-access-token"
          );
          currentToken = await refreshAccessToken();
          openSocket();
        } catch (refreshError) {
          const { isRefreshRejected } = await import(
            "@/lib/refresh-access-token"
          );
          if (isRefreshRejected(refreshError) || manualDisconnect) {
            void forceLogout();
            return;
          }
          staleTokenRecoveries = 0;
          openSocket();
        }
      })();
    });
  }

  openSocket();
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  manualDisconnect = true;
  opening = false;
  staleTokenRecoveries = 0;
  refreshRejected = false;
  if (socket) {
    socket.io.opts.reconnection = false;
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    disconnectSocket();
  });
}
