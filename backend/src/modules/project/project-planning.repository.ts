import prisma from "@/shared/utils/prisma";
import { Prisma, TemplateTaskRole } from "@prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

const planningTaskSelect = {
  id: true,
  code: true,
  title: true,
  priority: true,
  phaseId: true,
  taskType: { select: { id: true, name: true, sortOrder: true } },
  status: {
    select: { id: true, name: true, color: true, category: true },
  },
  members: {
    where: { taskRole: TemplateTaskRole.ASSIGNEE },
    orderBy: { id: "asc" },
    select: {
      userId: true,
      user: {
        select: {
          fullName: true,
          profile: { select: { avatarKey: true } },
        },
      },
    },
  },
} satisfies Prisma.TaskSelect;

export type PlanningTaskRow = Prisma.TaskGetPayload<{
  select: typeof planningTaskSelect;
}>;

export function listPhases(projectId: number) {
  return prisma.projectPhase.findMany({
    where: { projectId },
    orderBy: [{ id: "asc" }],
    include: {
      tasks: {
        orderBy: [{ taskType: { sortOrder: "asc" } }, { code: "asc" }],
        select: planningTaskSelect,
      },
    },
  });
}

export function findPhase(projectId: number, phaseId: number) {
  return prisma.projectPhase.findFirst({
    where: { id: phaseId, projectId },
    select: { id: true, status: true },
  });
}

export function listMilestones(projectId: number) {
  return prisma.projectMilestone.findMany({
    where: { projectId },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    include: {
      phase: { select: { id: true, name: true } },
      tasks: {
        orderBy: { taskId: "asc" },
        select: {
          task: { select: planningTaskSelect },
        },
      },
    },
  });
}

export function findMilestone(projectId: number, milestoneId: number) {
  return prisma.projectMilestone.findFirst({
    where: { id: milestoneId, projectId },
    select: { id: true, status: true, reachedAt: true },
  });
}

export function listPlanningTasks(projectId: number) {
  return prisma.task.findMany({
    where: { projectId },
    orderBy: [{ taskType: { sortOrder: "asc" } }, { code: "asc" }],
    take: 500,
    select: planningTaskSelect,
  });
}

export function findProjectTasks(
  db: Db,
  projectId: number,
  taskIds: number[],
) {
  return db.task.findMany({
    where: { projectId, id: { in: taskIds } },
    select: { id: true, phaseId: true },
  });
}

export function findPhaseInProject(
  db: Db,
  projectId: number,
  phaseId: number,
) {
  return db.projectPhase.findFirst({
    where: { id: phaseId, projectId },
    select: { id: true },
  });
}

export async function nextPhaseSort(db: Db, projectId: number) {
  const last = await db.projectPhase.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? 0) + 1;
}

export function createPhase(
  db: Db,
  data: Prisma.ProjectPhaseUncheckedCreateInput,
) {
  return db.projectPhase.create({ data, select: { id: true } });
}

export function updatePhase(
  db: Db,
  phaseId: number,
  data: Prisma.ProjectPhaseUncheckedUpdateInput,
) {
  return db.projectPhase.update({
    where: { id: phaseId },
    data,
    select: { id: true },
  });
}

export function deletePhase(phaseId: number) {
  return prisma.projectPhase.delete({
    where: { id: phaseId },
    select: { id: true },
  });
}

export function clearPhaseTasks(db: Db, projectId: number, phaseId: number) {
  return db.task.updateMany({
    where: { projectId, phaseId },
    data: { phaseId: null },
  });
}

export function releasePhaseTasksExcept(
  db: Db,
  projectId: number,
  phaseId: number,
  keepIds: number[],
) {
  return db.task.updateMany({
    where: { projectId, phaseId, id: { notIn: keepIds } },
    data: { phaseId: null },
  });
}

export function assignTasksToPhase(
  db: Db,
  projectId: number,
  phaseId: number,
  taskIds: number[],
) {
  return db.task.updateMany({
    where: { projectId, id: { in: taskIds } },
    data: { phaseId },
  });
}

export function createMilestone(
  db: Db,
  data: Prisma.ProjectMilestoneUncheckedCreateInput,
) {
  return db.projectMilestone.create({ data, select: { id: true } });
}

export function updateMilestone(
  db: Db,
  milestoneId: number,
  data: Prisma.ProjectMilestoneUncheckedUpdateInput,
) {
  return db.projectMilestone.update({
    where: { id: milestoneId },
    data,
    select: { id: true },
  });
}

export function deleteMilestone(milestoneId: number) {
  return prisma.projectMilestone.delete({
    where: { id: milestoneId },
    select: { id: true },
  });
}

export function replaceMilestoneTasks(
  db: Db,
  milestoneId: number,
  taskIds: number[],
) {
  return db.projectMilestoneTask.deleteMany({ where: { milestoneId } }).then(
    () => {
      if (taskIds.length === 0) return { count: 0 };
      return db.projectMilestoneTask.createMany({
        data: taskIds.map((taskId) => ({ milestoneId, taskId })),
      });
    },
  );
}
