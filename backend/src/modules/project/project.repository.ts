import prisma from "@/shared/utils/prisma";
import {
  Prisma,
  ProjectStatus,
  ProjectTemplate,
  ProjectTemplateStatus,
} from "@prisma/client";
import { mapTemplateOptions } from "@/modules/project/project.mapper";
import { CreateProjectSchema, UpdateProjectSchema } from "./project.schema";
import { AppError } from "@/shared/errors/app-error";

// Helper functions
function getMappedId(
  map: Map<number, number>,
  sourceId: number,
  message: string,
): number {
  const targetId = map.get(sourceId);

  if (targetId === undefined) {
    throw new AppError(500, message);
  }

  return targetId;
}

// Get visible where clause
function visibleWhere(userId: number, keyword?: string) {
  return {
    AND: [
      keyword ? { name: { contains: keyword } } : {},
      {
        OR: [
          { visibility: "PUBLIC" as const },
          { members: { some: { userId } } },
        ],
      },
    ],
  };
}

export async function getTemplateOptions() {
  const templates = await prisma.projectTemplate.findMany({
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      workflows: {
        where: { isDefault: true },
        take: 1,
        select: {
          name: true,
          statuses: {
            select: { name: true },
          },
        },
      },
    },
    where: {
      status: ProjectTemplateStatus.ACTIVE,
    },
  });
  return mapTemplateOptions(templates);
}

