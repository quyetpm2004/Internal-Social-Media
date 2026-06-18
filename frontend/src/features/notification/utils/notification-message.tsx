import type { AppNotification } from "@/features/notification/types/notification.type";
import { type ReactNode } from "react";
import type { TFunction } from "i18next";

const getReactionLabel = (t: TFunction, type: string) =>
  t(`pages.notifications.reactions.${type.toLowerCase()}`, {
    defaultValue: t("pages.notifications.reactions.like"),
  });

const getGroupMemberRoleLabel = (t: TFunction, role: string) =>
  t(`pages.notifications.roles.${role.toLowerCase()}`, {
    defaultValue: t("pages.notifications.roles.member"),
  });

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
  t: TFunction,
): ReactNode => {
  const actorName = notification.actor?.fullName ?? t("pages.notifications.someone");
  const groupName = notification.group?.groupName;

  switch (notification.type) {
    case "POST_APPROVED":
      return groupName ? (
        <>
          {t("pages.notifications.postApprovedInGroup")} <strong>{groupName}</strong>
        </>
      ) : (
        <>{t("pages.notifications.postApproved")}</>
      );

    case "POST_REJECTED":
      return groupName ? (
        <>
          {t("pages.notifications.postRejectedInGroup")} <strong>{groupName}</strong>
        </>
      ) : (
        <>{t("pages.notifications.postRejected")}</>
      );

    case "POST_PINNED":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.postPinned")}
        </>
      );

    case "POST_UNPINNED":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.postUnpinned")}
        </>
      );

    case "POST_REACTION": {
      const reactionType = String(
        notification.metadata?.reactionType ?? "LIKE",
      );
      const label = getReactionLabel(t, reactionType);

      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.postReactionPrefix")}{" "}
          <strong>{label}</strong> {t("pages.notifications.postReactionSuffix")}
        </>
      );
    }

    case "POST_COMMENT":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.postComment")}
        </>
      );

    case "COMMENT_REPLY":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.commentReply")}
        </>
      );

    case "COMMENT_REACTION": {
      const reactionType = String(
        notification.metadata?.reactionType ?? "LIKE",
      );
      const label = getReactionLabel(t, reactionType);
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.commentReactionPrefix")}{" "}
          <strong>{label}</strong> {t("pages.notifications.commentReactionSuffix")}
        </>
      );
    }
    case "GROUP_MEMBER_ADDED":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.groupMemberAdded")}{" "}
          <strong>{groupName}</strong>
        </>
      );

    case "GROUP_MEMBER_ROLE_CHANGED": {
      const newRole = String(notification.metadata?.newRole ?? "MEMBER");

      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.groupRoleChangedPrefix")}{" "}
          <strong>{groupName}</strong> {t("pages.notifications.groupRoleChangedSuffix")}{" "}
          <strong>{getGroupMemberRoleLabel(t, newRole)}</strong>
        </>
      );
    }

    case "GROUP_MEMBER_STATUS_CHANGED":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.groupMemberAdded")}{" "}
          <strong>{groupName}</strong>
        </>
      );

    case "GROUP_MEMBER_KICKED":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.groupMemberKicked")}{" "}
          <strong>{groupName}</strong>
        </>
      );

    case "GROUP_MEMBER_REJECTED":
      return (
        <>
          <strong>{actorName}</strong> {t("pages.notifications.groupMemberRejected")}{" "}
          <strong>{groupName}</strong>
        </>
      );

    default:
      return <>{t("pages.notifications.newNotification")}</>;
  }
};
