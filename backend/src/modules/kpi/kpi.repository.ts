import prisma from "@/shared/utils/prisma";
import { Status, TemplateTaskRole, WorkflowStatusCategory } from "@prisma/client";

/**
 * Các task user được giao thực hiện (ASSIGNEE) có hạn chót trong khoảng [from, to].
 *
 * TODO(kpi-log): chưa có dữ liệu thời gian thực tế (time log) và lịch sử chuyển
 * trạng thái nên chưa thể tính effort thực tế / số lần mở lại. Khi bổ sung bảng log,
 * select thêm vào đây rồi dùng trong kpi.service.
 */
export function findAssignedTasks(userId: number, from: Date, to: Date) {
  return prisma.projectTask.findMany({
    where: {
      dueDate: { gte: from, lte: to },
      members: {
        some: { userId, taskRole: TemplateTaskRole.ASSIGNEE },
      },
    },
    select: {
      id: true,
      code: true,
      title: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      updatedAt: true,
      estimatedMinutes: true,
      project: { select: { id: true, name: true } },
      taskType: { select: { id: true, name: true } },
      status: { select: { category: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export type KpiTaskRow = Awaited<ReturnType<typeof findAssignedTasks>>[number];

export function findManagedDepartment(managerId: number) {
  return prisma.department.findUnique({
    where: { managerId },
    select: {
      id: true,
      name: true,
      users: {
        where: { status: Status.ACTIVE },
        select: {
          id: true,
          fullName: true,
          email: true,
          position: { select: { name: true } },
          profile: { select: { avatarKey: true } },
        },
        orderBy: { fullName: "asc" },
      },
    },
  });
}

export type DepartmentMemberRow = NonNullable<
  Awaited<ReturnType<typeof findManagedDepartment>>
>["users"][number];

const departmentTaskSelect = {
  id: true,
  code: true,
  title: true,
  priority: true,
  dueDate: true,
  completedAt: true,
  updatedAt: true,
  estimatedMinutes: true,
  project: { select: { id: true, name: true } },
  taskType: { select: { id: true, name: true } },
  status: { select: { name: true, category: true } },
} as const;

function assigneeSelect(memberIds: number[]) {
  return {
    where: { taskRole: TemplateTaskRole.ASSIGNEE, userId: { in: memberIds } },
    select: { userId: true },
  };
}

export function findDepartmentTasks(
  memberIds: number[],
  from: Date,
  to: Date,
  projectId?: number,
) {
  return prisma.projectTask.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      dueDate: { gte: from, lte: to },
      members: {
        some: { userId: { in: memberIds }, taskRole: TemplateTaskRole.ASSIGNEE },
      },
    },
    select: {
      ...departmentTaskSelect,
      members: assigneeSelect(memberIds),
    },
    orderBy: { dueDate: "asc" },
  });
}

export function findDepartmentUnfinishedTasks(memberIds: number[], until: Date) {
  return prisma.projectTask.findMany({
    where: {
      dueDate: { lte: until },
      status: {
        category: {
          in: [
            WorkflowStatusCategory.TODO,
            WorkflowStatusCategory.IN_PROGRESS,
          ],
        },
      },
      members: {
        some: { userId: { in: memberIds }, taskRole: TemplateTaskRole.ASSIGNEE },
      },
    },
    select: {
      ...departmentTaskSelect,
      members: assigneeSelect(memberIds),
    },
    orderBy: { dueDate: "asc" },
  });
}

export type DepartmentTaskRow = Awaited<
  ReturnType<typeof findDepartmentTasks>
>[number];
