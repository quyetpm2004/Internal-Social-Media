import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  AddMemberPayload,
  DepartmentMemberItem,
  DepartmentMemberList,
  DepartmentMemberTaskList,
  DepartmentProjectOption,
  MemberListParams,
  MemberPosition,
  UpdateMemberPayload,
} from "@/features/department/types/department-member.type";

type MemberBasic = Omit<DepartmentMemberItem, "score" | "workload">;

export const departmentMemberApi = {
  list(params: MemberListParams) {
    return axiosClient.get<ApiResponse<DepartmentMemberList>>(
      "/departments/me/members",
      { params },
    );
  },

  listTasks(
    userId: number,
    params: { page: number; limit: number; projectId?: number },
  ) {
    return axiosClient.get<ApiResponse<DepartmentMemberTaskList>>(
      `/departments/me/members/${userId}/tasks`,
      { params },
    );
  },

  listProjects() {
    return axiosClient.get<ApiResponse<DepartmentProjectOption[]>>(
      "/departments/me/projects",
    );
  },

  listPositions() {
    return axiosClient.get<ApiResponse<MemberPosition[]>>("/positions");
  },

  add(payload: AddMemberPayload) {
    return axiosClient.post<ApiResponse<MemberBasic>>(
      "/departments/me/members",
      payload,
    );
  },

  update(userId: number, payload: UpdateMemberPayload) {
    return axiosClient.patch<ApiResponse<MemberBasic>>(
      `/departments/me/members/${userId}`,
      payload,
    );
  },

  remove(userId: number) {
    return axiosClient.delete<ApiResponse<null>>(
      `/departments/me/members/${userId}`,
    );
  },
};
