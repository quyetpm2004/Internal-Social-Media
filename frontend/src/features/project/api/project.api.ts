import {
  projectWorkflowMock,
  USE_PROJECT_WORKFLOW_MOCK,
} from "@/features/project/api/project-workflow.mock";
import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  AddProjectMemberPayload,
  CreateProjectPayload,
  CreateProjectWorkflowStatusPayload,
  CreateProjectWorkflowTransitionPayload,
  ProjectDetail,
  ProjectListResponse,
  ProjectMemberCandidate,
  ProjectMemberItem,
  ProjectMembersData,
  ProjectTemplateOption,
  ProjectWorkflowConfig,
  SaveProjectApprovalRulePayload,
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

  getWorkflows(projectId: number) {
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.getWorkflows(projectId);
    }
    return axiosClient.get<ApiResponse<ProjectWorkflowConfig>>(
      `/projects/${projectId}/workflows`,
    );
  },

  createWorkflow(projectId: number, data: SaveProjectWorkflowPayload) {
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.createWorkflow(projectId, data);
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.updateWorkflow(projectId, workflowId, data);
    }
    return axiosClient.patch<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/workflows/${workflowId}`,
      data,
    );
  },

  deleteWorkflow(projectId: number, workflowId: number) {
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.deleteWorkflow(projectId, workflowId);
    }
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}`,
    );
  },

  createWorkflowStatus(
    projectId: number,
    workflowId: number,
    data: CreateProjectWorkflowStatusPayload,
  ) {
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.createWorkflowStatus(
        projectId,
        workflowId,
        data,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.updateWorkflowStatus(
        projectId,
        workflowId,
        statusId,
        data,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.deleteWorkflowStatus(
        projectId,
        workflowId,
        statusId,
      );
    }
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}/statuses/${statusId}`,
    );
  },

  reorderWorkflowStatuses(
    projectId: number,
    workflowId: number,
    statusIds: number[],
  ) {
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.reorderWorkflowStatuses(
        projectId,
        workflowId,
        statusIds,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.createWorkflowTransition(
        projectId,
        workflowId,
        data,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.updateWorkflowTransition(
        projectId,
        workflowId,
        transitionId,
        data,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.deleteWorkflowTransition(
        projectId,
        workflowId,
        transitionId,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.createApprovalRule(
        projectId,
        workflowId,
        transitionId,
        data,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.updateApprovalRule(
        projectId,
        workflowId,
        transitionId,
        ruleId,
        data,
      );
    }
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
    if (USE_PROJECT_WORKFLOW_MOCK) {
      return projectWorkflowMock.deleteApprovalRule(
        projectId,
        workflowId,
        transitionId,
        ruleId,
      );
    }
    return axiosClient.delete<ApiResponse<boolean>>(
      `/projects/${projectId}/workflows/${workflowId}/transitions/${transitionId}/approval-rules/${ruleId}`,
    );
  },
};
