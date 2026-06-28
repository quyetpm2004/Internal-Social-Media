import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { connectSocket } from "@/lib/socket";
import type {
  AppNotification,
  NotificationNewPayload,
  NotificationUnreadCountPayload,
} from "@/features/notification/types/notification.type";

export interface UseNotificationSocketHandlers {
  onNotificationNew?: (payload: NotificationNewPayload) => void;
  onUnreadCount?: (payload: NotificationUnreadCountPayload) => void;
}

export const useNotificationSocket = (
  handlers: UseNotificationSocketHandlers,
) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const handlersRef = useRef(handlers);

  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  const handleNotificationNew = useCallback(
    (payload: NotificationNewPayload) => {
      handlersRef.current.onNotificationNew?.(payload);
    },
    [],
  );

  const handleUnreadCount = useCallback(
    (payload: NotificationUnreadCountPayload) => {
      handlersRef.current.onUnreadCount?.(payload);
    },
    [],
  );

  useEffect(() => {
    const socket = connectSocket(accessToken);
    if (!socket) return;

    socket.on("notification:new", handleNotificationNew);
    socket.on("notification:unread-count", handleUnreadCount);

    return () => {
      socket.off("notification:new", handleNotificationNew);
      socket.off("notification:unread-count", handleUnreadCount);
    };
  }, [accessToken, handleNotificationNew, handleUnreadCount]);
};

export const prependUniqueNotification = (
  list: AppNotification[],
  incoming: AppNotification,
): AppNotification[] => {
  if (list.some((item) => item.id === incoming.id)) {
    return list;
  }
  return [incoming, ...list].slice(0, 30);
};
