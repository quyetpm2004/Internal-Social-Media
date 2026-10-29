import { WorkflowStatusCategory } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import type { KpiPeriod } from "@/modules/kpi/kpi.schema";
import * as kpiRepository from "@/modules/kpi/kpi.repository";
import type { DepartmentTaskRow } from "@/modules/kpi/kpi.repository";
import {
  KPI_TARGETS,
  addDays,
  bucketsOf,
  percent,
  rangeOf,
  round,
  summarize,
  toFacts,
  utcDate,
  vietnamIso,
} from "@/modules/kpi/kpi.service";
import type { TaskFacts } from "@/modules/kpi/kpi.service";

const PRIORITY_LIMIT = 6;
const SUPPORT_THRESHOLD = 70;
const TOP_LIMIT = 3;

type DepartmentFacts = TaskFacts & { row: DepartmentTaskRow };

function assignedTo(items: DepartmentFacts[], memberId: number) {
  return items.filter((item) =>
    item.row.members.some((member) => member.userId === memberId),
  );
}

function isOpen(item: TaskFacts) {
  return (
    item.category === WorkflowStatusCategory.TODO ||
    item.category === WorkflowStatusCategory.IN_PROGRESS
  );
}

export async function getDepartmentOverview(
  managerId: number,
  period: KpiPeriod,
) {
  const department = await kpiRepository.findManagedDepartment(managerId);
  if (!department) {
    throw new AppError(404, "Bạn chưa quản lý phòng ban nào");
  }

  const members = department.users;
  const memberIds = members.map((member) => member.id);
  const todayIso = vietnamIso(new Date());
  const range = rangeOf(period, todayIso);
  const previousRange = rangeOf(period, addDays(range.from, -1));

  const [rows, unfinishedRows] = memberIds.length
    ? await Promise.all([
        kpiRepository.findDepartmentTasks(
          memberIds,
          utcDate(previousRange.from),
          utcDate(range.to),
        ),
        kpiRepository.findDepartmentUnfinishedTasks(
          memberIds,
          utcDate(todayIso),
        ),
      ])
    : [[], []];

  const all = rows.map((row) => toFacts(row, todayIso)) as DepartmentFacts[];
  const current = all.filter((item) => item.dueIso >= range.from);
  const previous = all.filter((item) => item.dueIso < range.from);
  const unfinished = unfinishedRows.map((row) =>
    toFacts(row, todayIso),
  ) as DepartmentFacts[];

  const now = summarize(current);
  const before = summarize(previous);

  const openById = new Map<number, DepartmentFacts>();
  for (const item of [...current.filter(isOpen), ...unfinished]) {
    openById.set(item.row.id, item);
  }
  const open = [...openById.values()];
  const overdue = unfinished.filter((item) => item.dueIso < todayIso);
  const dueToday = unfinished.filter((item) => item.dueIso === todayIso);

  const memberStats = members.map((member) => {
    const stats = summarize(assignedTo(current, member.id));
    const previousStats = summarize(assignedTo(previous, member.id));
    const memberOpen = assignedTo(open, member.id);

    return {
      id: member.id,
      name: member.fullName,
      email: member.email,
      position: member.position?.name ?? null,
      avatarKey: member.profile?.avatarKey ?? null,
      assigned: stats.active.length,
      done: stats.done.length,
      late: stats.late.length,
      reopened: null,
      completionRate: stats.completionRate,
      onTimeRate: stats.onTimeRate,
      score: stats.score,
      previousScore: previousStats.score,
      workload: {
        open: memberOpen.length,
        overdue: assignedTo(overdue, member.id).length,
        dueToday: assignedTo(dueToday, member.id).length,
        remainingHours: round(
          memberOpen.reduce(
            (sum, item) => sum + (item.row.estimatedMinutes ?? 0),
            0,
          ) / 60,
        ),
      },
    };
  });

  const ranked = memberStats
    .filter((member) => member.score !== null)
    .sort((a, b) => b.score! - a.score!);
  const topPerformers = ranked.slice(0, TOP_LIMIT).map((member) => member.id);
  const needSupport = [...ranked]
    .reverse()
    .filter((member) => member.score! < SUPPORT_THRESHOLD)
    .map((member) => member.id);

  const trend = bucketsOf(period, range).map((bucket) => {
    const stats = summarize(
      current.filter(
        (item) => item.dueIso >= bucket.from && item.dueIso <= bucket.to,
      ),
    );
    return {
      from: bucket.from,
      to: bucket.to,
      completionRate: stats.completionRate,
      onTimeRate: stats.onTimeRate,
      reopenRate: null,
    };
  });

  const countByCategory = (category: WorkflowStatusCategory) =>
    current.filter((item) => item.category === category).length;

  const priorityTasks = [...overdue, ...dueToday]
    .sort((a, b) => a.dueIso.localeCompare(b.dueIso))
    .slice(0, PRIORITY_LIMIT)
    .map((item) => ({
      id: item.row.id,
      code: item.row.code,
      title: item.row.title,
      project: item.row.project.name,
      priority: item.row.priority,
      status: item.row.status.name,
      dueDate: item.dueIso,
      kind: item.dueIso < todayIso ? ("overdue" as const) : ("today" as const),
      lateDays: item.lateDays,
      assignees: item.row.members
        .map((member) => members.find((user) => user.id === member.userId))
        .filter((user) => user !== undefined)
        .map((user) => ({ id: user.id, name: user.fullName })),
    }));

  return {
    period,
    range,
    previousRange,
    targets: KPI_TARGETS,
    department: { id: department.id, name: department.name },
    summary: {
      memberCount: members.length,
      running: open.length,
      done: now.done.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      completionRate: now.completionRate,
      onTimeRate: now.onTimeRate,
      score: now.score,
      previousScore: before.score,
    },
    counts: {
      assigned: now.active.length,
      done: now.done.length,
      onTime: now.onTime.length,
      late: now.late.length,
      reopened: null,
    },
    status: {
      todo: countByCategory(WorkflowStatusCategory.TODO),
      inProgress: countByCategory(WorkflowStatusCategory.IN_PROGRESS),
      done: countByCategory(WorkflowStatusCategory.DONE),
      cancelled: countByCategory(WorkflowStatusCategory.CANCELLED),
    },
    members: memberStats,
    topPerformers,
    needSupport,
    trend,
    priorityTasks,
    priorityTotals: { overdue: overdue.length, dueToday: dueToday.length },
  };
}
