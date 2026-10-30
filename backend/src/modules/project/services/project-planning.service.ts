import {
  ProjectMilestoneStatus,
  ProjectPhaseStatus,
  WorkflowStatusCategory,
} from "@prisma/client";
import { getFileUrl } from "@/modules/file/file.service";
import * as projectRepository from "@/modules/project/project.repository";
import * as planningRepository from "@/modules/project/project-planning.repository";
import type { PlanningTaskRow } from "@/modules/project/project-planning.repository";
import * as projectTaskRepository from "@/modules/project/project-task.repository";
import type {
  SaveProjectMilestoneInput,
  SaveProjectPhaseInput,
} from "@/modules/project/project.schema";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";

const AVATAR_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

async function assertCanView(projectId: number, userId: number) {
  await projectRepository.findVisibleProject(projectId, userId);
}

async function assertMember(projectId: number, userId: number) {
  const member = await projectTaskRepository.isProjectMember(projectId, userId);
  if (!member) {
    throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
  }
}

function calendarToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDateOnly(value: Date | null) {
  if (!value) return null;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function dayDiff(target: string, today: string) {
  const targetMs = Date.parse(`${target}T00:00:00.000Z`);
  const todayMs = Date.parse(`${today}T00:00:00.000Z`);
  return Math.round((targetMs - todayMs) / 86_400_000);
}

function uniqueIds(ids: number[]) {
  return [...new Set(ids)];
}

async function avatarUrlMap(keys: Array<string | null | undefined>) {
  const uniqueKeys = [
    ...new Set(keys.filter((key): key is string => Boolean(key))),
  ];
  const entries = await Promise.all(
    uniqueKeys.map(
      async (key) =>
        [key, await getFileUrl(key, AVATAR_URL_TTL_SECONDS)] as const,
    ),
  );
  return new Map(entries);
}

function mapPlanningTask(
  task: PlanningTaskRow,
  avatarUrls: Map<string, string>,
) {
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    phaseId: task.phaseId,
    priority: task.priority,
    taskType: {
      id: task.taskType?.id ?? 0,
      name: task.taskType?.name ?? "",
    },
    status: task.status,
    assignees: task.members.map((member) => ({
      userId: member.userId,
      fullName: member.user.fullName,
      avatarUrl: member.user.profile?.avatarKey
        ? (avatarUrls.get(member.user.profile.avatarKey) ?? null)
        : null,
    })),
  };
}

function taskProgress(tasks: Array<{ status: { category: WorkflowStatusCategory } }>) {
  const taskCount = tasks.length;
  const doneCount = tasks.filter(
    (task) => task.status.category === WorkflowStatusCategory.DONE,
  ).length;
  const percent =
    taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100);
  return { taskCount, doneCount, percent };
}

async function mapTasks(tasks: PlanningTaskRow[]) {
  const avatarUrls = await avatarUrlMap(
    tasks.flatMap((task) =>
      task.members.map((member) => member.user.profile?.avatarKey),
    ),
  );
  return tasks.map((task) => mapPlanningTask(task, avatarUrls));
}

async function assertTasksInProject(projectId: number, taskIds: number[]) {
  if (taskIds.length === 0) return [];
  const found = await planningRepository.findProjectTasks(
    prisma,
    projectId,
    taskIds,
  );
  if (found.length !== taskIds.length) {
    throw new AppError(400, "Có công việc không thuộc dự án này");
  }
  return found;
}

export async function getPhases(projectId: number, userId: number) {
  await assertCanView(projectId, userId);
  const [rows, member] = await Promise.all([
    planningRepository.listPhases(projectId),
    projectTaskRepository.isProjectMember(projectId, userId),
  ]);
  const today = calendarToday();
  const tasks = await mapTasks(rows.flatMap((phase) => phase.tasks));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  const phases = rows
    .map((phase) => {
      const phaseTasks = phase.tasks.map((task) => tasksById.get(task.id)!);
      const startDate = formatDateOnly(phase.startDate);
      const endDate = formatDateOnly(phase.endDate);
      return {
        id: phase.id,
        name: phase.name,
        goal: phase.goal,
        startDate,
        endDate,
        status: phase.status,
        isOverdue:
          phase.status !== ProjectPhaseStatus.COMPLETED &&
          Boolean(endDate) &&
          endDate! < today,
        ...taskProgress(phaseTasks),
        tasks: phaseTasks,
      };
    })
    .sort((left, right) => {
      const rank = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 };
      const byStatus = rank[left.status] - rank[right.status];
      if (byStatus !== 0) return byStatus;
      if (left.status === ProjectPhaseStatus.COMPLETED) {
        return (right.endDate ?? "").localeCompare(left.endDate ?? "");
      }
      return (
        (left.startDate ?? "9999-99-99").localeCompare(
          right.startDate ?? "9999-99-99",
        ) || left.id - right.id
      );
    });

  return { canManage: Boolean(member), phases };
}

export async function getPlanningTasks(projectId: number, userId: number) {
  await assertCanView(projectId, userId);
  const rows = await planningRepository.listPlanningTasks(projectId);
  return { tasks: await mapTasks(rows) };
}

export async function createPhase(
  projectId: number,
  userId: number,
  input: SaveProjectPhaseInput,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  const taskIds = uniqueIds(input.taskIds);
  const found = await assertTasksInProject(projectId, taskIds);
  const taken = found.find((task) => task.phaseId != null);
  if (taken) {
    throw new AppError(400, "Có công việc đã thuộc giai đoạn khác");
  }

  const phaseId = await prisma.$transaction(async (tx) => {
    const sortOrder = await planningRepository.nextPhaseSort(tx, projectId);
    const created = await planningRepository.createPhase(tx, {
      projectId,
      name: input.name,
      goal: input.goal,
      startDate: toDate(input.startDate),
      endDate: toDate(input.endDate),
      status: input.status ?? ProjectPhaseStatus.PLANNED,
      sortOrder,
      createdById: userId,
    });
    if (taskIds.length > 0) {
      await planningRepository.assignTasksToPhase(
        tx,
        projectId,
        created.id,
        taskIds,
      );
    }
    return created.id;
  });

  return { id: phaseId };
}

