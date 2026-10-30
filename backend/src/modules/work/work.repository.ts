import prisma from "@/shared/utils/prisma";
import {
  Prisma,
  TemplateTaskRole,
  WorkflowStatusCategory,
} from "@prisma/client";

export type MyTaskScope = "mine" | "assigned";
export type MyTaskDue = "overdue" | "today" | "week" | "none";

export type MyTaskListFilter = {
  userId: number;
  scope: MyTaskScope;
  keyword?: string;
  projectId?: number;
  role?: TemplateTaskRole;
  due?: MyTaskDue;
  today: Date;
  weekEnd: Date;
};

const MINE_ROLES: TemplateTaskRole[] = [
  TemplateTaskRole.ASSIGNEE,
  TemplateTaskRole.REVIEWER,
];

function dueFilter(
  due: MyTaskDue,
  today: Date,
  weekEnd: Date,
): Prisma.TaskWhereInput {
  if (due === "none") return { dueDate: null };
  if (due === "overdue") {
    return {
      dueDate: { lt: today },
      status: {
        category: {
          notIn: [WorkflowStatusCategory.DONE, WorkflowStatusCategory.CANCELLED],
        },
      },
    };
  }
  if (due === "today") return { dueDate: today };
  return { dueDate: { gte: today, lte: weekEnd } };
}

/** null nghĩa là bộ lọc vai trò không giao với scope, danh sách rỗng. */
export function buildMyTaskWhere(
  filter: MyTaskListFilter,
): Prisma.TaskWhereInput | null {
  if (filter.scope === "mine" && filter.role === TemplateTaskRole.REPORTER) {
    return null;
  }

  const membership: Prisma.TaskWhereInput =
    filter.scope === "assigned"
      ? {
          members: {
            some: {
              userId: filter.userId,
              taskRole: TemplateTaskRole.REPORTER,
            },
          },
        }
      : {
          members: {
            some: {
              userId: filter.userId,
              taskRole: filter.role ?? { in: MINE_ROLES },
            },
          },
        };

  const and: Prisma.TaskWhereInput[] = [membership];

  if (
    filter.scope === "assigned" &&
    filter.role &&
    filter.role !== TemplateTaskRole.REPORTER
  ) {
    and.push({
      members: {
        some: {
          userId: filter.userId,
          taskRole: filter.role,
        },
      },
    });
  }

  if (filter.projectId) and.push({ projectId: filter.projectId });
  if (filter.keyword) and.push({ title: { contains: filter.keyword } });
  if (filter.due) and.push(dueFilter(filter.due, filter.today, filter.weekEnd));

  return { AND: and };
}

export function listMyTasks(filter: MyTaskListFilter) {
  const where = buildMyTaskWhere(filter);
  if (!where) return Promise.resolve([]);

  return prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { id: "desc" }],
    select: {
      id: true,
      code: true,
      title: true,
      dueDate: true,
      project: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      status: {
        select: {
          id: true,
          name: true,
          key: true,
          color: true,
          category: true,
        },
      },
      members: {
        where: { userId: filter.userId },
        select: { taskRole: true },
      },
    },
  });
}

export function countMyTasks(userId: number, scope: MyTaskScope) {
  return prisma.task.count({
    where: buildMyTaskWhere({
      userId,
      scope,
      today: new Date(0),
      weekEnd: new Date(0),
    })!,
  });
}
