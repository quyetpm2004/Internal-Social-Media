import {
  ProjectPriority,
  WorkflowStatusCategory,
} from "@prisma/client";
import * as projectOverviewRepository from "@/modules/project/project-overview.repository";
import * as projectRepository from "@/modules/project/project.repository";
import * as projectTaskRepository from "@/modules/project/project-task.repository";
import type { ProjectOverviewQuery } from "@/modules/project/project.schema";
import { AppError } from "@/shared/errors/app-error";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const UPCOMING_LIMIT = 5;
const ATTENTION_LIMIT = 5;

const CATEGORY_ORDER: WorkflowStatusCategory[] = [
  WorkflowStatusCategory.TODO,
  WorkflowStatusCategory.IN_PROGRESS,
  WorkflowStatusCategory.DONE,
  WorkflowStatusCategory.CANCELLED,
];

const PRIORITY_ORDER: ProjectPriority[] = [
  ProjectPriority.URGENT,
  ProjectPriority.HIGH,
  ProjectPriority.MEDIUM,
  ProjectPriority.LOW,
];

function ratioPercent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

function wholePercent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function vnParts(date: Date) {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function vnMidnight(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day) - VN_OFFSET_MS);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function todayVnDate(now = new Date()) {
  const { year, month, day } = vnParts(now);
  return new Date(Date.UTC(year, month, day));
}

function buildWeeks(count: number, now = new Date()) {
  const { year, month, day, weekday } = vnParts(now);
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const currentWeek = vnMidnight(year, month, day - daysFromMonday);
  const first = addDays(currentWeek, -7 * (count - 1));

  return Array.from({ length: count }, (_, index) => {
    const start = addDays(first, 7 * index);
    const parts = vnParts(start);
    return {
      start,
      end: addDays(start, 7),
      weekStart: `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`,
    };
  });
}

function formatDateOnly(value: Date | null) {
  if (!value) return null;
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
}

function inRange(value: Date | null, start: Date, end: Date) {
  if (!value) return false;
  return value >= start && value < end;
}

