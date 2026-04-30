import { axiosClient } from "@/lib/axios";
import type { GetPostsResponse } from "../types/new-feed.type";

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

  createPost(
    content: string,
    visibility: "PUBLIC" | "PRIVATE",
    groupId: string | null,
    attachments: File[],
  ) {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("visibility", visibility);
    if (groupId) {
      formData.append("groupId", groupId);
    }
    attachments.forEach((file) => formData.append("files", file));
    return axiosClient.post("/posts", formData);
  },

  deletePost(postId: number) {
    return axiosClient.delete(`/posts/${postId}`);
  },

  updatePost(postId: number, content: string) {
    return axiosClient.patch(`/posts/${postId}`, { content });
  },
};
