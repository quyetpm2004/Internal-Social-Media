import { Prisma, TaskDependencyLogic } from "@prisma/client";
import {
  mapDependencyGroup,
  mapTaskDependencies,
} from "@/modules/project/project.mapper";
import * as dependencyRepository from "@/modules/project/project-dependency.repository";
import * as projectRepository from "@/modules/project/project.repository";
import * as projectTaskRepository from "@/modules/project/project-task.repository";
import type {
  CreateDependencyGroupInput,
  NewTaskDependencyInput,
  SaveTaskDependencyInput,
  UpdateDependencyGroupInput,
} from "@/modules/project/project.schema";
import { findCycle } from "@/modules/project/scheduling/graph";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";

const FORBIDDEN = "Bạn không có quyền thực hiện thao tác này";
const TASK_NOT_FOUND = "Không tìm thấy công việc";
const DEPENDENCY_NOT_FOUND = "Không tìm thấy quan hệ phụ thuộc";
const GROUP_INVALID = "Nhóm điều kiện không hợp lệ";
const DUPLICATE_DEPENDENCY =
  "Quan hệ phụ thuộc giữa hai công việc này đã tồn tại";

type EditableTask = { id: number; createdById: number };

function isUniqueError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function assertCanView(projectId: number, userId: number) {
  await projectRepository.findVisibleProject(projectId, userId);
}

async function requireTask(projectId: number, taskId: number) {
  const task = await dependencyRepository.findTaskInProject(
    prisma,
    projectId,
    taskId,
  );
  if (!task) {
    throw new AppError(404, TASK_NOT_FOUND);
  }
  return task;
}

async function canEditDependencies(
  projectId: number,
  userId: number,
  task: EditableTask,
) {
  const membership = await projectTaskRepository.isProjectMember(
    projectId,
    userId,
  );
  if (!membership) return false;
  if (task.createdById === userId) return true;
  return projectRepository.canManageMembers(projectId, userId);
}

async function assertPredecessor(
  tx: Prisma.TransactionClient,
  projectId: number,
  taskId: number,
  predecessorTaskId: number,
) {
  if (predecessorTaskId === taskId) {
    throw new AppError(400, "Công việc không thể phụ thuộc vào chính nó");
  }
  const predecessor = await dependencyRepository.findTaskInProject(
    tx,
    projectId,
    predecessorTaskId,
  );
  if (!predecessor) {
    throw new AppError(400, "Công việc tiền nhiệm không hợp lệ");
  }
}

async function resolveTargetGroup(
  tx: Prisma.TransactionClient,
  taskId: number,
  groupId: number | null,
) {
  if (groupId == null) {
    const group = await dependencyRepository.createGroup(tx, {
      taskId,
      logicType: TaskDependencyLogic.AND,
      selectionMode: "MANUAL",
    });
    return group.id;
  }
  const group = await dependencyRepository.findGroup(tx, groupId);
  if (!group || group.taskId !== taskId) {
    throw new AppError(400, GROUP_INVALID);
  }
  return group.id;
}

async function requireDependency(
  tx: Prisma.TransactionClient,
  taskId: number,
  dependencyId: number,
) {
  const [dependency] = await dependencyRepository.findDependencies(tx, [
    dependencyId,
  ]);
  if (!dependency || dependency.successorTaskId !== taskId) {
    throw new AppError(404, DEPENDENCY_NOT_FOUND);
  }
  return dependency;
}

async function assertNoMandatoryCycle(
  tx: Prisma.TransactionClient,
  projectId: number,
) {
  const rows = await dependencyRepository.listProjectDependencyEdges(
    tx,
    projectId,
  );
  const edges = rows
    .filter(
      (row) =>
        row.group.logicType === TaskDependencyLogic.AND ||
        row.group._count.dependencies === 1,
    )
    .map((row) => ({ from: row.predecessorTaskId, to: row.successorTaskId }));
  const cycle = findCycle(edges);
  if (!cycle) return;

  const tasks = await dependencyRepository.findTaskCodes(tx, [
    ...new Set(cycle),
  ]);
  const codeById = new Map(tasks.map((task) => [task.id, task.code]));
  const codes = cycle.map((id) => codeById.get(id) ?? `#${id}`);
  throw new AppError(
    400,
    `Quan hệ phụ thuộc tạo thành vòng lặp: ${codes.join(" → ")}`,
  );
}

async function mutate(
  projectId: number,
  taskId: number,
  userId: number,
  write: (tx: Prisma.TransactionClient) => Promise<void>,
  checkCycle = true,
) {
  await assertCanView(projectId, userId);
  const task = await requireTask(projectId, taskId);
  if (!(await canEditDependencies(projectId, userId, task))) {
    throw new AppError(403, FORBIDDEN);
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await write(tx);
        if (checkCycle) {
          await assertNoMandatoryCycle(tx, projectId);
        }
      },
      { timeout: 15000 },
    );
  } catch (error) {
    if (isUniqueError(error)) {
      throw new AppError(400, DUPLICATE_DEPENDENCY);
    }
    throw error;
  }

  return getTaskDependencies(projectId, taskId, userId);
}

