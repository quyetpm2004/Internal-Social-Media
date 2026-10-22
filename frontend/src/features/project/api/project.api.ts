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
  ProjectMembershipFilter,
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
import type { ProjectOverviewData } from "@/features/project/types/overview.type";
import type {
  MilestoneList,
  PhaseList,
  PlanningTaskList,
  SaveMilestonePayload,
  SavePhasePayload,
} from "@/features/project/types/planning.type";
import type {
  SaveTaskPayload,
  TaskAttachmentGroups,
  TaskComment,
  TaskDetail,
  TaskListParams,
  TaskListResponse,
} from "@/features/project/types/task.type";

export const projectApi = {
  getProjects(params?: {
    page?: number;
    limit?: number;
    keyword?: string;
    membership?: ProjectMembershipFilter;
  }) {
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

  getOverview(projectId: number) {
    return axiosClient.get<ApiResponse<ProjectOverviewData>>(
      `/projects/${projectId}/overview`,
    );
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
    params?: { keyword?: string; roleId?: number; limit?: number },
  ) {
    return axiosClient.get<ApiResponse<ProjectMembersData>>(
      `/projects/${projectId}/members`,
      {
        params: {
          ...(params?.keyword ? { keyword: params.keyword } : {}),
          ...(params?.roleId ? { roleId: params.roleId } : {}),
          ...(params?.limit ? { limit: params.limit } : {}),
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

  getTasks(projectId: number, params: TaskListParams = {}) {
    const { statusIds, ...rest } = params;
    return axiosClient.get<ApiResponse<TaskListResponse>>(
      `/projects/${projectId}/tasks`,
      {
        params: {
          ...rest,
          statusIds:
            statusIds && statusIds.length > 0 ? statusIds.join(",") : undefined,
        },
      },
    );
  },

  getTask(projectId: number, taskId: number) {
    return axiosClient.get<ApiResponse<TaskDetail>>(
      `/projects/${projectId}/tasks/${taskId}`,
    );
  },

  createTask(projectId: number, data: SaveTaskPayload) {
    return axiosClient.post<ApiResponse<TaskDetail>>(
      `/projects/${projectId}/tasks`,
      data,
    );
  },

  updateTask(projectId: number, taskId: number, data: SaveTaskPayload) {
    return axiosClient.patch<ApiResponse<TaskDetail>>(
      `/projects/${projectId}/tasks/${taskId}`,
      data,
    );
  },

  updateTaskStatus(projectId: number, taskId: number, statusId: number) {
    return axiosClient.patch<ApiResponse<TaskDetail>>(
      `/projects/${projectId}/tasks/${taskId}/status`,
      { statusId },
    );
  },

  deleteTask(projectId: number, taskId: number) {
    return axiosClient.delete<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/tasks/${taskId}`,
    );
  },

  getTaskComments(projectId: number, taskId: number) {
    return axiosClient.get<ApiResponse<TaskComment[]>>(
      `/projects/${projectId}/tasks/${taskId}/comments`,
    );
  },

  getTaskAttachments(projectId: number, taskId: number) {
    return axiosClient.get<ApiResponse<TaskAttachmentGroups>>(
      `/projects/${projectId}/tasks/${taskId}/attachments`,
    );
  },

  createTaskComment(
    projectId: number,
    taskId: number,
    data: { content: string; attachmentIds: number[] },
  ) {
    return axiosClient.post<ApiResponse<TaskComment>>(
      `/projects/${projectId}/tasks/${taskId}/comments`,
      data,
    );
  },

  getPhases(projectId: number) {
    return axiosClient.get<ApiResponse<PhaseList>>(
      `/projects/${projectId}/phases`,
    );
  },

  getPlanningTasks(projectId: number) {
    return axiosClient.get<ApiResponse<PlanningTaskList>>(
      `/projects/${projectId}/planning-tasks`,
    );
  },

  createPhase(projectId: number, data: SavePhasePayload) {
    return axiosClient.post<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/phases`,
      data,
    );
  },

  updatePhase(projectId: number, phaseId: number, data: SavePhasePayload) {
    return axiosClient.patch<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/phases/${phaseId}`,
      data,
    );
  },

  deletePhase(projectId: number, phaseId: number) {
    return axiosClient.delete<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/phases/${phaseId}`,
    );
  },

  getMilestones(projectId: number) {
    return axiosClient.get<ApiResponse<MilestoneList>>(
      `/projects/${projectId}/milestones`,
    );
  },

  createMilestone(projectId: number, data: SaveMilestonePayload) {
    return axiosClient.post<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/milestones`,
      data,
    );
  },

  updateMilestone(
    projectId: number,
    milestoneId: number,
    data: SaveMilestonePayload,
  ) {
    return axiosClient.patch<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/milestones/${milestoneId}`,
      data,
    );
  },

  deleteMilestone(projectId: number, milestoneId: number) {
    return axiosClient.delete<ApiResponse<{ id: number }>>(
      `/projects/${projectId}/milestones/${milestoneId}`,
    );
  },
};
