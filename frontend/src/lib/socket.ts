import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_BASE_URL_BACKEND || "http://localhost:8080";

let socket: Socket | null = null;
let currentToken: string | null = null;

const readTokenFromStorage = (): string | null => {
  const raw = localStorage.getItem("auth-storage");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
};

/**
 * Lấy hoặc tạo socket. Nếu token thay đổi (vd: refresh token),
 * socket sẽ được tạo lại để re-auth với token mới.
 */
export const connectSocket = (token?: string | null): Socket | null => {
  const accessToken = token ?? readTokenFromStorage();
  if (!accessToken) {
    return null;
  }

  if (socket && socket.connected && currentToken === accessToken) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = accessToken;

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
};
