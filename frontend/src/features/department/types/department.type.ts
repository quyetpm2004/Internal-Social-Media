export type MemberStatus = "ACTIVE" | "REMOTE" | "LEAVE";

export type MemberRole = "LEADER" | "MEMBER";

export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type DepartmentStatus = {
  id: string;
  name: string;
  category: StatusCategory;
  color: string;
  isInitial: boolean;
  isFinal: boolean;
};

export type DepartmentWorkflow = {
  name: string;
  description: string;
};

export type TaskRecurrence = "NONE" | "WEEKLY" | "MONTHLY";

export type DepartmentInfo = {
  id: number;
  code: string;
  name: string;
  leaderId: number;
};

export type DepartmentMember = {
  id: number;
  name: string;
  email: string;
  position: string;
  role: MemberRole;
  status: MemberStatus;
  capacityHours: number;
};

export type MemberInput = {
  name: string;
  email: string;
  position: string;
  status: MemberStatus;
  capacityHours: number;
};

export type DepartmentTask = {
  id: number;
  code: string;
  title: string;
  priority: TaskPriority;
  statusId: string;
  description: string;
  assigneeIds: number[];
  reporterId: number | null;
  reviewerIds: number[];
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  estimatedHours: number;
  recurrence: TaskRecurrence;
  project: string | null;
};

export type MemberKpi = {
  memberId: number;
  assigned: number;
  done: number;
  late: number;
  reopened: number;
  estimatedHours: number;
  actualHours: number;
  score: number;
  previousScore: number;
  trend: number[];
};

export type KpiRange = "week" | "month" | "custom";

export type NewTaskInput = {
  title: string;
  description: string;
  priority: TaskPriority;
  statusId: string;
  assigneeIds: number[];
  reporterId: number | null;
  reviewerIds: number[];
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number;
  recurrence: TaskRecurrence;
  parentCode: string | null;
  children: string[];
  attachments: string[];
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
  project: string;
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
