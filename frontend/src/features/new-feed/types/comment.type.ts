import type { CommentReactionType } from "@/features/new-feed/api/comment.api";

export type CommentUser = {
  id: number;
  fullName: string;
  email: string;
  isAnonymous?: boolean;
  profile: {
    avatarUrl?: string | null;
  };
};

export type CommentItemType = {
  id: number;
  postId: number;
  userId: number;
  parentCommentId: number | null;
  content: string;
  status: string;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  mentions: unknown[];
  replyCount: number;
  reactionCount: number;
  currentReaction?: CommentReactionType | null;
};

export interface CommentApiResponse {
  comments: CommentItemType[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RepliesApiResponse {
  replies: CommentItemType[];
  page: number;
  limit: number;
  hasMore: boolean;
}
