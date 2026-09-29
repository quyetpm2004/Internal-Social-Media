import {
  Prisma,
  ProjectTemplateStatus,
  WorkflowStatusCategory,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";

const templateSummarySelect = {
  id: true,
  key: true,
  name: true,
  status: true,
  version: true,
  updatedAt: true,
} as const;

export type TemplateDetailRecord = Prisma.ProjectTemplateGetPayload<{
  include: {
    projectRoles: true;
    taskTypes: true;
    workflows: {
      include: {
        statuses: true;
        transitions: {
          include: {
            approvalRules: true;
          };
        };
      };
    };
  };
}>;

const templateDetailInclude: Prisma.ProjectTemplateInclude = {
  projectRoles: {
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  },
  taskTypes: {
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  },
  workflows: {
    orderBy: { id: "asc" },
    include: {
      statuses: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
      transitions: {
        orderBy: { id: "asc" },
        include: {
          approvalRules: {
            orderBy: { id: "asc" },
          },
        },
      },
    },
  },
};

export function findTemplates(params: {
  skip: number;
  take: number;
  keyword?: string;
  status?: ProjectTemplateStatus;
}) {
  const where: Prisma.ProjectTemplateWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.keyword) {
    where.OR = [
      { name: { contains: params.keyword } },
      { key: { contains: params.keyword } },
    ];
  }

  return prisma.projectTemplate.findMany({
    where,
    skip: params.skip,
    take: params.take,
    orderBy: { updatedAt: "desc" },
    select: templateSummarySelect,
  });
}

export function countTemplates(params: {
  keyword?: string;
  status?: ProjectTemplateStatus;
}) {
  const where: Prisma.ProjectTemplateWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.keyword) {
    where.OR = [
      { name: { contains: params.keyword } },
      { key: { contains: params.keyword } },
    ];
  }

  return prisma.projectTemplate.count({ where });
}

export function findTemplateById(id: number) {
  return prisma.projectTemplate.findUnique({
    where: { id },
  });
}

export function findTemplateByKey(key: string) {
  return prisma.projectTemplate.findUnique({
    where: { key },
  });
}

export function findTemplateByNameAmongDraftOrActive(
  name: string,
  excludeId?: number,
) {
  return prisma.projectTemplate.findFirst({
    where: {
      name,
      status: { in: [ProjectTemplateStatus.DRAFT, ProjectTemplateStatus.ACTIVE] },
      ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
    },
  });
}

export function findTemplateDetail(
  id: number,
): Promise<TemplateDetailRecord | null> {
  return prisma.projectTemplate.findUnique({
    where: { id },
    include: templateDetailInclude,
  }) as Promise<TemplateDetailRecord | null>;
}

export function createTemplate(data: Prisma.ProjectTemplateCreateInput) {
  return prisma.projectTemplate.create({
    data,
    select: templateSummarySelect,
  });
}

export function updateTemplate(
  id: number,
  data: Prisma.ProjectTemplateUpdateInput,
) {
  return prisma.projectTemplate.update({
    where: { id },
    data,
  });
}

export function deleteTemplateInTransaction(templateId: number) {
  return prisma.$transaction(async (tx) => {
    const workflows = await tx.templateWorkflow.findMany({
      where: { templateId },
      select: { id: true },
    });
    const workflowIds = workflows.map((w) => w.id);

    if (workflowIds.length > 0) {
      const transitions = await tx.templateWorkflowTransition.findMany({
        where: { workflowId: { in: workflowIds } },
        select: { id: true },
      });
      const transitionIds = transitions.map((t) => t.id);

      if (transitionIds.length > 0) {
        await tx.templateApprovalRule.deleteMany({
          where: { transitionId: { in: transitionIds } },
        });
      }

      await tx.templateWorkflowTransition.deleteMany({
        where: { workflowId: { in: workflowIds } },
      });

      await tx.templateWorkflowStatus.deleteMany({
        where: { workflowId: { in: workflowIds } },
      });
    }

    await tx.templateTaskType.deleteMany({ where: { templateId } });
    await tx.templateProjectRole.deleteMany({ where: { templateId } });
    await tx.templateWorkflow.deleteMany({ where: { templateId } });
    await tx.projectTemplate.delete({ where: { id: templateId } });
  });
}

