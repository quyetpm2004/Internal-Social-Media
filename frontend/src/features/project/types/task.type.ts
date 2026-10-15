import type { Pagination } from "@/features/admin/types/admin.type";
import type { ProjectPriority } from "@/features/project/types/project.type";

export type TaskMatch = "title" | "title_or_code";
export type TaskView = "table" | "grid";

export type TaskRef = {
  id: number;
  code: string;
  title: string;
};

export type TaskStatusInfo = {
  id: number;
  name: string;
  key: string;
  color: string | null;
  category: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
};

export type TaskTypeInfo = {
  id: number;
  name: string;
  key: string;
};

export type TaskWorkflowInfo = {
  id: number;
  name: string;
};

export type TaskPerson = {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
};

export type TaskAssignee = TaskPerson & {
  projectRole: {
    id: number;
    key: string;
    name: string;
  };
};

export type TaskListItem = {
  id: number;
  code: string;
  title: string;
  taskType: TaskTypeInfo;
  workflow: TaskWorkflowInfo;
  status: TaskStatusInfo;
  assignees: TaskAssignee[];
  priority: ProjectPriority;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  estimatedMinutes: number | null;
  parent: TaskRef | null;
  childCount: number;
  canEdit: boolean;
};

export type TaskStatusSummary = {
  id: number;
  name: string;
  key: string;
  color: string | null;
  sortOrder: number;
  count: number;
  category?: TaskStatusInfo["category"];
};

export type TaskWorkflowSummary = {
  id: number;
  name: string;
  count: number;
};

export type TaskListSummary = {
  mode: "status" | "workflow";
  statuses?: TaskStatusSummary[];
  workflows?: TaskWorkflowSummary[];
};

export type TaskListResponse = {
  tasks: TaskListItem[];
  pagination: Pagination;
  summary: TaskListSummary;
};

export type TaskListParams = {
  page?: number;
  limit?: number;
  keyword?: string;
  match?: TaskMatch;
  workflowId?: number;
  taskTypeId?: number;
  statusId?: number;
  statusIds?: number[];
  assigneeId?: number;
  reporterId?: number;
  reviewerId?: number;
  date?: string;
};

export type TaskChildPayload = {
  title: string;
  estimatedMinutes: number | null;
};

export type SaveTaskPayload = {
  title: string;
  description: string | null;
  workflowId: number;
  taskTypeId: number;
  statusId: number;
  priority: ProjectPriority;
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  parentTaskId: number | null;
  assignees: Array<{ projectRoleId: number; userId: number }>;
  reporterId: number;
  reviewerIds: number[];
  children: TaskChildPayload[];
};

export type TaskChild = {
  id: number;
  code: string;
  title: string;
  estimatedMinutes: number | null;
  status: TaskStatusInfo;
  priority: ProjectPriority;
};

export type TaskComment = {
  id: number;
  content: string;
  createdAt: string;
  author: TaskPerson;
};

export type TaskDetail = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  workflowId: number;
  taskTypeId: number;
  statusId: number;
  taskType: TaskTypeInfo;
  workflow: TaskWorkflowInfo;
  status: TaskStatusInfo;
  statusOptions: TaskStatusInfo[];
  priority: ProjectPriority;
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  parent: TaskRef | null;
  children: TaskChild[];
  assignees: TaskAssignee[];
  reporter: TaskPerson | null;
  reviewers: TaskPerson[];
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canChangeStatus: boolean;
};
