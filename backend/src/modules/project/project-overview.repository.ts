import prisma from "@/shared/utils/prisma";
import {
  Prisma,
  ProjectPriority,
  WorkflowStatusCategory,
} from "@prisma/client";

const CLOSED_CATEGORIES = [
  WorkflowStatusCategory.DONE,
  WorkflowStatusCategory.CANCELLED,
];

export function taskScope(projectId: number, workflowId?: number) {
  return {
    projectId,
    ...(workflowId ? { workflowId } : {}),
  } satisfies Prisma.ProjectTaskWhereInput;
}

export function groupTasksByStatus(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTask.groupBy({
    by: ["statusId"],
    where,
    _count: { _all: true },
  });
}

export function groupTasksByPriority(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTask.groupBy({
    by: ["priority"],
    where,
    _count: { _all: true },
  });
}

export function listStatuses(projectId: number, workflowId?: number) {
  return prisma.projectWorkflowStatus.findMany({
    where: {
      workflow: {
        projectId,
        ...(workflowId ? { id: workflowId } : {}),
      },
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      color: true,
    },
  });
}

export function countTasks(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTask.count({ where });
}

export function listWeekActivity(
  where: Prisma.ProjectTaskWhereInput,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return prisma.projectTask.findMany({
    where: {
      ...where,
      OR: [
        { createdAt: { gte: rangeStart, lt: rangeEnd } },
        { completedAt: { gte: rangeStart, lt: rangeEnd } },
      ],
    },
    select: { createdAt: true, completedAt: true },
  });
}

export function listAssigneeRows(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTaskMember.findMany({
    where: {
      taskRole: "ASSIGNEE",
      task: where,
    },
    select: {
      userId: true,
      user: { select: { fullName: true } },
      task: {
        select: {
          id: true,
          status: { select: { category: true } },
        },
      },
    },
  });
}

const taskNoticeSelect = {
  id: true,
  code: true,
  title: true,
  dueDate: true,
  priority: true,
} satisfies Prisma.ProjectTaskSelect;

export function listUpcomingTasks(where: Prisma.ProjectTaskWhereInput, take: number) {
  return prisma.projectTask.findMany({
    where: {
      ...where,
      dueDate: { not: null },
      status: { category: { notIn: CLOSED_CATEGORIES } },
    },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    take,
    select: taskNoticeSelect,
  });
}

export function listOverdueTasks(
  where: Prisma.ProjectTaskWhereInput,
  today: Date,
  take: number,
) {
  return prisma.projectTask.findMany({
    where: {
      ...where,
      dueDate: { lt: today },
      status: { category: { notIn: CLOSED_CATEGORIES } },
    },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    take,
    select: taskNoticeSelect,
  });
}

export function listUrgentTasks(
  where: Prisma.ProjectTaskWhereInput,
  today: Date,
  take: number,
) {
  return prisma.projectTask.findMany({
    where: {
      ...where,
      priority: ProjectPriority.URGENT,
      status: { category: { notIn: CLOSED_CATEGORIES } },
      OR: [{ dueDate: null }, { dueDate: { gte: today } }],
    },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    take,
    select: taskNoticeSelect,
  });
}

export function countAttention(
  where: Prisma.ProjectTaskWhereInput,
  today: Date,
) {
  return prisma.projectTask.count({
    where: {
      ...where,
      status: { category: { notIn: CLOSED_CATEGORIES } },
      OR: [{ dueDate: { lt: today } }, { priority: ProjectPriority.URGENT }],
    },
  });
}

export function countOverdue(where: Prisma.ProjectTaskWhereInput, today: Date) {
  return prisma.projectTask.count({
    where: {
      ...where,
      dueDate: { lt: today },
      status: { category: { notIn: CLOSED_CATEGORIES } },
    },
  });
}

export function countUrgentOpen(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTask.count({
    where: {
      ...where,
      priority: ProjectPriority.URGENT,
      status: { category: { notIn: CLOSED_CATEGORIES } },
    },
  });
}
