import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { notificationApi } from "@/features/notification/api/notification.api";
import {
  prependUniqueNotification,
  useNotificationSocket,
} from "@/features/notification/hooks/useNotificationSocket";
import type { AppNotification } from "@/features/notification/types/notification.type";
import {
  getNotificationLink,
  getNotificationMessage,
} from "@/features/notification/utils/notification-message.tsx";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { getDefaultAvatarUrl } from "@/lib/utils";

export default function NotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationApi.list({ page: 1, limit: 20 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useNotificationSocket({
    onNotificationNew: ({ notification }) => {
      if (open) {
        setNotifications((prev) =>
          prependUniqueNotification(prev, notification),
        );
      }
    },
    onUnreadCount: ({ unreadCount: count }) => {
      setUnreadCount(count);
    },
  });

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const response = await notificationApi.markAllRead();
      setUnreadCount(response.data.unreadCount);
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error("Failed to mark all read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.readAt) {
      try {
        const response = await notificationApi.markRead(notification.id);
        setUnreadCount(response.data.unreadCount);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
      } catch (error) {
        console.error("Failed to mark notification read:", error);
      }
    }

    setOpen(false);
    navigate(getNotificationLink(notification));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 duration-200"
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-[min(100vw-2rem,380px)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Thông báo
            </h3>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              Đọc tất cả
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                Chưa có thông báo nào
              </p>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.readAt;
                const actorName = notification.actor?.fullName ?? "Hệ thống";
                const avatarUrl =
                  notification.actor?.avatarUrl ??
                  getDefaultAvatarUrl(actorName);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                      isUnread ? "bg-blue-50/50 dark:bg-blue-500/5" : ""
                    }`}
                  >
                    <img
                      src={avatarUrl}
                      alt={actorName}
                      className="h-10 w-10 rounded-full object-cover shrink-0 bg-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900 dark:text-white leading-snug">
                        {getNotificationMessage(notification)}
                      </p>
                      {notification.post?.snippet && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {notification.post.snippet}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-2 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
