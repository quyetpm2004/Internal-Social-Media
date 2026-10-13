import type { Pagination } from "@/features/admin/types/admin.type";

export type ProjectVisibility = "PUBLIC" | "PRIVATE";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type ProjectListItem = {
  id: number;
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  priority: ProjectPriority;
  status: ProjectStatus;
  isUrgent: boolean;
  startDate: string;
  endDate: string;
  templateName: string;
  workflowName: string;
  memberCount: number;
  isMember: boolean;
};

export type ProjectWorkflowStatus = {
  id: number;
  name: string;
  key: string;
  color: string | null;
  sortOrder: number;
  isInitial: boolean;
  isFinal: boolean;
};

export type ProjectDetail = {
  id: number;
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  priority: ProjectPriority;
  status: ProjectStatus;
  isUrgent: boolean;
  startDate: string;
  endDate: string;
  templateId: number;
  templateName: string;
  templateVersion: number;
  workflowName: string;
  workflowStatuses: ProjectWorkflowStatus[];
  memberCount: number;
  createdBy: {
    id: number;
    fullName: string;
  };
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTemplateOption = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  workflowName: string;
  statusFlow: string[];
};

export type ProjectListResponse = {
  projects: ProjectListItem[];
  pagination: Pagination;
};

export type CreateProjectPayload = {
  name: string;
  description?: string | null;
  visibility: ProjectVisibility;
  priority: ProjectPriority;
  isUrgent: boolean;
  startDate: string;
  endDate: string;
  templateId: number;
};

export type UpdateProjectPayload = {
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  priority: ProjectPriority;
  status: ProjectStatus;
  isUrgent: boolean;
  startDate: string;
  endDate: string;
};

export type ProjectTab =
  | "chat"
  | "phases"
  | "tasks"
  | "bugs"
  | "milestones"
  | "members"
  | "workflow"
  | "overview"
  | "info";

export type WorkflowStatusCategory =
  | "TODO"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type WorkflowApproverType = "PROJECT_ROLE" | "TASK_ROLE";
export type WorkflowTaskRole = "ASSIGNEE" | "REVIEWER" | "REPORTER";

export type ProjectWorkflowRole = {
  id: number;
  key: string;
  name: string;
  sortOrder: number;
};

export type ProjectWorkflowTaskType = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  workflowId: number | null;
};

export type SaveProjectRolePayload = {
  name: string;
  description: string | null;
  sortOrder: number;
};

export type CreateProjectRolePayload = SaveProjectRolePayload & {
  key: string;
};

export type SaveProjectTaskTypePayload = {
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  workflowId: number | null;
};

export type CreateProjectTaskTypePayload = SaveProjectTaskTypePayload & {
  key: string;
};

export type ProjectWorkflowApprovalRule = {
  id: number;
  approverType: WorkflowApproverType;
  projectRoleId: number | null;
  taskRole: WorkflowTaskRole | null;
  minApprovals: number;
  onRejectStatusId: number;
};

export type ProjectWorkflowTransition = {
  id: number;
  fromStatusId: number;
  toStatusId: number;
  name: string;
  isActive: boolean;
  approvalRules: ProjectWorkflowApprovalRule[];
};

export type ProjectWorkflowStatusDetail = {
  id: number;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number;
  category: WorkflowStatusCategory;
  color: string | null;
  isInitial: boolean;
  isFinal: boolean;
};

export type ProjectWorkflow = {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  statuses: ProjectWorkflowStatusDetail[];
  transitions: ProjectWorkflowTransition[];
};

export type ProjectWorkflowConfig = {
  canConfigure: boolean;
  projectRoles: ProjectWorkflowRole[];
  workflows: ProjectWorkflow[];
  taskTypes?: ProjectWorkflowTaskType[];
};

export type SaveProjectWorkflowPayload = {
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type SaveProjectWorkflowStatusPayload = {
  name: string;
  description: string | null;
  category: WorkflowStatusCategory;
  color: string | null;
  isInitial: boolean;
  isFinal: boolean;
};

export type CreateProjectWorkflowStatusPayload =
  SaveProjectWorkflowStatusPayload & {
    key: string;
    sortOrder: number;
  };

export type SaveProjectWorkflowTransitionPayload = {
  name: string;
  isActive: boolean;
};

export type CreateProjectWorkflowTransitionPayload = {
  fromStatusId: number;
  toStatusId: number;
  name: string;
};

export type SaveProjectApprovalRulePayload = {
  approverType: WorkflowApproverType;
  projectRoleId: number | null;
  taskRole: WorkflowTaskRole | null;
  minApprovals: number;
  onRejectStatusId: number;
};

export type ProjectMemberRole = {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
};

export type ProjectMemberItem = {
  userId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  isMe: boolean;
  joinedAt: string;
  roles: ProjectMemberRole[];
};

export type ProjectMembersData = {
  total: number;
  canManage: boolean;
  myRoles: ProjectMemberRole[];
  roles: ProjectMemberRole[];
  members: ProjectMemberItem[];
};

export type ProjectMemberCandidate = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export type AddProjectMemberPayload = {
  userId: number;
  roleIds: number[];
};