export async function findTemplateForClone(templateId: number) {
  const template = await prisma.projectTemplate.findUnique({
    where: {
      id: +templateId,
    },
    select: {
      id: true,
      status: true,
      version: true,
      projectRoles: {
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          sortOrder: true,
        },
      },
      taskTypes: {
        select: {
          id: true,
          workflowId: true,
          name: true,
          key: true,
          description: true,
          sortOrder: true,
          isActive: true,
        },
      },
      workflows: {
        select: {
          id: true,
          name: true,
          description: true,
          isDefault: true,
          statuses: {
            select: {
              id: true,
              name: true,
              key: true,
              description: true,
              sortOrder: true,
              category: true,
              color: true,
              isInitial: true,
              isFinal: true,
            },
          },
          transitions: {
            select: {
              id: true,
              fromStatusId: true,
              toStatusId: true,
              name: true,
              isActive: true,
              approvalRules: {
                select: {
                  id: true,
                  approverType: true,
                  projectRoleId: true,
                  taskRole: true,
                  minApprovals: true,
                  onRejectStatusId: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return template;
}

export async function createProjectFromTemplate(
  tx: Prisma.TransactionClient,
  input: CreateProjectSchema,
  userId: number,
  template: NonNullable<Awaited<ReturnType<typeof findTemplateForClone>>>,
) {
  const project = await tx.project.create({
    data: {
      name: input.name,
      description: input.description,
      visibility: input.visibility,
      priority: input.priority,
      isUrgent: input.isUrgent,
      startDate: input.startDate
        ? new Date(`${input.startDate}T00:00:00.000Z`)
        : new Date(),
      endDate: input.endDate
        ? new Date(`${input.endDate}T00:00:00.000Z`)
        : new Date(),
      templateId: input.templateId,
      templateVersion: template?.version ?? 1,
      createdById: userId,
      updatedById: userId,
      status: ProjectStatus.IN_PROGRESS,
    },
  });

  const roleMap = new Map<number, number>();

  for (const templateRole of template.projectRoles) {
    const projectRole = await tx.projectRole.create({
      data: {
        key: templateRole.key,
        name: templateRole.name,
        description: templateRole.description,
        sortOrder: templateRole.sortOrder,
        projectId: project.id,
      },
    });
    roleMap.set(templateRole.id, projectRole.id);
  }

  const workflowMap = new Map<number, number>();
  const statusMap = new Map<number, number>();
  const transitionMap = new Map<number, number>();

  for (const templateWorkflow of template.workflows) {
    const projectWorkflow = await tx.projectWorkflow.create({
      data: {
        name: templateWorkflow.name,
        description: templateWorkflow.description,
        isDefault: templateWorkflow.isDefault,
        projectId: project.id,
      },
    });
    workflowMap.set(templateWorkflow.id, projectWorkflow.id);
    for (const templateStatus of templateWorkflow.statuses) {
      const projectStatus = await tx.projectWorkflowStatus.create({
        data: {
          name: templateStatus.name,
          key: templateStatus.key,
          category: templateStatus.category,
          description: templateStatus.description,
          sortOrder: templateStatus.sortOrder,
          workflowId: projectWorkflow.id,
        },
      });
      statusMap.set(templateStatus.id, projectStatus.id);
    }
    for (const templateTransition of templateWorkflow.transitions) {
      const projectTransition = await tx.projectWorkflowTransition.create({
        data: {
          name: templateTransition.name,
          fromStatusId: getMappedId(
            statusMap,
            templateTransition.fromStatusId,
            `Status ${templateTransition.fromStatusId} not found`,
          ),
          toStatusId: getMappedId(
            statusMap,
            templateTransition.toStatusId,
            `Status ${templateTransition.toStatusId} not found`,
          ),
          workflowId: projectWorkflow.id,
        },
      });
      transitionMap.set(templateTransition.id, projectTransition.id);
      for (const templateApprovalRule of templateTransition.approvalRules) {
        await tx.projectApprovalRule.create({
          data: {
            transitionId: projectTransition.id,
            approverType: templateApprovalRule.approverType,
            projectRoleId:
              templateApprovalRule.projectRoleId === null
                ? null
                : (roleMap.get(templateApprovalRule.projectRoleId) ?? null),
            taskRole: templateApprovalRule.taskRole ?? null,
            minApprovals: templateApprovalRule.minApprovals,
            onRejectStatusId: getMappedId(
              statusMap,
              templateApprovalRule.onRejectStatusId,
              `Status ${templateApprovalRule.onRejectStatusId} not found`,
            ),
          },
        });
      }
    }
  }

  // copy task type
  for (const templateTaskType of template.taskTypes) {
    await tx.projectTaskType.create({
      data: {
        name: templateTaskType.name,
        key: templateTaskType.key,
        description: templateTaskType.description,
        sortOrder: templateTaskType.sortOrder,
        isActive: templateTaskType.isActive,
        projectId: project.id,
        workflowId:
          templateTaskType.workflowId === null
            ? null
            : (workflowMap.get(templateTaskType.workflowId) ?? null),
      },
    });
  }

  const copiedManager = template.projectRoles.find(
    (role) => role.key === "PROJECT_MANAGER",
  );

  let projectManagerRoleId = copiedManager
    ? roleMap.get(copiedManager.id)
    : undefined;

  if (copiedManager && projectManagerRoleId === undefined) {
    throw new AppError(500, "Project manager role was not copied");
  }

  if (projectManagerRoleId === undefined) {
    const usedNames = new Set(template.projectRoles.map((role) => role.name));
    let name = "Project Manager";
    let suffix = 2;
    while (usedNames.has(name)) {
      name = `Project Manager ${suffix}`;
      suffix += 1;
    }

    const createdRole = await tx.projectRole.create({
      data: {
        key: "PROJECT_MANAGER",
        name,
        sortOrder: 0,
        projectId: project.id,
      },
    });
    projectManagerRoleId = createdRole.id;
  }

  await tx.projectMember.create({
    data: {
      projectId: project.id,
      userId,
      projectRoleId: projectManagerRoleId,
      joinedAt: new Date(),
    },
  });

  return project.id;
}

export function getProjectList(params: {
  userId: number;
  keyword?: string;
  skip: number;
  take: number;
}) {
  return prisma.project.findMany({
    where: visibleWhere(params.userId, params.keyword),
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      priority: true,
      status: true,
      isUrgent: true,
      startDate: true,
      endDate: true,
      template: { select: { name: true } },
      workflows: {
        where: { isDefault: true },
        take: 1,
        select: { name: true },
      },
      members: { select: { userId: true } },
    },
  });
}

export function countVisibleProjects(userId: number, keyword?: string) {
  return prisma.project.count({
    where: visibleWhere(userId, keyword),
  });
}

const projectDetailSelect = {
  id: true,
  name: true,
  description: true,
  visibility: true,
  priority: true,
  status: true,
  isUrgent: true,
  startDate: true,
  endDate: true,
  templateId: true,
  templateVersion: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  template: { select: { name: true } },
  createdBy: { select: { id: true, fullName: true } },
  workflows: {
    where: { isDefault: true },
    take: 1,
    select: {
      name: true,
      statuses: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          key: true,
          color: true,
          sortOrder: true,
          isInitial: true,
          isFinal: true,
        },
      },
    },
  },
  members: { select: { userId: true } },
} satisfies Prisma.ProjectSelect;

export function getProjectDetail(id: number, userId: number) {
  return prisma.project.findFirst({
    where: { id, ...visibleWhere(userId) },
    select: projectDetailSelect,
  });
}

export function findProjectById(id: number) {
  return prisma.project.findUnique({
    where: { id },
    select: projectDetailSelect,
  });
}

export function findProjectOwner(id: number) {
  return prisma.project.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
}

export function updateProject(
  id: number,
  data: UpdateProjectSchema,
  userId: number,
) {
  return prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      visibility: data.visibility,
      priority: data.priority,
      status: data.status,
      isUrgent: data.isUrgent,
      startDate: new Date(`${data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${data.endDate}T00:00:00.000Z`),
      updatedBy: { connect: { id: userId } },
    },
    select: { id: true },
  });
}

const memberAssignmentSelect = {
  userId: true,
  joinedAt: true,
  user: {
    select: {
      fullName: true,
      email: true,
      profile: { select: { avatarKey: true } },
    },
  },
  projectRole: {
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.ProjectMemberSelect;

function mapMemberAssignment(
  row: Prisma.ProjectMemberGetPayload<{ select: typeof memberAssignmentSelect }>,
) {
  return {
    userId: row.userId,
    fullName: row.user.fullName,
    email: row.user.email,
    avatarKey: row.user.profile?.avatarKey ?? null,
    joinedAt: row.joinedAt,
    role: row.projectRole,
  };
}

export function findAccessibleProject(projectId: number, userId: number) {
  return prisma.project.findFirst({
    where: { id: projectId, ...visibleWhere(userId) },
    select: { id: true },
  });
}

export function listProjectRoles(projectId: number) {
  return prisma.projectRole.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      sortOrder: true,
    },
  });
}

export async function listMemberAssignments(projectId: number) {
  const rows = await prisma.projectMember.findMany({
    where: { projectId },
    select: memberAssignmentSelect,
  });
  return rows.map(mapMemberAssignment);
}

export function findUserForInvite(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });
}

