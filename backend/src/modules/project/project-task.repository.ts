import prisma from "@/shared/utils/prisma";
import { Prisma, ProjectPriority, TemplateTaskRole } from "@prisma/client";

export type TaskListFilter = {
  projectId: number;
  keyword?: string;
  match: "title" | "title_or_code";
  workflowId?: number;
  taskTypeId?: number;
  statusIds?: number[];
  assigneeId?: number;
  reporterId?: number;
  reviewerId?: number;
  date?: string;
};

const userSelect = {
  fullName: true,
  profile: { select: { avatarKey: true } },
} satisfies Prisma.UserSelect;

const projectRoleSelect = {
  id: true,
  key: true,
  name: true,
  sortOrder: true,
} satisfies Prisma.ProjectRoleSelect;

export const projectTaskListSelect = {
  id: true,
  code: true,
  title: true,
  priority: true,
  startDate: true,
  dueDate: true,
  createdAt: true,
  estimatedMinutes: true,
  createdById: true,
  taskType: { select: { id: true, name: true, key: true } },
  workflow: { select: { id: true, name: true } },
  status: {
    select: {
      id: true,
      name: true,
      key: true,
      color: true,
      category: true,
    },
  },
  parent: { select: { id: true, code: true, title: true } },
  members: {
    where: { taskRole: TemplateTaskRole.ASSIGNEE },
    orderBy: { id: "asc" },
    select: {
      userId: true,
      user: { select: userSelect },
      projectRole: { select: projectRoleSelect },
    },
  },
  _count: { select: { children: true } },
} satisfies Prisma.TaskSelect;

export const projectTaskDetailSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  workflowId: true,
  taskTypeId: true,
  statusId: true,
  priority: true,
  startDate: true,
  dueDate: true,
  estimatedMinutes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  phaseId: true,
  taskType: { select: { id: true, name: true, key: true } },
  workflow: {
    select: {
      id: true,
      name: true,
      transitionMode: true,
      statuses: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          key: true,
          color: true,
          category: true,
        },
      },
      transitions: {
        where: { isActive: true },
        select: { fromStatusId: true, toStatusId: true },
      },
    },
  },
  status: {
    select: {
      id: true,
      name: true,
      key: true,
      color: true,
      category: true,
    },
  },
  parent: { select: { id: true, code: true, title: true } },
  children: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      code: true,
      title: true,
      estimatedMinutes: true,
      priority: true,
      status: {
        select: {
          id: true,
          name: true,
          key: true,
          color: true,
          category: true,
        },
      },
    },
  },
  members: {
    orderBy: { id: "asc" },
    select: {
      userId: true,
      taskRole: true,
      user: { select: userSelect },
      projectRole: { select: projectRoleSelect },
    },
  },
} satisfies Prisma.TaskSelect;

export type ProjectTaskListRow = Prisma.TaskGetPayload<{
  select: typeof projectTaskListSelect;
}>;

export type ProjectTaskDetailRow = Prisma.TaskGetPayload<{
  select: typeof projectTaskDetailSelect;
}>;