export function findProjectRole(templateId: number, roleId: number) {
  return prisma.templateProjectRole.findFirst({
    where: { id: roleId, templateId },
  });
}

export function findProjectRoleByKey(templateId: number, key: string) {
  return prisma.templateProjectRole.findFirst({
    where: { templateId, key },
  });
}

export function findProjectRoleByName(templateId: number, name: string) {
  return prisma.templateProjectRole.findFirst({
    where: { templateId, name },
  });
}

export function createProjectRole(data: Prisma.TemplateProjectRoleCreateInput) {
  return prisma.templateProjectRole.create({ data });
}

export function updateProjectRole(
  id: number,
  data: Prisma.TemplateProjectRoleUpdateInput,
) {
  return prisma.templateProjectRole.update({ where: { id }, data });
}

export function deleteProjectRole(id: number) {
  return prisma.templateProjectRole.delete({ where: { id } });
}

export function countApprovalRulesByProjectRole(roleId: number) {
  return prisma.templateApprovalRule.count({
    where: { projectRoleId: roleId },
  });
}

export function findTaskType(templateId: number, taskTypeId: number) {
  return prisma.templateTaskType.findFirst({
    where: { id: taskTypeId, templateId },
  });
}

export function findTaskTypeByKey(templateId: number, key: string) {
  return prisma.templateTaskType.findFirst({
    where: { templateId, key },
  });
}

export function findTaskTypeByName(templateId: number, name: string) {
  return prisma.templateTaskType.findFirst({
    where: { templateId, name },
  });
}

export function createTaskType(data: Prisma.TemplateTaskTypeCreateInput) {
  return prisma.templateTaskType.create({ data });
}

export function updateTaskType(
  id: number,
  data: Prisma.TemplateTaskTypeUpdateInput,
) {
  return prisma.templateTaskType.update({ where: { id }, data });
}

export function deleteTaskType(id: number) {
  return prisma.templateTaskType.delete({ where: { id } });
}

export function findWorkflow(templateId: number, workflowId: number) {
  return prisma.templateWorkflow.findFirst({
    where: { id: workflowId, templateId },
  });
}

export function createWorkflowInTransaction(
  templateId: number,
  data: {
    name: string;
    description?: string | null;
    isDefault?: boolean;
    isActive?: boolean;
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.templateWorkflow.updateMany({
        where: { templateId },
        data: { isDefault: false },
      });
    }

    return tx.templateWorkflow.create({
      data: {
        templateId,
        name: data.name,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
      },
    });
  });
}

export function updateWorkflowInTransaction(
  templateId: number,
  workflowId: number,
  data: {
    name?: string;
    description?: string | null;
    isDefault?: boolean;
    isActive?: boolean;
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.templateWorkflow.updateMany({
        where: { templateId, id: { not: workflowId } },
        data: { isDefault: false },
      });
    }

    return tx.templateWorkflow.update({
      where: { id: workflowId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  });
}

export function countTaskTypesByWorkflow(workflowId: number) {
  return prisma.templateTaskType.count({ where: { workflowId } });
}

export function deleteWorkflowInTransaction(workflowId: number) {
  return prisma.$transaction(async (tx) => {
    const transitions = await tx.templateWorkflowTransition.findMany({
      where: { workflowId },
      select: { id: true },
    });
    const transitionIds = transitions.map((t) => t.id);

    if (transitionIds.length > 0) {
      await tx.templateApprovalRule.deleteMany({
        where: { transitionId: { in: transitionIds } },
      });
    }

    await tx.templateWorkflowTransition.deleteMany({ where: { workflowId } });
    await tx.templateWorkflowStatus.deleteMany({ where: { workflowId } });
    await tx.templateWorkflow.delete({ where: { id: workflowId } });
  });
}

export function findStatus(workflowId: number, statusId: number) {
  return prisma.templateWorkflowStatus.findFirst({
    where: { id: statusId, workflowId },
  });
}

export function findStatusByKey(workflowId: number, key: string) {
  return prisma.templateWorkflowStatus.findFirst({
    where: { workflowId, key },
  });
}

export function findStatusByName(workflowId: number, name: string) {
  return prisma.templateWorkflowStatus.findFirst({
    where: { workflowId, name },
  });
}

export function createStatusInTransaction(
  workflowId: number,
  data: {
    name: string;
    key: string;
    description?: string | null;
    sortOrder?: number;
    category: WorkflowStatusCategory;
    color?: string | null;
    isInitial?: boolean;
    isFinal?: boolean;
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.isInitial) {
      await tx.templateWorkflowStatus.updateMany({
        where: { workflowId },
        data: { isInitial: false },
      });
    }

    return tx.templateWorkflowStatus.create({
      data: {
        workflowId,
        name: data.name,
        key: data.key,
        description: data.description ?? null,
        sortOrder: data.sortOrder ?? 0,
        category: data.category,
        color: data.color ?? null,
        isInitial: data.isInitial ?? false,
        isFinal: data.isFinal ?? false,
      },
    });
  });
}

