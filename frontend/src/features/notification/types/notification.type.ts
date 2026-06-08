export type NotificationType =
  | "POST_APPROVED"
  | "POST_REJECTED"
  | "POST_PINNED"
  | "POST_UNPINNED"
  | "POST_REACTION"
  | "POST_COMMENT"
  | "COMMENT_REPLY"
  | "COMMENT_REACTION"
  | "GROUP_MEMBER_ADDED"
  | "GROUP_MEMBER_ROLE_CHANGED"
  | "GROUP_MEMBER_STATUS_CHANGED"
  | "GROUP_MEMBER_KICKED"
  | "GROUP_MEMBER_REJECTED";

export type NotificationActor = {
  id: number;
  fullName: string;
  avatarUrl: string | null;
};

export type AppNotification = {
  id: number;
  type: NotificationType;
  postId: number | null;
  commentId: number | null;
  groupId: number | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  group: { id: number; groupName: string } | null;
  post: { id: number; snippet: string } | null;
  comment: { id: number; snippet: string } | null;
};

export type NotificationListResponse = {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type NotificationNewPayload = {
  notification: AppNotification;
};

export type NotificationUnreadCountPayload = {
  unreadCount: number;
};
