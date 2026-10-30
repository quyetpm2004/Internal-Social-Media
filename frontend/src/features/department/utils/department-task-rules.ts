import type {
  DepartmentTaskItem,
  DepartmentTaskStatus,
} from "@/features/department/types/department-task.type";
import {
  shiftIso,
  todayIso,
} from "@/features/department/utils/department-task";

const AT_RISK_WINDOW_DAYS = 3;

export function departmentTaskRules(statuses: DepartmentTaskStatus[]) {
  const closedIds = new Set(
    statuses
      .filter(
        (status) => status.category === "DONE" || status.category === "CANCELLED",
      )
      .map((status) => status.id),
  );

  const isOpen = (task: DepartmentTaskItem) => !closedIds.has(task.statusId);

  const isOverdue = (task: DepartmentTaskItem) =>
    isOpen(task) && task.dueDate !== null && task.dueDate < todayIso();

  const isAtRisk = (task: DepartmentTaskItem) => {
    if (!isOpen(task) || isOverdue(task) || task.dueDate === null) return false;
    return task.dueDate <= shiftIso(todayIso(), AT_RISK_WINDOW_DAYS);
  };

  return { isOpen, isOverdue, isAtRisk };
}

export type DepartmentTaskRules = ReturnType<typeof departmentTaskRules>;
