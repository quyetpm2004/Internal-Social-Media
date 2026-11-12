import prisma from "@/shared/utils/prisma";
import {
  Prisma,
  TaskDependencyLagUnit,
  TaskDependencyLogic,
  TaskDependencySelectionMode,
  TaskDependencyType,
} from "@prisma/client";

const dependencyTaskSelect = {
  id: true,
  code: true,
  title: true,
  status: {
    select: {
      id: true,
      name: true,
      key: true,
      color: true,
      category: true,
    },
  },
} satisfies Prisma.TaskSelect;

const dependencyFieldsSelect = {
  id: true,
  relationshipType: true,
  lag: true,
  lagUnit: true,
} satisfies Prisma.TaskDependencySelect;

export const dependencyGroupSelect = {
  id: true,
  taskId: true,
  logicType: true,
  selectionMode: true,
  selectedDependencyId: true,
  dependencies: {
    orderBy: { id: "asc" },
    select: {
      ...dependencyFieldsSelect,
      predecessor: { select: dependencyTaskSelect },
    },
  },
} satisfies Prisma.TaskDependencyGroupSelect;

export const dependencySuccessorSelect = {
  ...dependencyFieldsSelect,
  successor: { select: dependencyTaskSelect },
} satisfies Prisma.TaskDependencySelect;

export type DependencyGroupRow = Prisma.TaskDependencyGroupGetPayload<{
  select: typeof dependencyGroupSelect;
}>;

export type DependencySuccessorRow = Prisma.TaskDependencyGetPayload<{
  select: typeof dependencySuccessorSelect;
}>;

export function listTaskGroups(taskId: number) {
  return prisma.taskDependencyGroup.findMany({
    where: { taskId },
    orderBy: { id: "asc" },
    select: dependencyGroupSelect,
  });
}

export function listTaskSuccessors(taskId: number) {
  return prisma.taskDependency.findMany({
    where: { predecessorTaskId: taskId },
    orderBy: { id: "asc" },
    select: dependencySuccessorSelect,
  });
}

export function listProjectGroups(projectId: number) {
  return prisma.taskDependencyGroup.findMany({
    where: { task: { projectId } },
    orderBy: { id: "asc" },
    select: dependencyGroupSelect,
  });
}

export function findTaskInProject(
  tx: Prisma.TransactionClient,
  projectId: number,
  taskId: number,
) {
  return tx.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, createdById: true },
  });
}

export function findGroup(tx: Prisma.TransactionClient, groupId: number) {
  return tx.taskDependencyGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      taskId: true,
      logicType: true,
      dependencies: { select: { id: true } },
    },
  });
}

export function findDependencies(
  tx: Prisma.TransactionClient,
  dependencyIds: number[],
) {
  return tx.taskDependency.findMany({
    where: { id: { in: dependencyIds } },
    select: {
      id: true,
      groupId: true,
      successorTaskId: true,
      selectedBy: { select: { id: true } },
    },
  });
}

export function createGroup(
  tx: Prisma.TransactionClient,
  data: {
    taskId: number;
    logicType: TaskDependencyLogic;
    selectionMode: TaskDependencySelectionMode;
  },
) {
  return tx.taskDependencyGroup.create({ data, select: { id: true } });
}

export function updateGroup(
  tx: Prisma.TransactionClient,
  groupId: number,
  data: {
    logicType: TaskDependencyLogic;
    selectionMode: TaskDependencySelectionMode;
    selectedDependencyId: number | null;
  },
) {
  return tx.taskDependencyGroup.update({
    where: { id: groupId },
    data,
    select: { id: true },
  });
}

export function clearGroupSelection(
  tx: Prisma.TransactionClient,
  dependencyIds: number[],
) {
  return tx.taskDependencyGroup.updateMany({
    where: { selectedDependencyId: { in: dependencyIds } },
    data: { selectedDependencyId: null },
  });
}

export type DependencyWrite = {
  groupId: number;
  predecessorTaskId: number;
  relationshipType: TaskDependencyType;
  lag: number;
  lagUnit: TaskDependencyLagUnit;
};

export function createDependency(
  tx: Prisma.TransactionClient,
  data: DependencyWrite & { successorTaskId: number },
) {
  return tx.taskDependency.create({ data, select: { id: true } });
}

export function updateDependency(
  tx: Prisma.TransactionClient,
  dependencyId: number,
  data: DependencyWrite,
) {
  return tx.taskDependency.update({
    where: { id: dependencyId },
    data,
    select: { id: true },
  });
}

export function moveDependencies(
  tx: Prisma.TransactionClient,
  dependencyIds: number[],
  groupId: number,
) {
  return tx.taskDependency.updateMany({
    where: { id: { in: dependencyIds } },
    data: { groupId },
  });
}

export function deleteDependency(
  tx: Prisma.TransactionClient,
  dependencyId: number,
) {
  return tx.taskDependency.delete({ where: { id: dependencyId } });
}

export function deleteEmptyGroups(
  tx: Prisma.TransactionClient,
  groupIds: number[],
) {
  return tx.taskDependencyGroup.deleteMany({
    where: { id: { in: groupIds }, dependencies: { none: {} } },
  });
}

export function listProjectDependencyEdges(
  tx: Prisma.TransactionClient,
  projectId: number,
) {
  return tx.taskDependency.findMany({
    where: { successor: { projectId } },
    select: {
      predecessorTaskId: true,
      successorTaskId: true,
      group: {
        select: {
          logicType: true,
          _count: { select: { dependencies: true } },
        },
      },
    },
  });
}

export function findTaskCodes(tx: Prisma.TransactionClient, taskIds: number[]) {
  return tx.task.findMany({
    where: { id: { in: taskIds } },
    select: { id: true, code: true },
  });
}