export async function getProjectOverview(
  projectId: number,
  userId: number,
  query: ProjectOverviewQuery,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  if (query.workflowId) {
    const workflow = await projectTaskRepository.findWorkflowInProject(
      projectId,
      query.workflowId,
    );
    if (!workflow) {
      throw new AppError(400, "Quy trình không hợp lệ");
    }
  }

  const where = projectOverviewRepository.taskScope(
    projectId,
    query.workflowId,
  );
  const today = todayVnDate();
  const weeks = buildWeeks(query.weeks);
  const rangeStart = weeks[0].start;
  const rangeEnd = weeks[weeks.length - 1].end;

  const [
    statusCounts,
    statuses,
    priorityCounts,
    overdue,
    urgentOpen,
    activity,
    assignees,
    upcoming,
    attentionOverdue,
    attentionTotal,
  ] = await Promise.all([
    projectOverviewRepository.groupTasksByStatus(where),
    projectOverviewRepository.listStatuses(projectId, query.workflowId),
    projectOverviewRepository.groupTasksByPriority(where),
    projectOverviewRepository.countOverdue(where, today),
    projectOverviewRepository.countUrgentOpen(where),
    projectOverviewRepository.listWeekActivity(where, rangeStart, rangeEnd),
    projectOverviewRepository.listAssigneeRows(where),
    projectOverviewRepository.listUpcomingTasks(where, UPCOMING_LIMIT),
    projectOverviewRepository.listOverdueTasks(where, today, ATTENTION_LIMIT),
    projectOverviewRepository.countAttention(where, today),
  ]);

  const attentionRoom = ATTENTION_LIMIT - attentionOverdue.length;
  const attentionUrgent =
    attentionRoom > 0
      ? await projectOverviewRepository.listUrgentTasks(
          where,
          today,
          attentionRoom,
        )
      : [];

  const countByStatus = new Map(
    statusCounts.map((row) => [row.statusId, row._count._all]),
  );
  const categoryCount = new Map<WorkflowStatusCategory, number>(
    CATEGORY_ORDER.map((category) => [category, 0]),
  );
  for (const status of statuses) {
    const count = countByStatus.get(status.id) ?? 0;
    categoryCount.set(
      status.category,
      (categoryCount.get(status.category) ?? 0) + count,
    );
  }

  const todo = categoryCount.get(WorkflowStatusCategory.TODO) ?? 0;
  const inProgress = categoryCount.get(WorkflowStatusCategory.IN_PROGRESS) ?? 0;
  const done = categoryCount.get(WorkflowStatusCategory.DONE) ?? 0;
  const cancelled = categoryCount.get(WorkflowStatusCategory.CANCELLED) ?? 0;
  const total = todo + inProgress + done + cancelled;

  const progressItems = query.workflowId
    ? statuses.map((status) => ({
        kind: "status" as const,
        id: status.id,
        name: status.name,
        color: status.color,
        count: countByStatus.get(status.id) ?? 0,
      }))
    : CATEGORY_ORDER.map((category) => ({
        kind: "category" as const,
        category,
        count: categoryCount.get(category) ?? 0,
      }));

  const priorityCount = new Map(
    priorityCounts.map((row) => [row.priority, row._count._all]),
  );

  const members = new Map<
    number,
    { userId: number; name: string; taskIds: Set<number>; doneIds: Set<number> }
  >();
  for (const row of assignees) {
    const bucket = members.get(row.userId) ?? {
      userId: row.userId,
      name: row.user.fullName,
      taskIds: new Set<number>(),
      doneIds: new Set<number>(),
    };
    bucket.taskIds.add(row.task.id);
    if (row.task.status.category === WorkflowStatusCategory.DONE) {
      bucket.doneIds.add(row.task.id);
    }
    members.set(row.userId, bucket);
  }

  return {
    updatedAt: new Date().toISOString(),
    summary: {
      total,
      todo,
      inProgress,
      done,
      cancelled,
      overdue,
      urgentOpen,
    },
    time: null,
    progress: {
      percent: ratioPercent(done, total - cancelled),
      mode: query.workflowId ? ("status" as const) : ("category" as const),
      items: progressItems,
    },
    priorities: PRIORITY_ORDER.map((priority) => ({
      priority,
      count: priorityCount.get(priority) ?? 0,
      percent: ratioPercent(priorityCount.get(priority) ?? 0, total),
    })),
    weekly: weeks.map((week) => ({
      weekStart: week.weekStart,
      completed: activity.filter((task) =>
        inRange(task.completedAt, week.start, week.end),
      ).length,
      created: activity.filter((task) =>
        inRange(task.createdAt, week.start, week.end),
      ).length,
    })),
    members: [...members.values()]
      .map((member) => {
        const assigned = member.taskIds.size;
        const memberDone = member.doneIds.size;
        return {
          userId: member.userId,
          name: member.name,
          done: memberDone,
          assigned,
          percent: wholePercent(memberDone, assigned),
        };
      })
      .sort(
        (left, right) =>
          right.percent - left.percent ||
          right.assigned - left.assigned ||
          left.name.localeCompare(right.name, "vi"),
      ),
    upcoming: upcoming.map((task) => ({
      id: task.id,
      code: task.code,
      title: task.title,
      dueDate: formatDateOnly(task.dueDate),
    })),
    timeBudget: null,
    attention: {
      total: attentionTotal,
      items: [
        ...attentionOverdue.map((task) => ({
          id: task.id,
          code: task.code,
          title: task.title,
          dueDate: formatDateOnly(task.dueDate),
          priority: task.priority,
          reason: "OVERDUE" as const,
        })),
        ...attentionUrgent.map((task) => ({
          id: task.id,
          code: task.code,
          title: task.title,
          dueDate: formatDateOnly(task.dueDate),
          priority: task.priority,
          reason: "URGENT" as const,
        })),
      ],
    },
  };
}