export async function searchInviteCandidates(projectId: number, keyword: string) {
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { fullName: { contains: keyword } },
        { email: { contains: keyword } },
      ],
      projectMembers: { none: { projectId } },
    },
    orderBy: { fullName: "asc" },
    take: 10,
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: { select: { avatarKey: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatarKey: user.profile?.avatarKey ?? null,
  }));
}

export function addMemberAssignments(input: {
  projectId: number;
  userId: number;
  roleIds: number[];
  joinedAt: Date;
}) {
  return prisma.projectMember.createMany({
    data: input.roleIds.map((projectRoleId) => ({
      projectId: input.projectId,
      userId: input.userId,
      projectRoleId,
      joinedAt: input.joinedAt,
    })),
  });
}

export function replaceMemberAssignments(input: {
  projectId: number;
  userId: number;
  roleIds: number[];
  joinedAt: Date;
}) {
  return prisma.$transaction([
    prisma.projectMember.deleteMany({
      where: { projectId: input.projectId, userId: input.userId },
    }),
    prisma.projectMember.createMany({
      data: input.roleIds.map((projectRoleId) => ({
        projectId: input.projectId,
        userId: input.userId,
        projectRoleId,
        joinedAt: input.joinedAt,
      })),
    }),
  ]);
}

export function removeMemberAssignments(projectId: number, userId: number) {
  return prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });
}
