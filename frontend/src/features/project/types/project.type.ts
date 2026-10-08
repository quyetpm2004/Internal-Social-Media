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
  | "threads"
  | "milestones"
  | "members"
  | "overview"
  | "info";

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
