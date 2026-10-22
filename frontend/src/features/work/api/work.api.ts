import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  MyTaskListResponse,
  MyTaskQuery,
} from "@/features/work/types/work.type";

export const workApi = {
  getMyTasks(params: MyTaskQuery) {
    return axiosClient.get<ApiResponse<MyTaskListResponse>>("/work/my-tasks", {
      params: {
        scope: params.scope,
        ...(params.q ? { q: params.q } : {}),
        ...(params.projectId ? { projectId: params.projectId } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.due ? { due: params.due } : {}),
      },
    });
  },
};
