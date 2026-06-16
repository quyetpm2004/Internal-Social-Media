import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type { PollSummary } from "@/types/poll.type";

export const pollApi = {
  vote(pollId: number, optionIds: number[]) {
    return axiosClient.post<ApiResponse<PollSummary>>(`/polls/${pollId}/vote`, {
      optionIds,
    });
  },
};
