import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ReactionType } from "@/features/new-feed/api/reaction.api";
import type { PostContentFormat } from "@/features/new-feed/utils/rich-text";
import type { GroupMemberRole } from "@/features/group/utils/group-member";
import type { PollSummary } from "@/types/poll.type";
import type { EventSummary } from "@/types/event.type";

type SortType = "latest" | "trending";
type PostStatus = "ACTIVE" | "PENDING_REVIEW" | "HIDDEN" | "DELETED";

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
  isSaved?: boolean;
  poll?: PollSummary | null;
  event?: EventSummary | null;
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
  onSavedChanged?: (postId: number, isSaved: boolean) => void;
  allowAnonymousComment?: boolean;
  showComment?: boolean;
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
  isAnonymous?: boolean;
  createdAt: string;
  status?: PostStatus;
  user?: {
    id: number;
    fullName: string;
    email: string;
    isAnonymous?: boolean;
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
  role?: GroupMemberRole;
  isSaved?: boolean;
  poll?: PollSummary | null;
  event?: EventSummary | null;
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
