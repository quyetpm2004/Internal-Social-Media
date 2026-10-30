import type { KpiResponse } from "@/features/work/types/kpi.type";

export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type KpiRange = "week" | "month" | "custom";

export type KpiMemberRow = {
  id: number;
  name: string;
  email: string;
  position: string | null;
  avatarKey: string | null;
  assigned: number;
  done: number;
  late: number;
  reopened: number | null;
  completionRate: number | null;
  onTimeRate: number | null;
  avgDelayDays: number | null;
  score: number | null;
  previousScore: number | null;
  trend: (number | null)[];
};

export type DepartmentKpi = {
  period: KpiRange;
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  department: { id: number; name: string };
  summary: {
    memberCount: number;
    assigned: number;
    done: number;
    late: number;
    reopened: number | null;
    completionRate: number | null;
    onTimeRate: number | null;
    score: number | null;
    previousScore: number | null;
  };
  members: KpiMemberRow[];
  needSupport: number[];
  trend: {
    from: string;
    to: string;
    completionRate: number | null;
    onTimeRate: number | null;
    score: number | null;
  }[];
};

export type KpiViewedMember = {
  id: number;
  name: string;
  email: string;
  position: string | null;
  avatarKey: string | null;
};

export type MemberKpiResponse = KpiResponse & { member: KpiViewedMember };

export type KpiQueryParams = {
  period: KpiRange;
  from?: string;
  to?: string;
};

export type OverviewPeriod = "week" | "month" | "quarter";

export type OverviewMember = {
  id: number;
  name: string;
  email: string;
  position: string | null;
  avatarKey: string | null;
  assigned: number;
  done: number;
  late: number;
  reopened: number | null;
  completionRate: number | null;
  onTimeRate: number | null;
  score: number | null;
  previousScore: number | null;
  workload: {
    open: number;
    overdue: number;
    dueToday: number;
    remainingHours: number;
  };
};

export type OverviewPriorityTask = {
  id: number;
  code: string;
  title: string;
  project: string | null;
  priority: TaskPriority;
  status: string;
  dueDate: string;
  kind: "overdue" | "today";
  lateDays: number;
  assignees: { id: number; name: string }[];
};

export type DepartmentOverview = {
  period: OverviewPeriod;
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  department: { id: number; name: string };
  summary: {
    memberCount: number;
    running: number;
    done: number;
    overdue: number;
    dueToday: number;
    completionRate: number | null;
    onTimeRate: number | null;
    score: number | null;
    previousScore: number | null;
  };
  counts: {
    assigned: number;
    done: number;
    onTime: number;
    late: number;
    reopened: number | null;
  };
  status: { todo: number; inProgress: number; done: number; cancelled: number };
  members: OverviewMember[];
  topPerformers: number[];
  needSupport: number[];
  trend: {
    from: string;
    to: string;
    completionRate: number | null;
    onTimeRate: number | null;
    reopenRate: number | null;
  }[];
  priorityTasks: OverviewPriorityTask[];
  priorityTotals: { overdue: number; dueToday: number };
};