export function updateStatusInTransaction(
  workflowId: number,
  statusId: number,
  data: {
    name?: string;
    description?: string | null;
    sortOrder?: number;
    category?: WorkflowStatusCategory;
    color?: string | null;
    isInitial?: boolean;
    isFinal?: boolean;
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.isInitial) {
      await tx.templateWorkflowStatus.updateMany({
        where: { workflowId, id: { not: statusId } },
        data: { isInitial: false },
      });
    }

    return tx.templateWorkflowStatus.update({
      where: { id: statusId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.isInitial !== undefined ? { isInitial: data.isInitial } : {}),
        ...(data.isFinal !== undefined ? { isFinal: data.isFinal } : {}),
      },
    });
  });
}

export function deleteStatusInTransaction(statusId: number) {
  return prisma.$transaction(async (tx) => {
    await tx.templateApprovalRule.deleteMany({
      where: {
        OR: [
          { onRejectStatusId: statusId },
          {
            transition: {
              OR: [{ fromStatusId: statusId }, { toStatusId: statusId }],
            },
          },
        ],
      },
    });

    await tx.templateWorkflowTransition.deleteMany({
      where: {
        OR: [{ fromStatusId: statusId }, { toStatusId: statusId }],
      },
    });

    await tx.templateWorkflowStatus.delete({ where: { id: statusId } });
  });
}

export function findTransition(
  workflowId: number,
  transitionId: number,
) {
  return prisma.templateWorkflowTransition.findFirst({
    where: { id: transitionId, workflowId },
    include: { approvalRules: true },
  });
}

export function findTransitionByTriple(
  workflowId: number,
  fromStatusId: number,
  toStatusId: number,
  excludeId?: number,
) {
  return prisma.templateWorkflowTransition.findFirst({
    where: {
      workflowId,
      fromStatusId,
      toStatusId,
      ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
    },
  });
}

export function createTransition(data: Prisma.TemplateWorkflowTransitionCreateInput) {
  return prisma.templateWorkflowTransition.create({ data });
}

export function updateTransition(
  id: number,
  data: Prisma.TemplateWorkflowTransitionUpdateInput,
) {
  return prisma.templateWorkflowTransition.update({ where: { id }, data });
}

export function deleteTransition(id: number) {
  return prisma.templateWorkflowTransition.delete({ where: { id } });
}

export function findApprovalRule(transitionId: number, ruleId: number) {
  return prisma.templateApprovalRule.findFirst({
    where: { id: ruleId, transitionId },
  });
}

export function createApprovalRule(data: Prisma.TemplateApprovalRuleCreateInput) {
  return prisma.templateApprovalRule.create({ data });
}

export function updateApprovalRule(
  id: number,
  data: Prisma.TemplateApprovalRuleUpdateInput,
) {
  return prisma.templateApprovalRule.update({ where: { id }, data });
}

export function deleteApprovalRule(id: number) {
  return prisma.templateApprovalRule.delete({ where: { id } });
}

