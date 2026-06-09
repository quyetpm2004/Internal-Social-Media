import type { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisPubSub, isRedisEnabled } from "@/shared/utils/redis";
import { socketAuthMiddleware } from "@/socket/auth.socket";
import { registerChatHandlers } from "@/socket/chat.socket";
import { getIO, setIO } from "@/socket/io";
import {
  handlePresenceOnConnect,
  registerPresenceHandlers,
} from "@/socket/presence.socket";
import type {
  AppIOServer,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@/socket/types";

export { getIO } from "@/socket/io";
export * from "@/socket/types";
export * from "@/socket/chat.socket";
export * from "@/socket/presence.socket";

export const initSocket = async (
  httpServer: HTTPServer,
): Promise<AppIOServer> => {
  const existing = getIO();
  if (existing) {
    return existing;
  }

  const io = new IOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.URL_FRONTEND,
      credentials: true,
    },
  });

  setIO(io);

  if (isRedisEnabled()) {
    const pubSub = getRedisPubSub();
    if (pubSub) {
      io.adapter(createAdapter(pubSub.pubClient, pubSub.subClient));
      console.log("Socket.IO Redis adapter enabled");
    }
  }

  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    await handlePresenceOnConnect(socket);
    registerChatHandlers(socket);
    registerPresenceHandlers(socket);
  });

  return io;
};
