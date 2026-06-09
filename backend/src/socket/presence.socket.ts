import prisma from "@/shared/utils/prisma";
import * as presenceService from "@/services/redis/presence.service";
import { getIO } from "@/socket/io";
import { loadConversationIds } from "@/socket/chat.socket";
import { conversationRoom, userRoom } from "@/socket/rooms";
import type { AppSocket } from "@/socket/types";

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

export const handlePresenceOnConnect = async (
  socket: AppSocket,
): Promise<void> => {
  const userId = socket.data.user.id;

  const isFirstConnection = await presenceService.addUserSocket(
    userId,
    socket.id,
  );

  socket.join(userRoom(userId));

  try {
    const conversationIds = await loadConversationIds(userId);
    conversationIds.forEach((id) => socket.join(conversationRoom(id)));

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
};

export const registerPresenceHandlers = (socket: AppSocket): void => {
  const userId = socket.data.user.id;

  const presenceRefreshTimer = setInterval(() => {
    presenceService.refreshSocketPresence(userId, socket.id).catch((error) => {
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
        getIO()?.to(conversationRoom(id)).emit("presence:offline", { userId });
      });
    } catch (error) {
      console.error("Failed to broadcast presence:offline:", error);
    }
  });
};

/**
 * Buộc user offline: ngắt mọi socket (disconnect handler sẽ broadcast presence:offline).
 */
export const markUserOffline = async (userId: number): Promise<void> => {
  const io = getIO();
  if (!io) return;

  const wasOnline = await presenceService.isUserOnline(userId);
  if (!wasOnline) return;

  await io.in(userRoom(userId)).disconnectSockets(true);
};

export const isUserOnline = (userId: number): Promise<boolean> =>
  presenceService.isUserOnline(userId);

export const getOnlineUserIds = (): Promise<number[]> =>
  presenceService.getAllOnlineUserIds();