function dateWhere(date: string): Prisma.TaskWhereInput {
  const day = new Date(`${date}T00:00:00.000Z`);
  const start = new Date(`${date}T00:00:00.000+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    OR: [
      { startDate: day },
      { dueDate: day },
      { createdAt: { gte: start, lt: end } },
    ],
  };
}

export function buildTaskWhere(
  filter: TaskListFilter,
  includeStatus: boolean,
): Prisma.TaskWhereInput {
  const and: Prisma.TaskWhereInput[] = [{ projectId: filter.projectId }];

  if (filter.workflowId) {
    and.push({ workflowId: filter.workflowId });
  }
  if (filter.taskTypeId) {
    and.push({ taskTypeId: filter.taskTypeId });
  }
  if (includeStatus && filter.statusIds && filter.statusIds.length > 0) {
    and.push({ statusId: { in: filter.statusIds } });
  }
  if (filter.keyword) {
    and.push(
      filter.match === "title_or_code"
        ? {
            OR: [
              { title: { contains: filter.keyword } },
              { code: { contains: filter.keyword } },
            ],
          }
        : { title: { contains: filter.keyword } },
    );
  }
  if (filter.assigneeId) {
    and.push({
      members: {
        some: {
          userId: filter.assigneeId,
          taskRole: TemplateTaskRole.ASSIGNEE,
        },
      },
    });
  }
  if (filter.reporterId) {
    and.push({
      members: {
        some: {
          userId: filter.reporterId,
          taskRole: TemplateTaskRole.REPORTER,
        },
      },
    });
  }
  if (filter.reviewerId) {
    and.push({
      members: {
        some: {
          userId: filter.reviewerId,
          taskRole: TemplateTaskRole.REVIEWER,
        },
      },
    });
  }
  if (filter.date) {
    and.push(dateWhere(filter.date));
  }

  return { AND: and };
}

export function isProjectMember(projectId: number, userId: number) {
  return prisma.projectMember.findFirst({
    where: { projectId, userId },
    select: { id: true },
  });
}

export function findWorkflowInProject(projectId: number, workflowId: number) {
  return prisma.workflow.findFirst({
    where: { id: workflowId, projectId },
    select: { id: true, isActive: true, isDefault: true },
  });
}

export function findTaskTypeInProject(projectId: number, taskTypeId: number) {
  return prisma.projectTaskType.findFirst({
    where: { id: taskTypeId, projectId },
    select: { id: true, workflowId: true, isActive: true },
  });
}

export function findStatusInWorkflow(workflowId: number, statusId: number) {
  return prisma.workflowStatus.findFirst({
    where: { id: statusId, workflowId },
    select: { id: true, category: true },
  });
}

export function updateProjectTaskStatus(
  taskId: number,
  statusId: number,
  updatedById: number,
  completedAt: Date | null,
) {
  return prisma.task.update({
    where: { id: taskId },
    data: { statusId, updatedById, completedAt },
    select: { id: true },
  });
}

export function listWorkflowNames(projectId: number) {
  return prisma.workflow.findMany({
    where: { projectId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}

export function listStatusSummaries(workflowId: number) {
  return prisma.workflowStatus.findMany({
    where: { workflowId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      key: true,
      color: true,
      sortOrder: true,
    },
  });
}

export function listProjectTasks(
  where: Prisma.TaskWhereInput,
  skip: number,
  take: number,
) {
  return prisma.task.findMany({
    where,
    skip,
    take,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: projectTaskListSelect,
  });
}

export function countProjectTasks(where: Prisma.TaskWhereInput) {
  return prisma.task.count({ where });
}

export function groupTaskCountsByWorkflow(where: Prisma.TaskWhereInput) {
  return prisma.task.groupBy({
    by: ["workflowId"],
    where,
    _count: { _all: true },
  });
}

export function groupTaskCountsByStatus(where: Prisma.TaskWhereInput) {
  return prisma.task.groupBy({
    by: ["statusId"],
    where,
    _count: { _all: true },
  });
}

export function findProjectTaskDetail(projectId: number, taskId: number) {
  return prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: projectTaskDetailSelect,
  });
}

export function countTasksUsingWorkflow(workflowId: number) {
  return prisma.task.count({ where: { workflowId } });
}

export function countTasksUsingStatus(statusId: number) {
  return prisma.task.count({ where: { statusId } });
}

export function countTasksUsingTaskType(taskTypeId: number) {
  return prisma.task.count({ where: { taskTypeId } });
}

export function countTasksUsingProjectRole(projectRoleId: number) {
  return prisma.taskMember.count({ where: { projectRoleId } });
}

/**
 * Cấp phát mã công việc
 */
export async function allocateTaskCodes(
  tx: Prisma.TransactionClient,
  projectId: number,
  count: number,
) {
  const project = await tx.project.update({
    where: { id: projectId },
    data: { nextTaskNumber: { increment: count } },
    select: { nextTaskNumber: true },
  });
  const end = project.nextTaskNumber;
  const start = end - count + 1;
  return Array.from({ length: count }, (_, index) => `T-${start + index}`);
}

export function findActiveWorkflow(
  tx: Prisma.TransactionClient,
  projectId: number,
  workflowId: number,
) {
  return tx.workflow.findFirst({
    where: { id: workflowId, projectId, isActive: true },
    select: { id: true, isDefault: true },
  });
}

export function findAssignableTaskType(
  tx: Prisma.TransactionClient,
  projectId: number,
  taskTypeId: number,
) {
  return tx.projectTaskType.findFirst({
    where: { id: taskTypeId, projectId, isActive: true },
    select: { id: true, workflowId: true },
  });
}

export function findWorkflowStatus(
  tx: Prisma.TransactionClient,
  workflowId: number,
  statusId: number,
) {
  return tx.workflowStatus.findFirst({
    where: { id: statusId, workflowId },
    select: { id: true, category: true },
  });
}

export function findInitialStatus(
  tx: Prisma.TransactionClient,
  workflowId: number,
) {
  return tx.workflowStatus.findFirst({
    where: { workflowId, isInitial: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, category: true },
  });
}

export function findProjectRolesByIds(
  tx: Prisma.TransactionClient,
  projectId: number,
  roleIds: number[],
) {
  return tx.projectRole.findMany({
    where: { projectId, id: { in: roleIds } },
    select: { id: true },
  });
}

export function findMemberUserIds(
  tx: Prisma.TransactionClient,
  projectId: number,
  userIds: number[],
) {
  return tx.projectMember.findMany({
    where: { projectId, userId: { in: userIds } },
    select: { userId: true },
  });
}

/**
 * Tìm công việc cha
 */
export function findTaskParent(
  tx: Prisma.TransactionClient,
  projectId: number,
  taskId: number,
) {
  return tx.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, parentTaskId: true },
  });
}

type TaskWriteData = {
  projectId: number;
  code: string;
  title: string;
  description: string | null;
  workflowId: number;
  taskTypeId: number;
  statusId: number;
  priority: ProjectPriority;
  startDate: Date | null;
  dueDate: Date | null;
  estimatedMinutes: number | null;
  parentTaskId: number | null;
  phaseId: number | null;
  createdById: number;
  completedAt: Date | null;
};

export function createProjectTask(
  tx: Prisma.TransactionClient,
  data: TaskWriteData,
) {
  return tx.task.create({
    data,
    select: { id: true },
  });
}

export function createProjectTasks(
  tx: Prisma.TransactionClient,
  data: TaskWriteData[],
) {
  return tx.task.createMany({ data });
}

export function findTaskIdsByCodes(
  tx: Prisma.TransactionClient,
  projectId: number,
  codes: string[],
) {
  return tx.task.findMany({
    where: { projectId, code: { in: codes } },
    select: { id: true },
  });
}

export type TaskMemberWrite = {
  taskId: number;
  userId: number;
  taskRole: TemplateTaskRole;
  projectRoleId: number | null;
};

export function createTaskMembers(
  tx: Prisma.TransactionClient,
  data: TaskMemberWrite[],
) {
  return tx.taskMember.createMany({ data });
}

export function replaceTaskMembers(
  tx: Prisma.TransactionClient,
  taskId: number,
  data: TaskMemberWrite[],
) {
  return tx.taskMember
    .deleteMany({ where: { taskId } })
    .then(() => tx.taskMember.createMany({ data }));
}

export function updateProjectTask(
  tx: Prisma.TransactionClient,
  taskId: number,
  data: {
    title: string;
    description: string | null;
    workflowId: number;
    taskTypeId: number;
    statusId: number;
    priority: ProjectPriority;
    startDate: Date | null;
    dueDate: Date | null;
    estimatedMinutes: number | null;
    parentTaskId: number | null;
    phaseId?: number | null;
    updatedById: number;
    completedAt: Date | null;
  },
) {
  return tx.task.update({
    where: { id: taskId },
    data,
    select: { id: true },
  });
}

export function countChildTasks(
  tx: Prisma.TransactionClient,
  projectId: number,
  taskId: number,
) {
  return tx.task.count({
    where: { projectId, parentTaskId: taskId },
  });
}

export function deleteProjectTask(
  tx: Prisma.TransactionClient,
  taskId: number,
) {
  return tx.task.delete({ where: { id: taskId } });
}

const taskFileSelect = {
  id: true,
  fileName: true,
  fileKey: true,
  mimeType: true,
  fileSize: true,
  attachmentType: true,
  source: true,
} satisfies Prisma.TaskAttachmentSelect;

const commentFileSelect = {
  id: true,
  fileName: true,
  fileKey: true,
  mimeType: true,
  fileSize: true,
  attachmentType: true,
} satisfies Prisma.TaskCommentAttachmentSelect;

const taskCommentSelect = {
  id: true,
  content: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      profile: { select: { avatarKey: true } },
    },
  },
  attachments: {
    where: { status: "READY" },
    orderBy: { id: "asc" },
    select: commentFileSelect,
  },
} satisfies Prisma.TaskCommentSelect;

export function listTaskComments(taskId: number) {
  return prisma.taskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: taskCommentSelect,
  });
}

export function listTaskAttachments(taskId: number) {
  return prisma.taskAttachment.findMany({
    where: { taskId, status: "READY" },
    orderBy: { id: "asc" },
    select: taskFileSelect,
  });
}

export function findDescriptionImageIds(
  tx: Prisma.TransactionClient,
  userId: number,
  taskId: number | null,
  keys: string[],
) {
  return tx.taskAttachment.findMany({
    where: {
      fileKey: { in: keys },
      source: "DESCRIPTION",
      attachmentType: "IMAGE",
      status: "READY",
      OR: [
        { taskId: null, uploadedById: userId },
        ...(taskId ? [{ taskId }] : []),
      ],
    },
    select: { id: true, fileKey: true },
  });
}

export async function claimTaskAttachments(
  tx: Prisma.TransactionClient,
  taskId: number,
  userId: number,
  source: "DESCRIPTION" | "FILE",
  ids: number[],
) {
  await tx.taskAttachment.updateMany({
    where: {
      taskId,
      source,
      ...(ids.length > 0 ? { id: { notIn: ids } } : {}),
    },
    data: { taskId: null },
  });

  if (ids.length === 0) return;

  const updated = await tx.taskAttachment.updateMany({
    where: {
      id: { in: ids },
      source,
      status: "READY",
      OR: [
        { taskId: null, uploadedById: userId },
        { taskId },
      ],
    },
    data: { taskId },
  });

  if (updated.count !== ids.length) {
    throw new Error(
      source === "DESCRIPTION" ? "INVALID_DESCRIPTION_IMAGE" : "INVALID_TASK_FILE",
    );
  }
}

export async function createTaskComment(
  taskId: number,
  userId: number,
  content: string,
  attachmentIds: number[],
) {
  return prisma.$transaction(async (tx) => {
    const comment = await tx.taskComment.create({
      data: { taskId, userId, content },
      select: { id: true },
    });

    if (attachmentIds.length > 0) {
      const updated = await tx.taskCommentAttachment.updateMany({
        where: {
          id: { in: attachmentIds },
          commentId: null,
          uploadedById: userId,
          status: "READY",
        },
        data: { commentId: comment.id },
      });
      if (updated.count !== attachmentIds.length) {
        throw new Error("INVALID_COMMENT_FILE");
      }
    }

    return tx.taskComment.findUniqueOrThrow({
      where: { id: comment.id },
      select: taskCommentSelect,
    });
  });
}
