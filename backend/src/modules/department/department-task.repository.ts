import {
  Prisma,
  ProjectPriority,
  TemplateTaskRole,
  WorkflowStatusCategory,
  WorkflowTransitionMode,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";

const LIST_LIMIT = 500;

const statusSelect = {
  id: true,
  name: true,
  key: true,
  color: true,
  category: true,
} satisfies Prisma.WorkflowStatusSelect;

const configStatusSelect = {
  ...statusSelect,
  sortOrder: true,
  isInitial: true,
  isFinal: true,
} satisfies Prisma.WorkflowStatusSelect;

const workflowSelect = {
  id: true,
  name: true,
  description: true,
  statuses: {
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: configStatusSelect,
  },
} satisfies Prisma.WorkflowSelect;

const personSelect = {
  id: true,
  fullName: true,
  profile: { select: { avatarKey: true } },
} satisfies Prisma.UserSelect;

export const departmentTaskListSelect = {
  id: true,
  code: true,
  title: true,
  priority: true,
  startDate: true,
  dueDate: true,
  estimatedMinutes: true,
  statusId: true,
  parentTaskId: true,
  completedAt: true,
  createdAt: true,
  status: { select: statusSelect },
  members: {
    where: { taskRole: TemplateTaskRole.ASSIGNEE },
    orderBy: { id: "asc" },
    take: 1,
    select: { user: { select: personSelect } },
  },
  _count: { select: { children: true } },
} satisfies Prisma.TaskSelect;

export const departmentTaskDetailSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  priority: true,
  startDate: true,
  dueDate: true,
  estimatedMinutes: true,
  statusId: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  workflow: {
    select: {
      id: true,
      name: true,
      statuses: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: statusSelect,
      },
    },
  },
  status: { select: statusSelect },
  parent: { select: { id: true, code: true, title: true } },
  children: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      code: true,
      title: true,
      estimatedMinutes: true,
      priority: true,
      status: { select: statusSelect },
    },
  },
  members: {
    orderBy: { id: "asc" },
    select: { taskRole: true, user: { select: personSelect } },
  },
} satisfies Prisma.TaskSelect;

export type DepartmentTaskListRow = Prisma.TaskGetPayload<{
  select: typeof departmentTaskListSelect;
}>;

export type DepartmentTaskDetailRow = Prisma.TaskGetPayload<{
  select: typeof departmentTaskDetailSelect;
}>;

export type DepartmentWorkflowRow = Prisma.WorkflowGetPayload<{
  select: typeof workflowSelect;
}>;

export const DEFAULT_WORKFLOW_NAME = "Quy trình phòng ban";

const DEFAULT_STATUSES = [
  {
    key: "todo",
    name: "Cần làm",
    category: WorkflowStatusCategory.TODO,
    color: "#94A3B8",
    isInitial: true,
    isFinal: false,
  },
  {
    key: "in_progress",
    name: "Đang làm",
    category: WorkflowStatusCategory.IN_PROGRESS,
    color: "#3B82F6",
    isInitial: false,
    isFinal: false,
  },
  {
    key: "review",
    name: "Chờ duyệt",
    category: WorkflowStatusCategory.IN_PROGRESS,
    color: "#8B5CF6",
    isInitial: false,
    isFinal: false,
  },
  {
    key: "done",
    name: "Hoàn thành",
    category: WorkflowStatusCategory.DONE,
    color: "#10B981",
    isInitial: false,
    isFinal: true,
  },
];

export function findWorkflowByDepartment(departmentId: number) {
  return prisma.workflow.findUnique({
    where: { departmentId },
    select: workflowSelect,
  });
}

export function createDefaultWorkflow(departmentId: number) {
  return prisma.workflow.create({
    data: {
      departmentId,
      name: DEFAULT_WORKFLOW_NAME,
      isDefault: true,
      transitionMode: WorkflowTransitionMode.FREE,
      statuses: {
        create: DEFAULT_STATUSES.map((status, index) => ({
          ...status,
          sortOrder: index,
        })),
      },
    },
    select: workflowSelect,
  });
}

