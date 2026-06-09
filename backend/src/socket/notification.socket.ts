import { getIO } from "@/socket/io";
import { userRoom } from "@/socket/rooms";

export type FormattedNotificationPayload = {
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

export const emitNotificationNew = (
  userId: number,
  notification: FormattedNotificationPayload,
) => {
  getIO()?.to(userRoom(userId)).emit("notification:new", { notification });
};

export const emitNotificationUnreadCount = (
  userId: number,
  unreadCount: number,
) => {
  getIO()
    ?.to(userRoom(userId))
    .emit("notification:unread-count", { unreadCount });
};