export async function updatePhase(
  projectId: number,
  phaseId: number,
  userId: number,
  input: SaveProjectPhaseInput,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  const current = await planningRepository.findPhase(projectId, phaseId);
  if (!current) throw new AppError(404, "Không tìm thấy giai đoạn");

  const taskIds = uniqueIds(input.taskIds);
  const found = await assertTasksInProject(projectId, taskIds);
  const taken = found.find(
    (task) => task.phaseId != null && task.phaseId !== phaseId,
  );
  if (taken) {
    throw new AppError(400, "Có công việc đã thuộc giai đoạn khác");
  }

  await prisma.$transaction(async (tx) => {
    await planningRepository.updatePhase(tx, phaseId, {
      name: input.name,
      goal: input.goal,
      startDate: toDate(input.startDate),
      endDate: toDate(input.endDate),
      status: input.status ?? current.status,
    });
    if (taskIds.length === 0) {
      await planningRepository.clearPhaseTasks(tx, projectId, phaseId);
      return;
    }
    await planningRepository.releasePhaseTasksExcept(
      tx,
      projectId,
      phaseId,
      taskIds,
    );
    await planningRepository.assignTasksToPhase(
      tx,
      projectId,
      phaseId,
      taskIds,
    );
  });

  return { id: phaseId };
}

export async function removePhase(
  projectId: number,
  phaseId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  const current = await planningRepository.findPhase(projectId, phaseId);
  if (!current) throw new AppError(404, "Không tìm thấy giai đoạn");
  await planningRepository.deletePhase(phaseId);
  return { id: phaseId };
}

export async function getMilestones(projectId: number, userId: number) {
  await assertCanView(projectId, userId);
  const [rows, member] = await Promise.all([
    planningRepository.listMilestones(projectId),
    projectTaskRepository.isProjectMember(projectId, userId),
  ]);
  const today = calendarToday();
  const tasks = await mapTasks(rows.flatMap((row) => row.tasks.map((link) => link.task)));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  const milestones = rows.map((row) => {
    const linked = row.tasks.map((link) => tasksById.get(link.task.id)!);
    const dueDate = formatDateOnly(row.dueDate)!;
    const daysFromToday = dayDiff(dueDate, today);
    const tone =
      row.status === ProjectMilestoneStatus.REACHED
        ? "reached"
        : daysFromToday < 0
          ? "overdue"
          : daysFromToday === 0
            ? "today"
            : "upcoming";
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      dueDate,
      status: row.status,
      tone,
      daysFromToday,
      reachedAt: row.reachedAt,
      phase: row.phase,
      ...taskProgress(linked),
      tasks: linked,
    };
  });

  return { canManage: Boolean(member), milestones };
}

export async function createMilestone(
  projectId: number,
  userId: number,
  input: SaveProjectMilestoneInput,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  const taskIds = uniqueIds(input.taskIds);
  await assertTasksInProject(projectId, taskIds);
  if (input.phaseId != null) {
    const phase = await planningRepository.findPhaseInProject(
      prisma,
      projectId,
      input.phaseId,
    );
    if (!phase) throw new AppError(400, "Giai đoạn không thuộc dự án này");
  }

  const status = input.status ?? ProjectMilestoneStatus.OPEN;
  const milestoneId = await prisma.$transaction(async (tx) => {
    const created = await planningRepository.createMilestone(tx, {
      projectId,
      phaseId: input.phaseId,
      name: input.name,
      description: input.description,
      dueDate: toDate(input.dueDate)!,
      status,
      reachedAt: status === ProjectMilestoneStatus.REACHED ? new Date() : null,
      createdById: userId,
    });
    await planningRepository.replaceMilestoneTasks(tx, created.id, taskIds);
    return created.id;
  });

  return { id: milestoneId };
}

export async function updateMilestone(
  projectId: number,
  milestoneId: number,
  userId: number,
  input: SaveProjectMilestoneInput,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  const current = await planningRepository.findMilestone(projectId, milestoneId);
  if (!current) throw new AppError(404, "Không tìm thấy cột mốc");
  const taskIds = uniqueIds(input.taskIds);
  await assertTasksInProject(projectId, taskIds);
  if (input.phaseId != null) {
    const phase = await planningRepository.findPhaseInProject(
      prisma,
      projectId,
      input.phaseId,
    );
    if (!phase) throw new AppError(400, "Giai đoạn không thuộc dự án này");
  }

  const status = input.status ?? current.status;
  const reachedAt =
    status === ProjectMilestoneStatus.REACHED
      ? (current.reachedAt ?? new Date())
      : null;

  await prisma.$transaction(async (tx) => {
    await planningRepository.updateMilestone(tx, milestoneId, {
      name: input.name,
      description: input.description,
      dueDate: toDate(input.dueDate)!,
      phaseId: input.phaseId,
      status,
      reachedAt,
    });
    await planningRepository.replaceMilestoneTasks(tx, milestoneId, taskIds);
  });

  return { id: milestoneId };
}

export async function removeMilestone(
  projectId: number,
  milestoneId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  const current = await planningRepository.findMilestone(projectId, milestoneId);
  if (!current) throw new AppError(404, "Không tìm thấy cột mốc");
  await planningRepository.deleteMilestone(milestoneId);
  return { id: milestoneId };
}
