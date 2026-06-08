import type { AppNotification } from "@/features/notification/types/notification.type";
import { type ReactNode } from "react";

const REACTION_LABELS: Record<string, string> = {
  LIKE: "thích",
  LOVE: "yêu thích",
  HAHA: "haha",
  WOW: "wow",
  SAD: "buồn",
  ANGRY: "phẫn nộ",
};

const GROUP_MEMBER_ROLE_LABELS: Record<string, string> = {
  MEMBER: "Thành viên",
  MODERATOR: "Kiểm duyệt viên",
  ADMIN: "Quản trị viên",
};

export const getNotificationLink = (notification: AppNotification): string => {
  if (notification.postId) {
    if (notification.groupId) {
      return `/groups/${notification.groupId}/posts/${notification.postId}`;
    }
    return `/news-feed/${notification.postId}`;
  }
  if (notification.groupId) {
    return `/groups/${notification.groupId}`;
  }
  return "/news-feed";
};

export const getNotificationMessage = (
  notification: AppNotification,
): ReactNode => {
  const actorName = notification.actor?.fullName ?? "Ai đó";
  const groupName = notification.group?.groupName;

  switch (notification.type) {
    case "POST_APPROVED":
      return groupName ? (
        <>
          Bài viết của bạn đã được duyệt trong nhóm <strong>{groupName}</strong>
        </>
      ) : (
        <>Bài viết của bạn đã được duyệt</>
      );

    case "POST_REJECTED":
      return groupName ? (
        <>
          Bài viết của bạn đã bị từ chối trong nhóm <strong>{groupName}</strong>
        </>
      ) : (
        <>Bài viết của bạn đã bị từ chối</>
      );

    case "POST_PINNED":
      return (
        <>
          <strong>{actorName}</strong> đã ghim bài viết của bạn
        </>
      );

    case "POST_UNPINNED":
      return (
        <>
          <strong>{actorName}</strong> đã bỏ ghim bài viết của bạn
        </>
      );

    case "POST_REACTION": {
      const reactionType = String(
        notification.metadata?.reactionType ?? "LIKE",
      );
      const label = REACTION_LABELS[reactionType] ?? "cảm xúc";

      return (
        <>
          <strong>{actorName}</strong> đã thả cảm xúc <strong>{label}</strong>{" "}
          bài viết của bạn
        </>
      );
    }

    case "POST_COMMENT":
      return (
        <>
          <strong>{actorName}</strong> đã bình luận bài viết của bạn
        </>
      );

    case "COMMENT_REPLY":
      return (
        <>
          <strong>{actorName}</strong> đã trả lời bình luận của bạn
        </>
      );

    case "COMMENT_REACTION": {
      const reactionType = String(
        notification.metadata?.reactionType ?? "LIKE",
      );
      const label = REACTION_LABELS[reactionType] ?? "thích";
      return (
        <>
          <strong>{actorName}</strong> đã thả cảm xúc <strong>{label}</strong>{" "}
          bình luận của bạn
        </>
      );
    }
    case "GROUP_MEMBER_ADDED":
      return (
        <>
          <strong>{actorName}</strong> đã thêm bạn vào nhóm{" "}
          <strong>{groupName}</strong>
        </>
      );

    case "GROUP_MEMBER_ROLE_CHANGED": {
      const newRole = String(notification.metadata?.newRole ?? "MEMBER");

      return (
        <>
          <strong>{actorName}</strong> đã thay đổi quyền của bạn trong nhóm{" "}
          <strong>{groupName}</strong> thành{" "}
          <strong>{GROUP_MEMBER_ROLE_LABELS[newRole]}</strong>
        </>
      );
    }

    case "GROUP_MEMBER_STATUS_CHANGED":
      return (
        <>
          <strong>{actorName}</strong> đã thêm bạn vào nhóm{" "}
          <strong>{groupName}</strong>
        </>
      );

    case "GROUP_MEMBER_KICKED":
      return (
        <>
          <strong>{actorName}</strong> đã xóa bạn khỏi nhóm{" "}
          <strong>{groupName}</strong>
        </>
      );

    case "GROUP_MEMBER_REJECTED":
      return (
        <>
          <strong>{actorName}</strong> đã từ chối bạn vào nhóm{" "}
          <strong>{groupName}</strong>
        </>
      );

    default:
      return <>Bạn có thông báo mới</>;
  }
};
