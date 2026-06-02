import { axiosClient } from "@/lib/axios";
import type {
  ApiPost,
  GetPostsResponse,
} from "@/features/new-feed/types/new-feed.type";
import type { PostContentFormat } from "@/features/new-feed/utils/rich-text";
import type { ApiResponse } from "@/types/api.type";
import type { GroupApiResponse } from "@/features/group/types/group.type";

export const PostsApi = {
  getPostInNewFeed(page: number, limit: number, sort: "latest" | "trending") {
    return axiosClient.get<ApiResponse<GetPostsResponse>>("/posts/new-feed", {
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
    return axiosClient.get<ApiResponse<ApiPost>>(`/posts/${postId}`);
  },

  getMyGroups() {
    return axiosClient.get<ApiResponse<GroupApiResponse>>("/groups?scope=my");
  },

  pinPost(postId: number, groupId: number | null, isPinned: boolean) {
    return axiosClient.patch<ApiResponse<ApiPost>>(`/posts/${postId}/pin`, {
      isPinned,
      groupId,
    });
  },
};