export function findTemplateForDuplicate(id: number) {
  return prisma.projectTemplate.findUnique({
    where: { id },
    include: {
      projectRoles: true,
      taskTypes: true,
      workflows: {
        include: {
          statuses: true,
          transitions: {
            include: { approvalRules: true },
          },
        },
      },
    },
  });
}

export function duplicateTemplateInTransaction(
  source: NonNullable<Awaited<ReturnType<typeof findTemplateForDuplicate>>>,
  input: {
    key: string;
    name: string;
    description: string | null;
    createdById: number;
  },
) {
  return prisma.$transaction(async (tx) => {
    const newTemplate = await tx.projectTemplate.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description,
        status: ProjectTemplateStatus.DRAFT,
        version: source.version + 1,
        parentTemplateId: source.id,
        createdById: input.createdById,
      },
    });

    const roleIdMap = new Map<number, number>();
    for (const role of source.projectRoles) {
      const created = await tx.templateProjectRole.create({
        data: {
          templateId: newTemplate.id,
          key: role.key,
          name: role.name,
          description: role.description,
          sortOrder: role.sortOrder,
        },
      });
      roleIdMap.set(role.id, created.id);
    }

    const workflowIdMap = new Map<number, number>();
    for (const workflow of source.workflows) {
      const created = await tx.templateWorkflow.create({
        data: {
          templateId: newTemplate.id,
          name: workflow.name,
          description: workflow.description,
          isDefault: workflow.isDefault,
          isActive: workflow.isActive,
        },
      });
      workflowIdMap.set(workflow.id, created.id);
    }

    const statusIdMap = new Map<number, number>();
    for (const workflow of source.workflows) {
      const newWorkflowId = workflowIdMap.get(workflow.id)!;
      for (const status of workflow.statuses) {
        const created = await tx.templateWorkflowStatus.create({
          data: {
            workflowId: newWorkflowId,
            name: status.name,
            key: status.key,
            description: status.description,
            sortOrder: status.sortOrder,
            category: status.category,
            color: status.color,
            isInitial: status.isInitial,
            isFinal: status.isFinal,
          },
        });
        statusIdMap.set(status.id, created.id);
      }
    }

    const transitionIdMap = new Map<number, number>();
    for (const workflow of source.workflows) {
      const newWorkflowId = workflowIdMap.get(workflow.id)!;
      for (const transition of workflow.transitions) {
        const created = await tx.templateWorkflowTransition.create({
          data: {
            workflowId: newWorkflowId,
            fromStatusId: statusIdMap.get(transition.fromStatusId)!,
            toStatusId: statusIdMap.get(transition.toStatusId)!,
            name: transition.name,
            isActive: transition.isActive,
          },
        });
        transitionIdMap.set(transition.id, created.id);
      }
    }

    for (const workflow of source.workflows) {
      for (const transition of workflow.transitions) {
        const newTransitionId = transitionIdMap.get(transition.id)!;
        for (const rule of transition.approvalRules) {
          await tx.templateApprovalRule.create({
            data: {
              transitionId: newTransitionId,
              approverType: rule.approverType,
              projectRoleId: rule.projectRoleId
                ? roleIdMap.get(rule.projectRoleId)!
                : null,
              taskRole: rule.taskRole,
              minApprovals: rule.minApprovals,
              onRejectStatusId: statusIdMap.get(rule.onRejectStatusId)!,
            },
          });
        }
      }
    }

    for (const taskType of source.taskTypes) {
      await tx.templateTaskType.create({
        data: {
          templateId: newTemplate.id,
          workflowId: taskType.workflowId
            ? workflowIdMap.get(taskType.workflowId)!
            : null,
          name: taskType.name,
          key: taskType.key,
          description: taskType.description,
          sortOrder: taskType.sortOrder,
          isActive: taskType.isActive,
        },
      });
    }

    return newTemplate.id;
  });
}

export function findTemplateDetailForActivation(id: number) {
  return prisma.projectTemplate.findUnique({
    where: { id },
    include: {
      projectRoles: true,
      taskTypes: true,
      workflows: {
        include: {
          statuses: true,
          transitions: {
            include: { approvalRules: true },
          },
        },
      },
    },
  });
}
