import type { PaginationData } from "@/components/shared/Pagination";
import type { TaskPriority } from "@/features/department/types/department.type";

export type MemberSortKey = "default" | "kpi" | "load" | "overdue";

export type MemberSortDirection = "asc" | "desc";

export type MemberPeriod = "week" | "month" | "quarter";

export type MemberPosition = {
  id: number;
  name: string;
};

export type MemberProjectLoad = {
  id: number;
  name: string;
  open: number;
  overdue: number;
};

export type MemberWorkloadSummary = {
  open: number;
  overdue: number;
  dueToday: number;
  remainingHours: number;
  loadPercent: number;
  projects: MemberProjectLoad[];
};

export type DepartmentMemberItem = {
  id: number;
  name: string;
  email: string;
  position: MemberPosition | null;
  avatarKey: string | null;
  isLeader: boolean;
  score: number | null;
  workload: MemberWorkloadSummary;
};

export type DepartmentMemberList = {
  department: { id: number; name: string };
  range: { from: string; to: string };
  items: DepartmentMemberItem[];
  pagination: PaginationData;
};

export type DepartmentMemberTask = {
  id: number;
  code: string;
  title: string;
  priority: TaskPriority;
  project: { id: number; name: string };
  status: { name: string; color: string; category: string };
  dueDate: string | null;
  isOverdue: boolean;
  estimatedHours: number;
};

export type DepartmentMemberTaskList = {
  items: DepartmentMemberTask[];
  pagination: PaginationData;
};

export type DepartmentProjectOption = {
  id: number;
  name: string;
};

export type MemberListParams = {
  page: number;
  limit: number;
  search?: string;
  projectId?: number;
  period?: MemberPeriod;
  sort?: MemberSortKey;
  direction?: MemberSortDirection;
};

export type AddMemberPayload = {
  email: string;
  positionId: number | null;
};

export type UpdateMemberPayload = {
  positionId: number | null;
};
