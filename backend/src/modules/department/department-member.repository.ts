import {
  Prisma,
  Status,
  TemplateTaskRole,
  WorkflowStatusCategory,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";

const OPEN_CATEGORIES = [
  WorkflowStatusCategory.TODO,
  WorkflowStatusCategory.IN_PROGRESS,
];

const memberSelect = {
  id: true,
  fullName: true,
  email: true,
  position: { select: { id: true, name: true } },
  profile: { select: { avatarKey: true } },
} as const;

export function findManagedDepartment(managerId: number) {
  return prisma.department.findUnique({
    where: { managerId },
    select: { id: true, name: true, managerId: true },
  });
}

function memberWhere(
  departmentId: number,
  search?: string,
): Prisma.UserWhereInput {
  return {
    departmentId,
    status: Status.ACTIVE,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { position: { is: { name: { contains: search } } } },
          ],
        }
      : {}),
  };
}

export function findMembers(departmentId: number, search?: string) {
  return prisma.user.findMany({
    where: memberWhere(departmentId, search),
    select: memberSelect,
    orderBy: { fullName: "asc" },
  });
}

export type MemberRow = Awaited<ReturnType<typeof findMembers>>[number];

export function findMemberInDepartment(departmentId: number, userId: number) {
  return prisma.user.findFirst({
    where: { id: userId, departmentId },
    select: memberSelect,
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true, departmentId: true },
  });
}

export function findPositionById(id: number) {
  return prisma.position.findUnique({ where: { id }, select: { id: true } });
}

export function assignUserToDepartment(
  userId: number,
  departmentId: number,
  positionId: number | null | undefined,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      departmentId,
      ...(positionId !== undefined ? { positionId } : {}),
    },
    select: memberSelect,
  });
}

export function updateMemberPosition(userId: number, positionId: number | null) {
  return prisma.user.update({
    where: { id: userId },
    data: { positionId },
    select: memberSelect,
  });
}

export function removeUserFromDepartment(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { departmentId: null },
    select: { id: true },
  });
}

export async function findCandidates(
  search: string | undefined,
  skip: number,
  take: number,
) {
  const where: Prisma.UserWhereInput = {
    departmentId: null,
    status: Status.ACTIVE,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: memberSelect,
      orderBy: { fullName: "asc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

const openTaskSelect = {
  id: true,
  code: true,
  title: true,
  priority: true,
  dueDate: true,
  estimatedMinutes: true,
  project: { select: { id: true, name: true } },
  status: { select: { name: true, color: true, category: true } },
} as const;

function openTaskWhere(
  memberIds: number[],
  projectId?: number,
): Prisma.TaskWhereInput {
  return {
    ...(projectId ? { projectId } : {}),
    status: { category: { in: OPEN_CATEGORIES } },
    members: {
      some: { userId: { in: memberIds }, taskRole: TemplateTaskRole.ASSIGNEE },
    },
  };
}

export function findOpenTasks(memberIds: number[], projectId?: number) {
  return prisma.task.findMany({
    where: openTaskWhere(memberIds, projectId),
    select: {
      ...openTaskSelect,
      members: {
        where: {
          taskRole: TemplateTaskRole.ASSIGNEE,
          userId: { in: memberIds },
        },
        select: { userId: true },
      },
    },
  });
}

export type OpenTaskRow = Awaited<ReturnType<typeof findOpenTasks>>[number];

export async function findMemberOpenTasks(
  userId: number,
  projectId: number | undefined,
  skip: number,
  take: number,
) {
  const where = openTaskWhere([userId], projectId);

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: openTaskSelect,
      orderBy: [{ dueDate: "asc" }, { id: "desc" }],
      skip,
      take,
    }),
    prisma.task.count({ where }),
  ]);

  return { items, total };
}

export function findDepartmentProjects(memberIds: number[]) {
  return prisma.project.findMany({
    where: {
      tasks: {
        some: {
          members: {
            some: {
              userId: { in: memberIds },
              taskRole: TemplateTaskRole.ASSIGNEE,
            },
          },
        },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
