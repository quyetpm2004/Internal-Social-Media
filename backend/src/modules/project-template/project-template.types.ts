import {
  ApprovalApproverType,
  ProjectTemplateStatus,
  TemplateTaskRole,
  WorkflowStatusCategory,
} from "@prisma/client";

export type TemplateSummary = {
  id: number;
  key: string;
  name: string;
  status: ProjectTemplateStatus;
  version: number;
  updatedAt: Date;
};

export type ProjectRoleDetail = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type TaskTypeDetail = {
  id: number;
  workflowId: number | null;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type ApprovalRuleDetail = {
  id: number;
  approverType: ApprovalApproverType;
  projectRoleId: number | null;
  taskRole: TemplateTaskRole | null;
  minApprovals: number;
  onRejectStatusId: number;
};

export type TransitionDetail = {
  id: number;
  fromStatusId: number;
  toStatusId: number;
  name: string;
  isActive: boolean;
  approvalRules: ApprovalRuleDetail[];
};

export type StatusDetail = {
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

export type WorkflowDetail = {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  statuses: StatusDetail[];
  transitions: TransitionDetail[];
};

export type TemplateDetail = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  status: ProjectTemplateStatus;
  version: number;
  parentTemplateId: number | null;
  createdAt: Date;
  updatedAt: Date;
  projectRoles: ProjectRoleDetail[];
  taskTypes: TaskTypeDetail[];
  workflows: WorkflowDetail[];
};

export type ActivationError = {
  field: string;
  message: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
