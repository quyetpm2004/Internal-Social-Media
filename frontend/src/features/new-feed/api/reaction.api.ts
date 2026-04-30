import { axiosClient } from "@/lib/axios";

export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

export const ReactionApi = {
  reactToPost(postId: number, reactionType: ReactionType) {
    return axiosClient.post(`/posts/${postId}/reactions`, { reactionType });
  },
};
