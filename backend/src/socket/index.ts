import type { Server as HTTPServer } from "http";
import { Server as IOServer, type Socket } from "socket.io";
import { verifyAccessToken, type JwtPayload } from "../utils/jwt";
import prisma from "../utils/prisma";

// ---------- Event payload types ----------

export interface SocketChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  contentType: string;
  content: string;
  status: string;
  editedAt: Date | null;
  createdAt: Date;
  sender: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
  attachments: Array<{
    id: number;
    fileName: string;
    mimeType: string;
    fileSize: number;
    attachmentType: string;
    fileUrl: string | null;
  }>;
}

export interface MessageNewPayload {
  conversationId: number;
  message: SocketChatMessage;
}

export interface MessageEditedPayload {
  conversationId: number;
  message: SocketChatMessage;
}

export interface MessageDeletedPayload {
  conversationId: number;
  messageId: number;
}

export interface ReadUpdatePayload {
  conversationId: number;
  userId: number;
  lastReadAt: string;
}

export interface TypingPayload {
  conversationId: number;
  userId: number;
}

export interface PresencePayload {
  userId: number;
}

// ---------- Event signatures ----------

interface ServerToClientEvents {
  "message:new": (payload: MessageNewPayload) => void;
  "message:edited": (payload: MessageEditedPayload) => void;
  "message:deleted": (payload: MessageDeletedPayload) => void;
  "read:update": (payload: ReadUpdatePayload) => void;
  "typing:start": (payload: TypingPayload) => void;
  "typing:stop": (payload: TypingPayload) => void;
  "presence:online": (payload: PresencePayload) => void;
  "presence:offline": (payload: PresencePayload) => void;
}

interface ClientToServerEvents {
  "typing:start": (payload: { conversationId: number }) => void;
  "typing:stop": (payload: { conversationId: number }) => void;
  "conversation:join": (payload: { conversationId: number }) => void;
  "conversation:leave": (payload: { conversationId: number }) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  user: JwtPayload;
}

type AppIOServer = IOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// ---------- State ----------

// In-memory presence tracking (sẽ thay bằng Redis ở phiên bản sau)
const userIdToSocketIds = new Map<number, Set<string>>();

let io: AppIOServer | null = null;

const userRoom = (userId: number) => `user:${userId}`;
const conversationRoom = (conversationId: number) =>
  `conversation:${conversationId}`;

// ---------- Helpers ----------

const extractToken = (socket: AppSocket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7);
  }

  return null;
};

const loadConversationIds = async (userId: number): Promise<number[]> => {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId, leftAt: null },
    select: { conversationId: true },
  });
  return memberships.map((m) => m.conversationId);
};

// ---------- Init ----------

export const initSocket = (httpServer: HTTPServer): AppIOServer => {
  if (io) {
    return io;
  }

  io = new IOServer<
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

  io.use((socket, next) => {
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
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.user.id;

    // Track presence (last write wins)
    let socketSet = userIdToSocketIds.get(userId);
    if (!socketSet) {
      socketSet = new Set();
      userIdToSocketIds.set(userId, socketSet);
    }
    socketSet.add(socket.id);
    const isFirstConnection = socketSet.size === 1;

    // Personal room cho user → tiện cho emit theo userId
    socket.join(userRoom(userId));

    // Auto-join tất cả conversations user là thành viên
    try {
      const conversationIds = await loadConversationIds(userId);
      conversationIds.forEach((id) => socket.join(conversationRoom(id)));

      if (isFirstConnection) {
        conversationIds.forEach((id) => {
          socket.to(conversationRoom(id)).emit("presence:online", { userId });
        });
      }
    } catch (error) {
      console.error("Failed to auto-join conversations:", error);
    }

    socket.on("conversation:join", async ({ conversationId }) => {
      if (!Number.isInteger(conversationId) || conversationId <= 0) return;

      try {
        const member = await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
        });
        if (!member || member.leftAt) return;

        socket.join(conversationRoom(conversationId));
      } catch (error) {
        console.error("Failed to join conversation room:", error);
      }
    });

    socket.on("conversation:leave", ({ conversationId }) => {
      if (!Number.isInteger(conversationId) || conversationId <= 0) return;
      socket.leave(conversationRoom(conversationId));
    });

    socket.on("typing:start", ({ conversationId }) => {
      if (!Number.isInteger(conversationId) || conversationId <= 0) return;
      socket
        .to(conversationRoom(conversationId))
        .emit("typing:start", { conversationId, userId });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      if (!Number.isInteger(conversationId) || conversationId <= 0) return;
      socket
        .to(conversationRoom(conversationId))
        .emit("typing:stop", { conversationId, userId });
    });

    socket.on("disconnect", async () => {
      const set = userIdToSocketIds.get(userId);
      if (!set) return;

      set.delete(socket.id);
      if (set.size > 0) return;

      userIdToSocketIds.delete(userId);

      try {
        const conversationIds = await loadConversationIds(userId);
        conversationIds.forEach((id) => {
          io?.to(conversationRoom(id)).emit("presence:offline", { userId });
        });
      } catch (error) {
        console.error("Failed to broadcast presence:offline:", error);
      }
    });
  });

  return io;
};

// ---------- Accessors ----------

export const getIO = (): AppIOServer | null => io;

export const isUserOnline = (userId: number): boolean =>
  userIdToSocketIds.has(userId);

export const getOnlineUserIds = (): number[] =>
  Array.from(userIdToSocketIds.keys());

// ---------- Emit helpers (gọi từ controller/service) ----------

export const emitMessageNew = (
  conversationId: number,
  message: SocketChatMessage,
) => {
  io?.to(conversationRoom(conversationId)).emit("message:new", {
    conversationId,
    message,
  });
};

export const emitMessageEdited = (
  conversationId: number,
  message: SocketChatMessage,
) => {
  io?.to(conversationRoom(conversationId)).emit("message:edited", {
    conversationId,
    message,
  });
};

export const emitMessageDeleted = (
  conversationId: number,
  messageId: number,
) => {
  io?.to(conversationRoom(conversationId)).emit("message:deleted", {
    conversationId,
    messageId,
  });
};

export const emitReadUpdate = (
  conversationId: number,
  userId: number,
  lastReadAt: Date,
) => {
  io?.to(conversationRoom(conversationId)).emit("read:update", {
    conversationId,
    userId,
    lastReadAt: lastReadAt.toISOString(),
  });
};

/**
 * Đẩy socket đang online của các user vào room conversation mới được tạo.
 * Dùng khi tạo group/direct conversation để các tab đang mở nhận realtime ngay
 * mà không cần reload.
 */
export const joinUsersToConversationRoom = (
  userIds: number[],
  conversationId: number,
) => {
  if (!io) return;
  const room = conversationRoom(conversationId);
  for (const userId of userIds) {
    io.in(userRoom(userId)).socketsJoin(room);
  }
};
