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
};
