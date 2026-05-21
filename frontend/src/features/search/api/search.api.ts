import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  SearchHistoryItem,
  SearchResult,
  SearchTab,
} from "@/features/search/types/search.type";

export const searchApi = {
  search(q: string, type: SearchTab = "all", page = 1, limit = 10) {
    return axiosClient.get<ApiResponse<SearchResult>>("/search", {
      params: { q, type, page, limit },
    });
  },

  getHistory(limit = 10) {
    return axiosClient.get<ApiResponse<SearchHistoryItem[]>>(
      "/search/history",
      { params: { limit } },
    );
  },

  saveHistory(query: string) {
    return axiosClient.post<ApiResponse<SearchHistoryItem[]>>(
      "/search/history",
      { query },
    );
  },

  deleteHistoryItem(historyId: number) {
    return axiosClient.delete(`/search/history/${historyId}`);
  },

  clearHistory() {
    return axiosClient.delete("/search/history");
  },
};
