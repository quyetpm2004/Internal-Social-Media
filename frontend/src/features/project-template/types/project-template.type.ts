import type { Pagination } from "@/features/admin/types/admin.type";

export type TemplateStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type ApproverType = "PROJECT_ROLE" | "TASK_ROLE";
export type TaskRole = "ASSIGNEE" | "REVIEWER" | "REPORTER";

export type TemplateListItem = {
  id: number;
  key: string;
  name: string;
  status: TemplateStatus;
  version: number;
  updatedAt: string;
};

export type ProjectRole = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type TaskType = {
  id: number;
  workflowId: number | null;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type WorkflowStatus = {
  id: number;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number;
  category: StatusCategory;
  color: string | null;
  isInitial: boolean;
  isFinal: boolean;
};

export type ApprovalRule = {
  id: number;
  approverType: ApproverType;
  projectRoleId: number | null;
  taskRole: TaskRole | null;
  minApprovals: number;
  onRejectStatusId: number;
};

export type WorkflowTransition = {
  id: number;
  fromStatusId: number;
  toStatusId: number;
  name: string;
  isActive: boolean;
  approvalRules: ApprovalRule[];
};

export type Workflow = {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
};

export type TemplateDetail = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  status: TemplateStatus;
  version: number;
  parentTemplateId: number | null;
  createdAt: string;
  updatedAt: string;
  projectRoles: ProjectRole[];
  taskTypes: TaskType[];
  workflows: Workflow[];
};

export type TemplateListResponse = {
  templates: TemplateListItem[];
  pagination: Pagination;
};

export type ApiErrorBody = {
  message?: string;
  errors?: { field: string; message: string }[];
};
