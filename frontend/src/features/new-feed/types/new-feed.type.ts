import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ReactionType } from "@/features/new-feed/api/reaction.api";
import type { PostContentFormat } from "@/features/new-feed/utils/rich-text";

type SortType = "latest" | "trending";

interface Author {
  id: number;
  name: string;
  avatar: string;
}

interface Stats {
  likes: number;
  comments: number;
}

interface Post {
  id: number;
  isPinned?: boolean;
  author: Author;
  role: string;
  time: string;
  content: string;
  contentFormat?: PostContentFormat;
  attachments?: {
    fileUrl: string;
    fileName: string;
    attachmentType: string;
  }[];
  stats: Stats;
  currentReaction: ReactionType | null;
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

interface PostCardProps extends Post {
  onDeleted?: (postId: number) => void;
  onUpdated?: (
    postId: number,
    content: string,
    contentFormat?: PostContentFormat,
  ) => void;
  onCopied?: (postId: number) => void;
  canPinPost?: boolean;
  /** groupId gửi lên API pin (null = bảng tin công khai / admin) */
  pinGroupId?: number | null;
  onPinned?: (
    postId: number,
    groupId: number | null,
    isPinned: boolean,
  ) => void | Promise<void>;
}

interface RightSidebarWidgetProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

interface GroupItemProps {
  id: string;
  name: string;
  members: number;
  url?: string;
}

type ApiPost = {
  id: number;
  content: string;
  contentFormat?: PostContentFormat;
  isPinned: boolean;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    profile: {
      avatarUrl: string;
    };
  };
  attachments?: Array<{
    id: number;
    fileUrl: string;
    fileName: string;
    attachmentType: string;
  }>;
  _count?: {
    comments: number;
    reactions: number;
  };
  reactions?: {
    reactionType: ReactionType;
  }[];
};

type GetPostsResponse = {
  page: number;
  limit: number;
  sort: SortType;
  hasMore: boolean;
  pinnedPosts: ApiPost[];
  posts: ApiPost[];
};

export type {
  Author,
  Stats,
  Post,
  ApiPost,
  GetPostsResponse,
  SidebarItemProps,
  PostCardProps,
  RightSidebarWidgetProps,
  GroupItemProps,
};
