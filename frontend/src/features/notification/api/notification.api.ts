import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type { NotificationListResponse } from "@/features/notification/types/notification.type";

export const notificationApi = {
  list(params?: { page?: number; limit?: number }) {
    return axiosClient.get<ApiResponse<NotificationListResponse>>(
      "/notifications",
      { params },
    );
  },

  getUnreadCount() {
    return axiosClient.get<ApiResponse<{ unreadCount: number }>>(
      "/notifications/unread-count",
    );
  },

  markRead(notificationId: number) {
    return axiosClient.patch<ApiResponse<{ unreadCount: number }>>(
      `/notifications/${notificationId}/read`,
    );
  },

  markAllRead() {
    return axiosClient.patch<ApiResponse<{ unreadCount: number }>>(
      "/notifications/read-all",
    );
  },
};
