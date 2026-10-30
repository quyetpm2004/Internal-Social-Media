import type {
  StatusCategory,
  TaskPriority,
} from "@/features/department/types/department.type";
import type {
  TaskAttachment,
  TaskChild,
  TaskPerson,
  TaskRef,
  TaskStatusInfo,
} from "@/features/project/types/task.type";

export type DepartmentTaskStatus = {
  id: number;
  name: string;
  key: string;
  category: StatusCategory;
  color: string | null;
  isInitial: boolean;
  isFinal: boolean;
  sortOrder: number;
  taskCount: number;
};

export type DepartmentTaskWorkflow = {
  id: number;
  name: string;
  description: string;
};

export type DepartmentTaskConfig = {
  workflow: DepartmentTaskWorkflow;
  statuses: DepartmentTaskStatus[];
};

export type DepartmentTaskItem = {
  id: number;
  code: string;
  title: string;
  priority: TaskPriority;
  statusId: number;
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  parentTaskId: number | null;
  childCount: number;
  assignee: { id: number; name: string } | null;
};

export type DepartmentTaskDetail = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  statusId: number;
  status: TaskStatusInfo;
  statusOptions: TaskStatusInfo[];
  workflow: { id: number; name: string };
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  parent: TaskRef | null;
  children: TaskChild[];
  assignee: TaskPerson | null;
  reporter: TaskPerson | null;
  attachments: TaskAttachment[];
  canEdit: boolean;
  canChangeStatus: boolean;
};

export type DepartmentTaskMember = {
  id: number;
  name: string;
};

export type DepartmentTaskList = {
  tasks: DepartmentTaskItem[];
  members: DepartmentTaskMember[];
};

export type SaveDepartmentTaskPayload = {
  title: string;
  description: string | null;
  statusId: number | null;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  parentTaskId: number | null;
  assigneeId: number | null;
  children: { title: string; estimatedMinutes: number | null }[];
  attachmentIds: number[];
};

export type SaveTaskConfigPayload = {
  name: string;
  description: string;
  statuses: {
    id: number | null;
    name: string;
    category: StatusCategory;
    color: string | null;
    isInitial: boolean;
    isFinal: boolean;
  }[];
};
