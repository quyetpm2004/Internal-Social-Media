import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  AddProjectMemberPayload,
  CreateProjectPayload,
  CreateProjectRolePayload,
  CreateProjectTaskTypePayload,
  CreateProjectWorkflowStatusPayload,
  CreateProjectWorkflowTransitionPayload,
  ProjectDetail,
  ProjectListResponse,
  ProjectMemberCandidate,
  ProjectMemberItem,
  ProjectMemberRole,
  ProjectMembersData,
  ProjectTemplateOption,
  ProjectWorkflowConfig,
  ProjectWorkflowTaskType,
  SaveProjectApprovalRulePayload,
  SaveProjectRolePayload,
  SaveProjectTaskTypePayload,
  SaveProjectWorkflowPayload,
  SaveProjectWorkflowStatusPayload,
  SaveProjectWorkflowTransitionPayload,
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

  createRole(projectId: number, data: CreateProjectRolePayload) {
    return axiosClient.post<ApiResponse<ProjectMemberRole>>(
      `/projects/${projectId}/roles`,
      data,
    );
  },

  updateRole(
    projectId: number,
    roleId: number,
    data: SaveProjectRolePayload,
  ) {
    return axiosClient.patch<ApiResponse<ProjectMemberRole>>(
      `/projects/${projectId}/roles/${roleId}`,
      data,
    );
  },

  deleteRole(projectId: number, roleId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/roles/${roleId}`,
    );
  },

  createTaskType(projectId: number, data: CreateProjectTaskTypePayload) {
    return axiosClient.post<ApiResponse<ProjectWorkflowTaskType>>(
      `/projects/${projectId}/task-types`,
      data,
    );
  },

  updateTaskType(
    projectId: number,
    taskTypeId: number,
    data: SaveProjectTaskTypePayload,
  ) {
    return axiosClient.patch<ApiResponse<ProjectWorkflowTaskType>>(
      `/projects/${projectId}/task-types/${taskTypeId}`,
      data,
    );
  },

  deleteTaskType(projectId: number, taskTypeId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/task-types/${taskTypeId}`,
    );
  },

  getWorkflows(projectId: number) {
    return axiosClient.get<ApiResponse<ProjectWorkflowConfig>>(
      `/projects/${projectId}/workflows`,
    );
  },

  createWorkflow(projectId: number, data: SaveProjectWorkflowPayload) {
    return axiosClient.post<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows`,
      data,
    );
  },

  updateWorkflow(
    projectId: number,
    workflowId: number,
    data: Partial<SaveProjectWorkflowPayload>,
  ) {
    return axiosClient.patch<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}`,
      data,
    );
  },

  deleteWorkflow(projectId: number, workflowId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}`,
    );
  },

  createWorkflowStatus(
    projectId: number,
    workflowId: number,
    data: CreateProjectWorkflowStatusPayload,
  ) {
    return axiosClient.post<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}/statuses`,
      data,
    );
  },

  updateWorkflowStatus(
    projectId: number,
    workflowId: number,
    statusId: number,
    data: SaveProjectWorkflowStatusPayload,
  ) {
    return axiosClient.patch<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}/statuses/${statusId}`,
      data,
    );
  },

  deleteWorkflowStatus(
    projectId: number,
    workflowId: number,
    statusId: number,
  ) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}/statuses/${statusId}`,
    );
  },

  reorderWorkflowStatuses(
    projectId: number,
    workflowId: number,
    statusIds: number[],
  ) {
    return axiosClient.patch<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}/statuses/reorder`,
      { statusIds },
    );
  },

  createWorkflowTransition(
    projectId: number,
    workflowId: number,
    data: CreateProjectWorkflowTransitionPayload,
  ) {
    return axiosClient.post<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}/transitions`,
      data,
    );
  },

  updateWorkflowTransition(
    projectId: number,
    workflowId: number,
    transitionId: number,
    data: SaveProjectWorkflowTransitionPayload,
  ) {
    return axiosClient.patch<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}/transitions/${transitionId}`,
      data,
    );
  },

  deleteWorkflowTransition(
    projectId: number,
    workflowId: number,
    transitionId: number,
  ) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}/transitions/${transitionId}`,
    );
  },

  createApprovalRule(
    projectId: number,
    workflowId: number,
    transitionId: number,
    data: SaveProjectApprovalRulePayload,
  ) {
    return axiosClient.post<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}/transitions/${transitionId}/approval-rules`,
      data,
    );
  },

  updateApprovalRule(
    projectId: number,
    workflowId: number,
    transitionId: number,
    ruleId: number,
    data: SaveProjectApprovalRulePayload,
  ) {
    return axiosClient.patch<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}/transitions/${transitionId}/approval-rules/${ruleId}`,
      data,
    );
  },

  deleteApprovalRule(
    projectId: number,
    workflowId: number,
    transitionId: number,
    ruleId: number,
  ) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}/transitions/${transitionId}/approval-rules/${ruleId}`,
    );
  },
};
