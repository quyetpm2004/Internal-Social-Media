import { axiosClient } from "@/lib/axios";

export type CommentReactionType =
  | "LIKE"
  | "LOVE"
  | "HAHA"
  | "WOW"
  | "SAD"
  | "ANGRY";

export const CommentApi = {
  getComments(postId: number, page = 1, limit = 10) {
    return axiosClient.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
  },

  createComment(postId: number, content: string) {
    return axiosClient.post(`/posts/${postId}/comments`, { content });
  },

  getReplies(commentId: number, page = 1, limit = 10) {
    return axiosClient.get(`/comments/${commentId}/replies`, {
      params: { page, limit },
    });
  },

  replyComment(commentId: number, content: string) {
    return axiosClient.post(`/comments/${commentId}/replies`, { content });
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
