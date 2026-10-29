import type {
  DepartmentStatus,
  DepartmentTask,
  MemberStatus,
  TaskPriority,
} from "@/features/department/types/department.type";

const AT_RISK_WINDOW_DAYS = 3;
const AT_RISK_PROGRESS = 60;

export function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shiftIso(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDue(due: string | null) {
  if (!due) return "—";
  const [year, month, day] = due.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

export function taskRules(statuses: DepartmentStatus[]) {
  const closedIds = new Set(
    statuses
      .filter((status) => status.category === "DONE" || status.category === "CANCELLED")
      .map((status) => status.id),
  );

  const isOpen = (task: DepartmentTask) => !closedIds.has(task.statusId);

  const isOverdue = (task: DepartmentTask) =>
    isOpen(task) && task.dueDate !== null && task.dueDate < todayIso();

  const isAtRisk = (task: DepartmentTask) => {
    if (!isOpen(task) || isOverdue(task) || task.dueDate === null) return false;
    const limit = shiftIso(todayIso(), AT_RISK_WINDOW_DAYS);
    return task.dueDate <= limit && task.progress < AT_RISK_PROGRESS;
  };

  return { isOpen, isOverdue, isAtRisk };
}

export type TaskRules = ReturnType<typeof taskRules>;

export const PRIORITIES: TaskPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export const priorityTone: Record<TaskPriority, string> = {
  URGENT: "bg-rose-50 text-rose-600",
  HIGH: "bg-amber-50 text-amber-700",
  MEDIUM: "bg-blue-50 text-blue-600",
  LOW: "bg-slate-100 text-slate-600",
};

export const priorityColor: Record<TaskPriority, string> = {
  URGENT: "#f43f5e",
  HIGH: "#f59e0b",
  MEDIUM: "#0A6AF6",
  LOW: "#94a3b8",
};

export const memberStatusTone: Record<MemberStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  REMOTE: "bg-sky-50 text-sky-700",
  LEAVE: "bg-slate-100 text-slate-500",
};

export const AVATAR_TONES = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-indigo-500",
  "bg-teal-600",
];

export function scoreBadge(score: number) {
  if (score >= 85) return "bg-emerald-50 text-emerald-700";
  if (score >= 70) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-600";
}

export function percentOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
