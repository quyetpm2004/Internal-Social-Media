import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  ApprovalRule,
  ApproverType,
  ProjectRole,
  StatusCategory,
  TaskRole,
  TaskType,
  TemplateDetail,
  TemplateListResponse,
  TemplateStatus,
  Workflow,
  WorkflowStatus,
  WorkflowTransition,
} from "@/features/project-template/types/project-template.type";

export const projectTemplateApi = {
  getTemplates(params?: {
    page?: number;
    limit?: number;
    keyword?: string;
    status?: TemplateStatus;
  }) {
    return axiosClient.get<ApiResponse<TemplateListResponse>>(
      "/project-templates",
      { params },
    );
  },

  createTemplate(data: { key: string; name: string; description?: string }) {
    return axiosClient.post<ApiResponse<TemplateDetail>>(
      "/project-templates",
      data,
    );
  },

  getTemplate(id: number) {
    return axiosClient.get<ApiResponse<TemplateDetail>>(
      `/project-templates/${id}`,
    );
  },

  updateTemplate(
    id: number,
    data: { name?: string; description?: string },
  ) {
    return axiosClient.patch<ApiResponse<TemplateDetail>>(
      `/project-templates/${id}`,
      data,
    );
  },

  deleteTemplate(id: number) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/project-templates/${id}`,
    );
  },

  archiveTemplate(id: number) {
    return axiosClient.post<ApiResponse<TemplateDetail>>(
      `/project-templates/${id}/archive`,
    );
  },

  duplicateTemplate(
    id: number,
    data: { key: string; name: string; description?: string },
  ) {
    return axiosClient.post<ApiResponse<TemplateDetail>>(
      `/project-templates/${id}/duplicate`,
      data,
    );
  },

  activateTemplate(id: number) {
    return axiosClient.post<ApiResponse<TemplateDetail>>(
      `/project-templates/${id}/activate`,
    );
  },

  createProjectRole(
    templateId: number,
    data: {
      key: string;
      name: string;
      description?: string;
      sortOrder?: number;
    },
  ) {
    return axiosClient.post<ApiResponse<ProjectRole>>(
      `/project-templates/${templateId}/project-roles`,
      data,
    );
  },

  updateProjectRole(
    templateId: number,
    roleId: number,
    data: { name?: string; description?: string; sortOrder?: number },
  ) {
    return axiosClient.patch<ApiResponse<ProjectRole>>(
      `/project-templates/${templateId}/project-roles/${roleId}`,
      data,
    );
  },

  deleteProjectRole(templateId: number, roleId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/project-templates/${templateId}/project-roles/${roleId}`,
    );
  },

  createTaskType(
    templateId: number,
    data: {
      key: string;
      name: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
      workflowId?: number | null;
    },
  ) {
    return axiosClient.post<ApiResponse<TaskType>>(
      `/project-templates/${templateId}/task-types`,
      data,
    );
  },

  updateTaskType(
    templateId: number,
    taskTypeId: number,
    data: {
      name?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
      workflowId?: number | null;
    },
  ) {
    return axiosClient.patch<ApiResponse<TaskType>>(
      `/project-templates/${templateId}/task-types/${taskTypeId}`,
      data,
    );
  },

  deleteTaskType(templateId: number, taskTypeId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/project-templates/${templateId}/task-types/${taskTypeId}`,
    );
  },

  createWorkflow(
    templateId: number,
    data: {
      name: string;
      description?: string;
      isDefault?: boolean;
      isActive?: boolean;
    },
  ) {
    return axiosClient.post<ApiResponse<Workflow>>(
      `/project-templates/${templateId}/workflows`,
      data,
    );
  },

  updateWorkflow(
    templateId: number,
    workflowId: number,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
      isActive?: boolean;
    },
  ) {
    return axiosClient.patch<ApiResponse<Workflow>>(
      `/project-templates/${templateId}/workflows/${workflowId}`,
      data,
    );
  },

  deleteWorkflow(templateId: number, workflowId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/project-templates/${templateId}/workflows/${workflowId}`,
    );
  },

  createWorkflowStatus(
    templateId: number,
    workflowId: number,
    data: {
      name: string;
      key: string;
      description?: string;
      sortOrder?: number;
      category: StatusCategory;
      color?: string;
      isInitial?: boolean;
      isFinal?: boolean;
    },
  ) {
    return axiosClient.post<ApiResponse<WorkflowStatus>>(
      `/project-templates/${templateId}/workflows/${workflowId}/statuses`,
      data,
    );
  },

  updateWorkflowStatus(
    templateId: number,
    workflowId: number,
    statusId: number,
    data: {
      name?: string;
      key?: string;
      description?: string;
      sortOrder?: number;
      category?: StatusCategory;
      color?: string;
      isInitial?: boolean;
      isFinal?: boolean;
    },
  ) {
    return axiosClient.patch<ApiResponse<WorkflowStatus>>(
      `/project-templates/${templateId}/workflows/${workflowId}/statuses/${statusId}`,
      data,
    );
  },

  deleteWorkflowStatus(
    templateId: number,
    workflowId: number,
    statusId: number,
  ) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/project-templates/${templateId}/workflows/${workflowId}/statuses/${statusId}`,
    );
  },

  createWorkflowTransition(
    templateId: number,
    workflowId: number,
    data: {
      fromStatusId: number;
      toStatusId: number;
      name: string;
      isActive?: boolean;
    },
  ) {
    return axiosClient.post<ApiResponse<WorkflowTransition>>(
      `/project-templates/${templateId}/workflows/${workflowId}/transitions`,
      data,
    );
  },

  updateWorkflowTransition(
    templateId: number,
    workflowId: number,
    transitionId: number,
    data: {
      fromStatusId?: number;
      toStatusId?: number;
      name?: string;
      isActive?: boolean;
    },
  ) {
    return axiosClient.patch<ApiResponse<WorkflowTransition>>(
      `/project-templates/${templateId}/workflows/${workflowId}/transitions/${transitionId}`,
      data,
    );
  },

  deleteWorkflowTransition(
    templateId: number,
    workflowId: number,
    transitionId: number,
  ) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/project-templates/${templateId}/workflows/${workflowId}/transitions/${transitionId}`,
    );
  },

  createApprovalRule(
    templateId: number,
    workflowId: number,
    transitionId: number,
    data: {
      approverType: ApproverType;
      projectRoleId?: number;
      taskRole?: TaskRole;
      minApprovals: number;
      onRejectStatusId: number;
    },
  ) {
    return axiosClient.post<ApiResponse<ApprovalRule>>(
      `/project-templates/${templateId}/workflows/${workflowId}/transitions/${transitionId}/approval-rules`,
      data,
    );
  },

  updateApprovalRule(
    templateId: number,
    workflowId: number,
    transitionId: number,
    ruleId: number,
    data: {
      approverType?: ApproverType;
      projectRoleId?: number;
      taskRole?: TaskRole;
      minApprovals?: number;
      onRejectStatusId?: number;
    },
  ) {
    return axiosClient.patch<ApiResponse<ApprovalRule>>(
      `/project-templates/${templateId}/workflows/${workflowId}/transitions/${transitionId}/approval-rules/${ruleId}`,
      data,
    );
  },

  deleteApprovalRule(
    templateId: number,
    workflowId: number,
    transitionId: number,
    ruleId: number,
  ) {
    return axiosClient.delete<ApiResponse<boolean>>(
      `/project-templates/${templateId}/workflows/${workflowId}/transitions/${transitionId}/approval-rules/${ruleId}`,
    );
  },
};
