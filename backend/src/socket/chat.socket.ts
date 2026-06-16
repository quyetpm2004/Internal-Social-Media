import prisma from "@/shared/utils/prisma";
import { getIO } from "@/socket/io";
import { conversationRoom, userRoom } from "@/socket/rooms";
import type {
  AppSocket,
  MembersUpdatedPayload,
  PollVotePayload,
  SocketChatMessage,
} from "@/socket/types";

export const loadConversationIds = async (userId: number): Promise<number[]> => {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId, leftAt: null },
    select: { conversationId: true },
  });
  return memberships.map((m) => m.conversationId);
};

export const emitPollVote = (
  conversationId: number,
  payload: Omit<PollVotePayload, "conversationId">,
) => {
  getIO()?.to(conversationRoom(conversationId)).emit("poll:vote", {
    conversationId,
    ...payload,
  });
};

export const registerChatHandlers = (socket: AppSocket): void => {
  const userId = socket.data.user.id;

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
};

export const emitMessageNew = (
  conversationId: number,
  message: SocketChatMessage,
) => {
  getIO()?.to(conversationRoom(conversationId)).emit("message:new", {
    conversationId,
    message,
  });
};

export const emitMessageEdited = (
  conversationId: number,
  message: SocketChatMessage,
) => {
  getIO()?.to(conversationRoom(conversationId)).emit("message:edited", {
    conversationId,
    message,
  });
};

export const emitMessageDeleted = (
  conversationId: number,
  messageId: number,
) => {
  getIO()?.to(conversationRoom(conversationId)).emit("message:deleted", {
    conversationId,
    messageId,
  });
};

export const emitReadUpdate = (
  conversationId: number,
  userId: number,
  lastReadAt: Date,
) => {
  getIO()?.to(conversationRoom(conversationId)).emit("read:update", {
    conversationId,
    userId,
    lastReadAt: lastReadAt.toISOString(),
  });
};

export const joinUsersToConversationRoom = (
  userIds: number[],
  conversationId: number,
) => {
  const io = getIO();
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
  const io = getIO();
  if (!io) return;

  const room = conversationRoom(conversationId);
  for (const userId of userIds) {
    io.in(userRoom(userId)).socketsLeave(room);
  }
};

export const emitMembersUpdated = (payload: MembersUpdatedPayload) => {
  const io = getIO();
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
