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

export const CommentApi = {
  getComments(postId: number, page = 1, limit = 10) {
    return axiosClient.get<ApiResponse<CommentApiResponse>>(
      `/posts/${postId}/comments`,
      {
        params: { page, limit },
      },
    );
  },

  createComment(postId: number, content: string, isAnonymous?: boolean) {
    return axiosClient.post(`/posts/${postId}/comments`, {
      content,
      ...(isAnonymous ? { isAnonymous: true } : {}),
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

  replyComment(commentId: number, content: string, isAnonymous?: boolean) {
    return axiosClient.post(`/comments/${commentId}/replies`, {
      content,
      ...(isAnonymous ? { isAnonymous: true } : {}),
    });
  },

  updateComment(commentId: number, content: string) {
    return axiosClient.patch(`/comments/${commentId}`, { content });
  },

  deleteComment(commentId: number) {
    return axiosClient.delete(`/comments/${commentId}`);
  },

  reactComment(commentId: number, reactionType: CommentReactionType) {
    return axiosClient.post(`/comments/${commentId}/reactions`, {
      reactionType,
    });
  },
};
