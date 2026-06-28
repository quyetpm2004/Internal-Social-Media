import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  CommentApiResponse,
  RepliesApiResponse,
} from "../types/comment.type";

export type CommentReactionType =
  | "LIKE"
  | "LOVE"
  | "HAHA"
  | "WOW"
  | "SAD"
  | "ANGRY";

const buildMentionBody = (
  mentionedUserIds?: number[],
  mentionAll?: boolean,
) => ({
  ...(mentionedUserIds?.length ? { mentionedUserIds } : {}),
  ...(mentionAll ? { mentionAll: true } : {}),
});

export const CommentApi = {
  getComments(postId: number, page = 1, limit = 10) {
    return axiosClient.get<ApiResponse<CommentApiResponse>>(
      `/posts/${postId}/comments`,
      {
        params: { page, limit },
      },
    );
  },

  createComment(
    postId: number,
    content: string,
    isAnonymous?: boolean,
    mentionedUserIds?: number[],
    mentionAll?: boolean,
  ) {
    return axiosClient.post(`/posts/${postId}/comments`, {
      content,
      ...(isAnonymous ? { isAnonymous: true } : {}),
      ...buildMentionBody(mentionedUserIds, mentionAll),
    });
  },

  getReplies(commentId: number, page = 1, limit = 10) {
    return axiosClient.get<ApiResponse<RepliesApiResponse>>(
      `/comments/${commentId}/replies`,
      {
        params: { page, limit },
      },
    );
  },

  replyComment(
    commentId: number,
    content: string,
    isAnonymous?: boolean,
    mentionedUserIds?: number[],
    mentionAll?: boolean,
  ) {
    return axiosClient.post(`/comments/${commentId}/replies`, {
      content,
      ...(isAnonymous ? { isAnonymous: true } : {}),
      ...buildMentionBody(mentionedUserIds, mentionAll),
    });
  },

  updateComment(
    commentId: number,
    content: string,
    mentionedUserIds?: number[],
    mentionAll?: boolean,
  ) {
    return axiosClient.patch(`/comments/${commentId}`, {
      content,
      ...buildMentionBody(mentionedUserIds, mentionAll),
    });
  },

  deleteComment(commentId: number) {
    return axiosClient.delete(`/comments/${commentId}`);
  },

  reactComment(commentId: number, reactionType: CommentReactionType) {
    return axiosClient.post(`/comments/${commentId}/reactions`, {
      reactionType,
    });
  },

  pinComment(commentId: number, isPinned: boolean) {
    return axiosClient.patch(`/comments/${commentId}/pin`, { isPinned });
  },
};
