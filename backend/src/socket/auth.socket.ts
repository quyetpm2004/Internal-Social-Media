import { verifyAccessToken } from "@/shared/utils/jwt";
import type { AppSocket } from "@/socket/types";

export const extractToken = (socket: AppSocket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }

  const header = socket.handshake.headers.authorization;
  if (
    typeof header === "string" &&
    header.toLowerCase().startsWith("bearer ")
  ) {
    return header.slice(7);
  }

  return null;
};

export const socketAuthMiddleware = (
  socket: AppSocket,
  next: (err?: Error) => void,
): void => {
  try {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Unauthorized: missing token"));
    }

    const decoded = verifyAccessToken(token);
    socket.data.user = decoded;
    return next();
  } catch (error) {
    console.warn(
      "Socket auth failed:",
      error instanceof Error ? error.message : error,
    );
    return next(new Error("Unauthorized: invalid token"));
  }
};
