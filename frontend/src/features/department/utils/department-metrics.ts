import type {
  DepartmentMember,
  DepartmentStatus,
  DepartmentTask,
  MemberKpi,
} from "@/features/department/types/department.type";
import {
  percentOf,
  taskRules,
} from "@/features/department/utils/department-task";

export type MemberWorkload = {
  open: number;
  done: number;
  overdue: number;
  atRisk: number;
  remainingHours: number;
  loadPercent: number;
};

export function memberWorkload(
  member: DepartmentMember,
  tasks: DepartmentTask[],
  statuses: DepartmentStatus[],
): MemberWorkload {
  const { isOpen, isOverdue, isAtRisk } = taskRules(statuses);
  const mine = tasks.filter((task) => task.assigneeIds.includes(member.id));
  const openTasks = mine.filter(isOpen);
  const remainingHours = openTasks.reduce(
    (sum, task) =>
      sum +
      (task.estimatedHours * (1 - task.progress / 100)) /
        Math.max(task.assigneeIds.length, 1),
    0,
  );

  return {
    open: openTasks.length,
    done: mine.length - openTasks.length,
    overdue: mine.filter(isOverdue).length,
    atRisk: mine.filter(isAtRisk).length,
    remainingHours: Math.round(remainingHours),
    loadPercent: percentOf(remainingHours, member.capacityHours),
  };
}

export function loadTone(percent: number) {
  if (percent > 100) return "#f43f5e";
  if (percent >= 75) return "#f59e0b";
  return "#10b981";
}

export function departmentSummary(
  tasks: DepartmentTask[],
  statuses: DepartmentStatus[],
) {
  const { isOpen, isOverdue, isAtRisk } = taskRules(statuses);
  const done = tasks.filter((task) => !isOpen(task));
  const open = tasks.filter(isOpen);
  const overdue = tasks.filter(isOverdue);

  return {
    total: tasks.length,
    running: open.length,
    done: done.length,
    overdue: overdue.length,
    atRisk: tasks.filter(isAtRisk).length,
    unassigned: open.filter((task) => task.assigneeIds.length === 0).length,
    completionRate: percentOf(done.length, tasks.length),
  };
}

export function kpiTotals(kpis: MemberKpi[]) {
  const sum = (pick: (item: MemberKpi) => number) =>
    kpis.reduce((total, item) => total + pick(item), 0);
  const assigned = sum((item) => item.assigned);
  const done = sum((item) => item.done);
  const late = sum((item) => item.late);

  return {
    assigned,
    done,
    late,
    reopened: sum((item) => item.reopened),
    estimatedHours: sum((item) => item.estimatedHours),
    actualHours: sum((item) => item.actualHours),
    onTimeRate: percentOf(done - late, done),
    completionRate: percentOf(done, assigned),
    averageScore: kpis.length
      ? Math.round(sum((item) => item.score) / kpis.length)
      : 0,
  };
}
