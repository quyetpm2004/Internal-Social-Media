import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";

export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

export type ReactionSummary = Record<ReactionType, number>;

export type PostReactionUser = {
  id: number;
  reactionType: ReactionType;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    profile: {
      avatarUrl: string | null;
    } | null;
  };
};

export type GetPostReactionsResponse = {
  summary: ReactionSummary;
  total: number;
  items: PostReactionUser[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
};

export const ReactionApi = {
  reactToPost(postId: number, reactionType: ReactionType) {
    return axiosClient.post(`/posts/${postId}/reactions`, { reactionType });
  },

  getPostReactions(
    postId: number,
    params?: { page?: number; limit?: number; reactionType?: ReactionType },
  ) {
    return axiosClient.get<ApiResponse<GetPostReactionsResponse>>(
      `/posts/${postId}/reactions`,
      { params },
    );
  },
};
