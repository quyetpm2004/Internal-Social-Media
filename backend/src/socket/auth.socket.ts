import { authenticateAccessToken } from "@/shared/utils/authenticate";
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

export const socketAuthMiddleware = async (
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Unauthorized: missing token"));
    }

    socket.data.user = await authenticateAccessToken(token);
    return next();
  } catch (error) {
    console.warn(
      "Socket auth failed:",
      error instanceof Error ? error.message : error,
    );
    return next(new Error("Unauthorized: invalid token"));
  }
};
