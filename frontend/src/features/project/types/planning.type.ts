import type { ProjectPriority } from "@/features/project/types/project.type";

export type PhaseStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
export type MilestoneStatus = "OPEN" | "REACHED";
export type MilestoneTone = "upcoming" | "today" | "overdue" | "reached";

export type PlanningAssignee = {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
};

export type PlanningTask = {
  id: number;
  code: string;
  title: string;
  phaseId: number | null;
  priority: ProjectPriority;
  taskType: { id: number; name: string };
  status: {
    id: number;
    name: string;
    color: string | null;
    category: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  };
  assignees: PlanningAssignee[];
};

export type PhaseItem = {
  id: number;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: PhaseStatus;
  isOverdue: boolean;
  taskCount: number;
  doneCount: number;
  percent: number;
  tasks: PlanningTask[];
};

export type PhaseList = {
  canManage: boolean;
  phases: PhaseItem[];
};

export type SavePhasePayload = {
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status?: PhaseStatus;
  taskIds: number[];
};

export type MilestoneItem = {
  id: number;
  name: string;
  description: string | null;
  dueDate: string;
  status: MilestoneStatus;
  tone: MilestoneTone;
  daysFromToday: number;
  reachedAt: string | null;
  phase: { id: number; name: string } | null;
  taskCount: number;
  doneCount: number;
  percent: number;
  tasks: PlanningTask[];
};

export type MilestoneList = {
  canManage: boolean;
  milestones: MilestoneItem[];
};

export type SaveMilestonePayload = {
  name: string;
  description: string | null;
  dueDate: string;
  phaseId: number | null;
  status?: MilestoneStatus;
  taskIds: number[];
};

export type PlanningTaskList = {
  tasks: PlanningTask[];
};
