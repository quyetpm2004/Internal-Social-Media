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
} satisfies Prisma.ProjectTaskSelect;

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
  taskType: { select: { id: true, name: true, key: true } },
  workflow: {
    select: {
      id: true,
      name: true,
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
} satisfies Prisma.ProjectTaskSelect;

export type ProjectTaskListRow = Prisma.ProjectTaskGetPayload<{
  select: typeof projectTaskListSelect;
}>;

export type ProjectTaskDetailRow = Prisma.ProjectTaskGetPayload<{
  select: typeof projectTaskDetailSelect;
}>;

function dateWhere(date: string): Prisma.ProjectTaskWhereInput {
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
): Prisma.ProjectTaskWhereInput {
  const and: Prisma.ProjectTaskWhereInput[] = [{ projectId: filter.projectId }];

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
  return prisma.projectWorkflow.findFirst({
    where: { id: workflowId, projectId },
    select: { id: true, isActive: true },
  });
}

export function findTaskTypeInProject(projectId: number, taskTypeId: number) {
  return prisma.projectTaskType.findFirst({
    where: { id: taskTypeId, projectId },
    select: { id: true, workflowId: true, isActive: true },
  });
}

export function findStatusInWorkflow(workflowId: number, statusId: number) {
  return prisma.projectWorkflowStatus.findFirst({
    where: { id: statusId, workflowId },
    select: { id: true },
  });
}

export function listActiveTransitions(workflowId: number) {
  return prisma.projectWorkflowTransition.findMany({
    where: { workflowId, isActive: true },
    select: { fromStatusId: true, toStatusId: true },
  });
}

export function updateProjectTaskStatus(
  taskId: number,
  statusId: number,
  updatedById: number,
) {
  return prisma.projectTask.update({
    where: { id: taskId },
    data: { statusId, updatedById },
    select: { id: true },
  });
}

export function listWorkflowNames(projectId: number) {
  return prisma.projectWorkflow.findMany({
    where: { projectId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}

export function listStatusSummaries(workflowId: number) {
  return prisma.projectWorkflowStatus.findMany({
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
  where: Prisma.ProjectTaskWhereInput,
  skip: number,
  take: number,
) {
  return prisma.projectTask.findMany({
    where,
    skip,
    take,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: projectTaskListSelect,
  });
}

export function countProjectTasks(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTask.count({ where });
}

export function groupTaskCountsByWorkflow(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTask.groupBy({
    by: ["workflowId"],
    where,
    _count: { _all: true },
  });
}

export function groupTaskCountsByStatus(where: Prisma.ProjectTaskWhereInput) {
  return prisma.projectTask.groupBy({
    by: ["statusId"],
    where,
    _count: { _all: true },
  });
}

export function findProjectTaskDetail(projectId: number, taskId: number) {
  return prisma.projectTask.findFirst({
    where: { id: taskId, projectId },
    select: projectTaskDetailSelect,
  });
}

export function countTasksUsingWorkflow(workflowId: number) {
  return prisma.projectTask.count({ where: { workflowId } });
}

export function countTasksUsingStatus(statusId: number) {
  return prisma.projectTask.count({ where: { statusId } });
}

export function countTasksUsingTaskType(taskTypeId: number) {
  return prisma.projectTask.count({ where: { taskTypeId } });
}

export function countTasksUsingProjectRole(projectRoleId: number) {
  return prisma.projectTaskMember.count({ where: { projectRoleId } });
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
  return tx.projectWorkflow.findFirst({
    where: { id: workflowId, projectId, isActive: true },
    select: { id: true },
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
  return tx.projectWorkflowStatus.findFirst({
    where: { id: statusId, workflowId },
    select: { id: true },
  });
}

export function findInitialStatus(
  tx: Prisma.TransactionClient,
  workflowId: number,
) {
  return tx.projectWorkflowStatus.findFirst({
    where: { workflowId, isInitial: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
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
  return tx.projectTask.findFirst({
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
  createdById: number;
};

export function createProjectTask(
  tx: Prisma.TransactionClient,
  data: TaskWriteData,
) {
  return tx.projectTask.create({
    data,
    select: { id: true },
  });
}

export function createProjectTasks(
  tx: Prisma.TransactionClient,
  data: TaskWriteData[],
) {
  return tx.projectTask.createMany({ data });
}

export function findTaskIdsByCodes(
  tx: Prisma.TransactionClient,
  projectId: number,
  codes: string[],
) {
  return tx.projectTask.findMany({
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
  return tx.projectTaskMember.createMany({ data });
}

export function replaceTaskMembers(
  tx: Prisma.TransactionClient,
  taskId: number,
  data: TaskMemberWrite[],
) {
  return tx.projectTaskMember
    .deleteMany({ where: { taskId } })
    .then(() => tx.projectTaskMember.createMany({ data }));
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
    updatedById: number;
  },
) {
  return tx.projectTask.update({
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
  return tx.projectTask.count({
    where: { projectId, parentTaskId: taskId },
  });
}

export function deleteProjectTask(
  tx: Prisma.TransactionClient,
  taskId: number,
) {
  return tx.projectTask.delete({ where: { id: taskId } });
}

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
} satisfies Prisma.ProjectTaskCommentSelect;

/** Bình luận của một công việc, cũ nhất trước. */
export function listTaskComments(taskId: number) {
  return prisma.projectTaskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: taskCommentSelect,
  });
}

export function createTaskComment(
  taskId: number,
  userId: number,
  content: string,
) {
  return prisma.projectTaskComment.create({
    data: { taskId, userId, content },
    select: taskCommentSelect,
  });
}