export function listDepartmentTasks(departmentId: number) {
  return prisma.task.findMany({
    where: { departmentId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: LIST_LIMIT,
    select: departmentTaskListSelect,
  });
}

export function findDepartmentTaskDetail(departmentId: number, taskId: number) {
  return prisma.task.findFirst({
    where: { id: taskId, departmentId },
    select: departmentTaskDetailSelect,
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

export function findStatusInWorkflow(workflowId: number, statusId: number) {
  return prisma.workflowStatus.findFirst({
    where: { id: statusId, workflowId },
    select: { id: true, category: true },
  });
}

export function findDepartmentUserIds(
  tx: Prisma.TransactionClient,
  departmentId: number,
  userIds: number[],
) {
  return tx.user.findMany({
    where: { departmentId, id: { in: userIds } },
    select: { id: true },
  });
}

export function findTaskParent(
  tx: Prisma.TransactionClient,
  departmentId: number,
  taskId: number,
) {
  return tx.task.findFirst({
    where: { id: taskId, departmentId },
    select: { id: true, parentTaskId: true },
  });
}

export async function allocateTaskCodes(
  tx: Prisma.TransactionClient,
  departmentId: number,
  count: number,
) {
  const department = await tx.department.update({
    where: { id: departmentId },
    data: { nextTaskNumber: { increment: count } },
    select: { nextTaskNumber: true },
  });
  const start = department.nextTaskNumber - count + 1;
  return Array.from({ length: count }, (_, index) => `T-${start + index}`);
}

export type DepartmentTaskWrite = {
  departmentId: number;
  code: string;
  title: string;
  description: string | null;
  workflowId: number;
  statusId: number;
  priority: ProjectPriority;
  startDate: Date | null;
  dueDate: Date | null;
  estimatedMinutes: number | null;
  parentTaskId: number | null;
  createdById: number;
  completedAt: Date | null;
};

export function createDepartmentTask(
  tx: Prisma.TransactionClient,
  data: DepartmentTaskWrite,
) {
  return tx.task.create({ data, select: { id: true } });
}

export function createDepartmentTasks(
  tx: Prisma.TransactionClient,
  data: DepartmentTaskWrite[],
) {
  return tx.task.createMany({ data });
}

export function findTaskIdsByCodes(
  tx: Prisma.TransactionClient,
  departmentId: number,
  codes: string[],
) {
  return tx.task.findMany({
    where: { departmentId, code: { in: codes } },
    select: { id: true },
  });
}

export function updateDepartmentTask(
  tx: Prisma.TransactionClient,
  taskId: number,
  data: {
    title: string;
    description: string | null;
    statusId: number;
    priority: ProjectPriority;
    startDate: Date | null;
    dueDate: Date | null;
    estimatedMinutes: number | null;
    parentTaskId: number | null;
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

export function updateTaskStatus(
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

export function countChildTasks(
  tx: Prisma.TransactionClient,
  departmentId: number,
  taskId: number,
) {
  return tx.task.count({
    where: { departmentId, parentTaskId: taskId },
  });
}

export function deleteDepartmentTask(
  tx: Prisma.TransactionClient,
  taskId: number,
) {
  return tx.task.delete({ where: { id: taskId } });
}

export function groupTaskCountsByStatus(departmentId: number) {
  return prisma.task.groupBy({
    by: ["statusId"],
    where: { departmentId },
    _count: { _all: true },
  });
}

export function updateWorkflow(
  tx: Prisma.TransactionClient,
  workflowId: number,
  name: string,
  description: string | null,
) {
  return tx.workflow.update({
    where: { id: workflowId },
    data: { name, description },
    select: { id: true },
  });
}

export function deleteStatuses(
  tx: Prisma.TransactionClient,
  workflowId: number,
  ids: number[],
) {
  return tx.workflowStatus.deleteMany({
    where: { workflowId, id: { in: ids } },
  });
}

export type StatusWrite = {
  name: string;
  category: WorkflowStatusCategory;
  color: string | null;
  isInitial: boolean;
  isFinal: boolean;
  sortOrder: number;
};

export function updateStatus(
  tx: Prisma.TransactionClient,
  statusId: number,
  data: StatusWrite,
) {
  return tx.workflowStatus.update({
    where: { id: statusId },
    data,
    select: { id: true },
  });
}

export function createStatus(
  tx: Prisma.TransactionClient,
  workflowId: number,
  key: string,
  data: StatusWrite,
) {
  return tx.workflowStatus.create({
    data: { ...data, workflowId, key },
    select: { id: true },
  });
}

export function syncCompletedAtForStatus(
  tx: Prisma.TransactionClient,
  statusId: number,
  done: boolean,
) {
  if (done) {
    return tx.task.updateMany({
      where: { statusId, completedAt: null },
      data: { completedAt: new Date() },
    });
  }
  return tx.task.updateMany({
    where: { statusId, completedAt: { not: null } },
    data: { completedAt: null },
  });
}
