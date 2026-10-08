import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  AddProjectMemberPayload,
  CreateProjectPayload,
  ProjectDetail,
  ProjectListResponse,
  ProjectMemberCandidate,
  ProjectMemberItem,
  ProjectMembersData,
  ProjectTemplateOption,
  UpdateProjectPayload,
} from "@/features/project/types/project.type";

export const projectApi = {
  getProjects(params?: { page?: number; limit?: number; keyword?: string }) {
    return axiosClient.get<ApiResponse<ProjectListResponse>>("/projects", {
      params,
    });
  },

  getTemplateOptions() {
    return axiosClient.get<ApiResponse<ProjectTemplateOption[]>>(
      "/projects/template-options",
    );
  },

  getProject(id: number) {
    return axiosClient.get<ApiResponse<ProjectDetail>>(`/projects/${id}`);
  },

  createProject(data: CreateProjectPayload) {
    return axiosClient.post<ApiResponse<ProjectDetail>>("/projects", data);
  },

  updateProject(id: number, data: UpdateProjectPayload) {
    return axiosClient.patch<ApiResponse<ProjectDetail>>(
      `/projects/${id}`,
      data,
    );
  },

  getMembers(
    projectId: number,
    params?: { keyword?: string; roleId?: number },
  ) {
    return axiosClient.get<ApiResponse<ProjectMembersData>>(
      `/projects/${projectId}/members`,
      {
        params: {
          ...(params?.keyword ? { keyword: params.keyword } : {}),
          ...(params?.roleId ? { roleId: params.roleId } : {}),
        },
      },
    );
  },

  searchMemberCandidates(projectId: number, keyword: string) {
    return axiosClient.get<ApiResponse<ProjectMemberCandidate[]>>(
      `/projects/${projectId}/members/candidates`,
      { params: { keyword } },
    );
  },

  addMember(projectId: number, data: AddProjectMemberPayload) {
    return axiosClient.post<ApiResponse<ProjectMemberItem>>(
      `/projects/${projectId}/members`,
      data,
    );
  },

  updateMemberRoles(projectId: number, userId: number, roleIds: number[]) {
    return axiosClient.patch<ApiResponse<ProjectMemberItem>>(
      `/projects/${projectId}/members/${userId}/roles`,
      { roleIds },
    );
  },

  removeMember(projectId: number, userId: number) {
    return axiosClient.delete<ApiResponse<null>>(
      `/projects/${projectId}/members/${userId}`,
    );
  },
};
