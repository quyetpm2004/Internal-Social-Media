import type { CommentReactionType } from "../api/comment.api";

export type CommentUser = {
  id: number;
  fullName: string;
  email: string;
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
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  mentions: unknown[];
  replyCount: number;
  reactionCount: number;
  currentReaction?: CommentReactionType | null;
};
