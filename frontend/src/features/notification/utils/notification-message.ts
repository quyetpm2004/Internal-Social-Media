import type { AppNotification } from "@/features/notification/types/notification.type";

const REACTION_LABELS: Record<string, string> = {
  LIKE: "thích",
  LOVE: "yêu thích",
  HAHA: "haha",
  WOW: "wow",
  SAD: "buồn",
  ANGRY: "phẫn nộ",
};

export const getNotificationLink = (notification: AppNotification): string => {
  if (notification.postId) {
    if (notification.groupId) {
      return `/groups/${notification.groupId}/posts/${notification.postId}`;
    }
    return `/news-feed/${notification.postId}`;
  }
  return "/news-feed";
};

export const getNotificationMessage = (
  notification: AppNotification,
): string => {
  const actorName = notification.actor?.fullName ?? "Ai đó";
  const groupName = notification.group?.groupName;

  switch (notification.type) {
    case "POST_APPROVED":
      return groupName
        ? `Bài viết của bạn đã được duyệt trong nhóm ${groupName}`
        : "Bài viết của bạn đã được duyệt";
    case "POST_REJECTED":
      return groupName
        ? `Bài viết của bạn đã bị từ chối trong nhóm ${groupName}`
        : "Bài viết của bạn đã bị từ chối";
    case "POST_PINNED":
      return `${actorName} đã ghim bài viết của bạn`;
    case "POST_UNPINNED":
      return `${actorName} đã bỏ ghim bài viết của bạn`;
    case "POST_REACTION": {
      const reactionType = String(
        notification.metadata?.reactionType ?? "LIKE",
      );
      const label = REACTION_LABELS[reactionType] ?? "cảm xúc";
      return `${actorName} đã thả cảm xúc ${label} bài viết của bạn`;
    }
    case "POST_COMMENT":
      return `${actorName} đã bình luận bài viết của bạn`;
    case "COMMENT_REPLY":
      return `${actorName} đã trả lời bình luận của bạn`;
    default:
      return "Bạn có thông báo mới";
  }
};
