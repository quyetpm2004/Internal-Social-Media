import { axiosClient } from "@/lib/axios";
import type {
  ApiPost,
  GetPostsResponse,
} from "@/features/new-feed/types/new-feed.type";
import type { PostContentFormat } from "@/features/new-feed/utils/rich-text";

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
    contentFormat?: PostContentFormat;
    visibility: "PUBLIC" | "GROUP";
    groupId?: number;
    attachmentIds: number[];
  }) {
    return axiosClient.post("/posts", data);
  },

  deletePost(postId: number) {
    return axiosClient.delete(`/posts/${postId}`);
  },

  updatePost(
    postId: number,
    content: string,
    contentFormat: PostContentFormat = "HTML",
  ) {
    return axiosClient.patch(`/posts/${postId}`, { content, contentFormat });
  },

  getPostById(postId: string) {
    return axiosClient.get<ApiPost>(`/posts/${postId}`);
  },
};