export async function createInitialDependencies(
  tx: Prisma.TransactionClient,
  projectId: number,
  taskId: number,
  dependencies: NewTaskDependencyInput[],
) {
  const predecessorIds = dependencies.map((item) => item.predecessorTaskId);
  if (new Set(predecessorIds).size !== predecessorIds.length) {
    throw new AppError(400, DUPLICATE_DEPENDENCY);
  }

  for (const item of dependencies) {
    await assertPredecessor(tx, projectId, taskId, item.predecessorTaskId);
    const group = await dependencyRepository.createGroup(tx, {
      taskId,
      logicType: TaskDependencyLogic.AND,
      selectionMode: "MANUAL",
    });
    await dependencyRepository.createDependency(tx, {
      groupId: group.id,
      predecessorTaskId: item.predecessorTaskId,
      successorTaskId: taskId,
      relationshipType: item.relationshipType,
      lag: item.lag,
      lagUnit: item.lagUnit,
    });
  }
}

export async function getProjectDependencies(
  projectId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  const groups = await dependencyRepository.listProjectGroups(projectId);
  return { groups: groups.map(mapDependencyGroup) };
}

export async function getTaskDependencies(
  projectId: number,
  taskId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  const task = await requireTask(projectId, taskId);
  const [groups, successors, canEdit] = await Promise.all([
    dependencyRepository.listTaskGroups(taskId),
    dependencyRepository.listTaskSuccessors(taskId),
    canEditDependencies(projectId, userId, task),
  ]);
  return mapTaskDependencies({ canEdit, groups, successors });
}

export async function createTaskDependency(
  projectId: number,
  taskId: number,
  userId: number,
  input: SaveTaskDependencyInput,
) {
  return mutate(projectId, taskId, userId, async (tx) => {
    await assertPredecessor(tx, projectId, taskId, input.predecessorTaskId);
    const groupId = await resolveTargetGroup(tx, taskId, input.groupId);
    await dependencyRepository.createDependency(tx, {
      groupId,
      predecessorTaskId: input.predecessorTaskId,
      successorTaskId: taskId,
      relationshipType: input.relationshipType,
      lag: input.lag,
      lagUnit: input.lagUnit,
    });
  });
}

export async function updateTaskDependency(
  projectId: number,
  taskId: number,
  dependencyId: number,
  userId: number,
  input: SaveTaskDependencyInput,
) {
  return mutate(projectId, taskId, userId, async (tx) => {
    const dependency = await requireDependency(tx, taskId, dependencyId);
    await assertPredecessor(tx, projectId, taskId, input.predecessorTaskId);

    const moving = input.groupId !== dependency.groupId;
    const groupId = moving
      ? await resolveTargetGroup(tx, taskId, input.groupId)
      : dependency.groupId;
    if (moving && dependency.selectedBy) {
      await dependencyRepository.clearGroupSelection(tx, [dependencyId]);
    }

    await dependencyRepository.updateDependency(tx, dependencyId, {
      groupId,
      predecessorTaskId: input.predecessorTaskId,
      relationshipType: input.relationshipType,
      lag: input.lag,
      lagUnit: input.lagUnit,
    });
    if (moving) {
      await dependencyRepository.deleteEmptyGroups(tx, [dependency.groupId]);
    }
  });
}

export async function deleteTaskDependency(
  projectId: number,
  taskId: number,
  dependencyId: number,
  userId: number,
) {
  return mutate(
    projectId,
    taskId,
    userId,
    async (tx) => {
      const dependency = await requireDependency(tx, taskId, dependencyId);
      await dependencyRepository.deleteDependency(tx, dependencyId);
      await dependencyRepository.deleteEmptyGroups(tx, [dependency.groupId]);
    },
    false,
  );
}

export async function createDependencyGroup(
  projectId: number,
  taskId: number,
  userId: number,
  input: CreateDependencyGroupInput,
) {
  return mutate(projectId, taskId, userId, async (tx) => {
    const dependencyIds = [...new Set(input.dependencyIds)];
    const dependencies = await dependencyRepository.findDependencies(
      tx,
      dependencyIds,
    );
    if (
      dependencies.length !== dependencyIds.length ||
      dependencies.some((dependency) => dependency.successorTaskId !== taskId)
    ) {
      throw new AppError(400, GROUP_INVALID);
    }

    await dependencyRepository.clearGroupSelection(tx, dependencyIds);
    const group = await dependencyRepository.createGroup(tx, {
      taskId,
      logicType: input.logicType,
      selectionMode: input.selectionMode,
    });
    await dependencyRepository.moveDependencies(tx, dependencyIds, group.id);
    await dependencyRepository.deleteEmptyGroups(tx, [
      ...new Set(dependencies.map((dependency) => dependency.groupId)),
    ]);
  });
}

export async function updateDependencyGroup(
  projectId: number,
  taskId: number,
  groupId: number,
  userId: number,
  input: UpdateDependencyGroupInput,
) {
  return mutate(projectId, taskId, userId, async (tx) => {
    const group = await dependencyRepository.findGroup(tx, groupId);
    if (!group || group.taskId !== taskId) {
      throw new AppError(404, "Không tìm thấy nhóm điều kiện");
    }

    const keepsSelection =
      input.logicType === TaskDependencyLogic.OR &&
      input.selectionMode === "MANUAL";
    const selectedDependencyId = keepsSelection
      ? input.selectedDependencyId
      : null;
    if (
      selectedDependencyId != null &&
      !group.dependencies.some(
        (dependency) => dependency.id === selectedDependencyId,
      )
    ) {
      throw new AppError(400, "Phụ thuộc được chọn không thuộc nhóm này");
    }

    await dependencyRepository.updateGroup(tx, groupId, {
      logicType: input.logicType,
      selectionMode: input.selectionMode,
      selectedDependencyId,
    });
  });
}
