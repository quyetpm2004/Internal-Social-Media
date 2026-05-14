import { axiosClient } from "@/lib/axios";
import type { GetPostsResponse } from "@/features/new-feed/types/new-feed.type";
import { data } from "react-router-dom";

export const PostsApi = {
  getPostInNewFeed(page: number, limit: number, sort: "latest" | "trending") {
    return axiosClient.get<GetPostsResponse>("/posts/new-feed", {
      params: {
        page,
        limit,
        sort,
      },
    });
  },

  createPost(data: {
    content: string;
    visibility: "PUBLIC" | "GROUP";
    groupId?: number;
    attachmentIds: number[];
  }) {
    return axiosClient.post("/posts", data);
  },

  deletePost(postId: number) {
    return axiosClient.delete(`/posts/${postId}`);
  },

  updatePost(postId: number, content: string) {
    return axiosClient.patch(`/posts/${postId}`, { content });
  },
};
