import type { ApiPost, Post } from "@/features/new-feed/types/new-feed.type";

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

export const mapApiPostToPostCard = (post: ApiPost): Post => {
  return {
    id: post.id,
    isPinned: post.isPinned,
    author: {
      id: post.user?.id ?? 0,
      name: post.user?.fullName || "Người dùng",
      avatar: post.user?.profile?.avatarUrl
        ? `${import.meta.env.VITE_BASE_URL_BACKEND}/uploads/avatar/${post.user?.profile?.avatarUrl}`
        : "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(post.user?.fullName || "User"),
    },
    role: "Thành viên",
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
