import type { Server as HTTPServer } from "http";
import { Server as IOServer, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { verifyAccessToken, type JwtPayload } from "../utils/jwt";
import prisma from "../utils/prisma";
import { getRedisPubSub, isRedisEnabled } from "../utils/redis";
import * as presenceService from "../services/redis/presence.service";

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

export interface PresenceSnapshotPayload {
  onlineUserIds: number[];
}

export type MembersUpdatedAction = "added" | "removed" | "left";

export interface MembersUpdatedPayload {
  conversationId: number;
  action: MembersUpdatedAction;
  affectedUserIds: number[];
  actorUserId: number;
}

export interface NotificationNewPayload {
  notification: {
    id: number;
    type: string;
    postId: number | null;
    commentId: number | null;
    groupId: number | null;
    metadata: unknown;
    readAt: Date | null;
    createdAt: Date;
    actor: {
      id: number;
      fullName: string;
      avatarUrl: string | null;
    } | null;
    group: { id: number; groupName: string } | null;
    post: { id: number; snippet: string } | null;
    comment: { id: number; snippet: string } | null;
  };
}

export interface NotificationUnreadCountPayload {
  unreadCount: number;
}

// ---------- Event signatures ----------

interface ServerToClientEvents {
  "message:new": (payload: MessageNewPayload) => void;
  "members:updated": (payload: MembersUpdatedPayload) => void;
  "message:edited": (payload: MessageEditedPayload) => void;
  "message:deleted": (payload: MessageDeletedPayload) => void;
  "read:update": (payload: ReadUpdatePayload) => void;
  "typing:start": (payload: TypingPayload) => void;
  "typing:stop": (payload: TypingPayload) => void;
  "presence:online": (payload: PresencePayload) => void;
  "presence:offline": (payload: PresencePayload) => void;
  "presence:snapshot": (payload: PresenceSnapshotPayload) => void;
  "notification:new": (payload: NotificationNewPayload) => void;
  "notification:unread-count": (
    payload: NotificationUnreadCountPayload,
  ) => void;
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

let io: AppIOServer | null = null;

const userRoom = (userId: number) => `user:${userId}`;
const conversationRoom = (conversationId: number) =>
  `conversation:${conversationId}`;

// return token from socket handshake
const extractToken = (socket: AppSocket): string | null => {
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

// load conversation ids for user return []
const loadConversationIds = async (userId: number): Promise<number[]> => {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId, leftAt: null },
    select: { conversationId: true },
  });
  return memberships.map((m) => m.conversationId);
};

// load co-member user ids for user return []
const loadCoMemberUserIds = async (
  userId: number,
  conversationIds: number[],
): Promise<number[]> => {
  if (conversationIds.length === 0) return [];

  const members = await prisma.conversationMember.findMany({
    where: {
      conversationId: { in: conversationIds },
      leftAt: null,
      userId: { not: userId },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  return members.map((member) => member.userId);
};

export const initSocket = async (
  httpServer: HTTPServer,
): Promise<AppIOServer> => {
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

  if (isRedisEnabled()) {
    const pubSub = getRedisPubSub();
    if (pubSub) {
      io.adapter(createAdapter(pubSub.pubClient, pubSub.subClient));
      console.log("Socket.IO Redis adapter enabled");
    }
  }

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

    const isFirstConnection = await presenceService.addUserSocket(
      userId,
      socket.id,
    );

    socket.join(userRoom(userId));

    try {
      const conversationIds = await loadConversationIds(userId);
      conversationIds.forEach((id) => socket.join(conversationRoom(id)));

      // broadcast presence:online to all conversation members if first connection
      // when second connection, it will be broadcasted by conversation:join event
      if (isFirstConnection) {
        conversationIds.forEach((id) => {
          socket.to(conversationRoom(id)).emit("presence:online", { userId });
        });
      }

      const coMemberIds = await loadCoMemberUserIds(userId, conversationIds);
      const onlineUserIds =
        await presenceService.filterOnlineUserIds(coMemberIds);
      socket.emit("presence:snapshot", { onlineUserIds });
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

    // refresh presence TTL every 45 seconds
    const presenceRefreshTimer = setInterval(() => {
      presenceService
        .refreshSocketPresence(userId, socket.id)
        .catch((error) => {
          console.error("Failed to refresh presence TTL:", error);
        });
    }, 45_000);

    socket.on("disconnect", async () => {
      clearInterval(presenceRefreshTimer);

      const wentOffline = await presenceService.removeUserSocket(
        userId,
        socket.id,
      );
      if (!wentOffline) return;

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

/**
 * Buộc user offline: ngắt mọi socket (disconnect handler sẽ broadcast presence:offline).
 */
export const markUserOffline = async (userId: number): Promise<void> => {
  if (!io) return;

  const wasOnline = await presenceService.isUserOnline(userId);
  if (!wasOnline) return;

  await io.in(userRoom(userId)).disconnectSockets(true);
};

export const getIO = (): AppIOServer | null => io;

export const isUserOnline = (userId: number): Promise<boolean> =>
  presenceService.isUserOnline(userId);

export const getOnlineUserIds = (): Promise<number[]> =>
  presenceService.getAllOnlineUserIds();

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

export const leaveUsersFromConversationRoom = (
  userIds: number[],
  conversationId: number,
) => {
  if (!io) return;
  const room = conversationRoom(conversationId);
  for (const userId of userIds) {
    io.in(userRoom(userId)).socketsLeave(room);
  }
};

export const emitMembersUpdated = (payload: MembersUpdatedPayload) => {
  if (!io) return;

  io.to(conversationRoom(payload.conversationId)).emit(
    "members:updated",
    payload,
  );

  const notifyUserIds = new Set([
    ...payload.affectedUserIds,
    payload.actorUserId,
  ]);

  for (const userId of notifyUserIds) {
    io.to(userRoom(userId)).emit("members:updated", payload);
  }
};
