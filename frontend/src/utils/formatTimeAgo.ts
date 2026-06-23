import type { GroupMemberRole } from "@/features/group/utils/group-member";
import type { ApiPost, Post } from "@/features/new-feed/types/post.type";
import { getDefaultAvatarUrl } from "@/lib/utils";
import i18n from "@/i18n";

export const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const createdAt = new Date(dateString);
  const diffMs = now.getTime() - createdAt.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return i18n.t("common.time.justNow");
  }

  if (minutes < 60) {
    return i18n.t("common.time.minutesAgo", { count: minutes });
  }

  if (hours < 24) {
    return i18n.t("common.time.hoursAgo", { count: hours });
  }

  return i18n.t("common.time.daysAgo", { count: days });
};

const mapRoleToLabel = (role: GroupMemberRole) => {
  switch (role) {
    case "MEMBER":
      return i18n.t("common.roles.member");
    case "MODERATOR":
      return i18n.t("common.roles.moderator");
    case "ADMIN":
      return i18n.t("common.roles.admin");
    default:
      return i18n.t("common.roles.member");
  }
};

export const mapApiPostToPostCard = (post: ApiPost): Post => {
  const isViewAnonymous = post.isAnonymous && !post.user?.isAnonymous;

  const getAvatarUrl = (avatarUrl: string | null, fullName: string) => {
    return avatarUrl ? avatarUrl : getDefaultAvatarUrl(fullName);
  };

  const anonymousName = i18n.t("common.anonymous");
  const anonymousUserName = i18n.t("common.anonymousUser");
  const fullName = post.user?.fullName ?? "";

  return {
    id: post.id,
    isPinned: post.isPinned,
    author: {
      id: post.user?.id ?? 0,
      name: isViewAnonymous ? `${anonymousName} (${fullName})` : fullName,
      avatar: isViewAnonymous
        ? getAvatarUrl(post.user?.profile?.avatarUrl || "", fullName)
        : post.isAnonymous
          ? getAvatarUrl(null, anonymousUserName)
          : getAvatarUrl(post.user?.profile?.avatarUrl || "", fullName),
    },
    role: mapRoleToLabel(post.role || "MEMBER"),
    time: formatTimeAgo(post.createdAt),
    content: post.content,
    contentFormat: post.contentFormat,
    attachments:
      post.attachments?.map((attachment) => ({
        fileUrl: attachment.fileUrl,
        attachmentType: attachment.attachmentType,
        fileName: attachment.fileName,
      })) || [],
    stats: {
      likes: post._count?.reactions || 0,
      comments: post._count?.comments || 0,
    },
    currentReaction: post.reactions?.[0]?.reactionType || null,
    isSaved: post.isSaved ?? false,
    poll: post.poll ?? null,
    event: post.event ?? null,
  };
};
