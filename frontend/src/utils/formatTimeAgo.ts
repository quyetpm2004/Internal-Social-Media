import type { GroupMemberRole } from "@/features/group/utils/group-member";
import type { ApiPost, Post } from "@/features/new-feed/types/post.type";
import { getDefaultAvatarUrl } from "@/lib/utils";

export const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const createdAt = new Date(dateString);
  const diffMs = now.getTime() - createdAt.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

const mapRoleToLabel = (role: GroupMemberRole) => {
  switch (role) {
    case "MEMBER":
      return "Thành viên";
    case "MODERATOR":
      return "Kiểm duyệt viên";
    case "ADMIN":
      return "Quản trị viên";
    default:
      return "Thành viên";
  }
};

export const mapApiPostToPostCard = (post: ApiPost): Post => {
  const isViewAnonymous = post.isAnonymous && !post.user?.isAnonymous;

  const getAvatarUrl = (avatarUrl: string | null, fullName: string) => {
    return avatarUrl ? avatarUrl : getDefaultAvatarUrl(fullName);
  };

  return {
    id: post.id,
    isPinned: post.isPinned,
    author: {
      id: post.user?.id ?? 0,
      name: isViewAnonymous
        ? "Ẩn Danh " + `(${post.user?.fullName})`
        : post.user?.fullName,
      avatar: isViewAnonymous
        ? getAvatarUrl(post.user?.profile?.avatarUrl, post.user?.fullName)
        : post.isAnonymous
          ? getAvatarUrl(null, "Người dùng ẩn danh")
          : getAvatarUrl(post.user?.profile?.avatarUrl, post.user?.fullName),
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
  };
};
