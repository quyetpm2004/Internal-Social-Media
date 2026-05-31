import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "@/lib/socket";
import type {
  MessageDeletedPayload,
  MessageEditedPayload,
  MessageNewPayload,
  PresencePayload,
  PresenceSnapshotPayload,
  ReadUpdatePayload,
  TypingPayload,
} from "@/features/chat/types/chat-events.type";

export interface UseChatSocketHandlers {
  onMessageNew?: (payload: MessageNewPayload) => void;
  onMessageEdited?: (payload: MessageEditedPayload) => void;
  onMessageDeleted?: (payload: MessageDeletedPayload) => void;
  onReadUpdate?: (payload: ReadUpdatePayload) => void;
  onTypingStart?: (payload: TypingPayload) => void;
  onTypingStop?: (payload: TypingPayload) => void;
  onPresenceOnline?: (payload: PresencePayload) => void;
  onPresenceOffline?: (payload: PresencePayload) => void;
  onPresenceSnapshot?: (payload: PresenceSnapshotPayload) => void;
}

export interface UseChatSocketReturn {
  emitTypingStart: (conversationId: number) => void;
  emitTypingStop: (conversationId: number) => void;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
}

/**
 * Quản lý kết nối socket cho chat:
 *  - Kết nối lại khi accessToken thay đổi (login / refresh)
 *  - Tự động join các conversation rooms phía server (xem socket/index.ts)
 *  - Gắn/gỡ listeners theo lifecycle component
 */
export const useChatSocket = (
  handlers: UseChatSocketHandlers,
): UseChatSocketReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Luôn dùng handler mới nhất mà không phải re-subscribe socket mỗi lần render
  const handlersRef = useRef(handlers);
  useLayoutEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);
    if (!socket) return;

    const handleMessageNew = (payload: MessageNewPayload) =>
      handlersRef.current.onMessageNew?.(payload);
    const handleMessageEdited = (payload: MessageEditedPayload) =>
      handlersRef.current.onMessageEdited?.(payload);
    const handleMessageDeleted = (payload: MessageDeletedPayload) =>
      handlersRef.current.onMessageDeleted?.(payload);
    const handleReadUpdate = (payload: ReadUpdatePayload) =>
      handlersRef.current.onReadUpdate?.(payload);
    const handleTypingStart = (payload: TypingPayload) =>
      handlersRef.current.onTypingStart?.(payload);
    const handleTypingStop = (payload: TypingPayload) =>
      handlersRef.current.onTypingStop?.(payload);
    const handlePresenceOnline = (payload: PresencePayload) =>
      handlersRef.current.onPresenceOnline?.(payload);
    const handlePresenceOffline = (payload: PresencePayload) =>
      handlersRef.current.onPresenceOffline?.(payload);
    const handlePresenceSnapshot = (payload: PresenceSnapshotPayload) =>
      handlersRef.current.onPresenceSnapshot?.(payload);

    socket.on("message:new", handleMessageNew);
    socket.on("message:edited", handleMessageEdited);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("read:update", handleReadUpdate);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("presence:online", handlePresenceOnline);
    socket.on("presence:offline", handlePresenceOffline);
    socket.on("presence:snapshot", handlePresenceSnapshot);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("message:edited", handleMessageEdited);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("read:update", handleReadUpdate);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("presence:online", handlePresenceOnline);
      socket.off("presence:offline", handlePresenceOffline);
      socket.off("presence:snapshot", handlePresenceSnapshot);
      disconnectSocket();
    };
  }, [accessToken]);

  const emitTypingStart = useCallback((conversationId: number) => {
    getSocket()?.emit("typing:start", { conversationId });
  }, []);

  const emitTypingStop = useCallback((conversationId: number) => {
    getSocket()?.emit("typing:stop", { conversationId });
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    getSocket()?.emit("conversation:join", { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    getSocket()?.emit("conversation:leave", { conversationId });
  }, []);

  return {
    emitTypingStart,
    emitTypingStop,
    joinConversation,
    leaveConversation,
  };
};
