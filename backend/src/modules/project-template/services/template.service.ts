import { Prisma } from "@prisma/client";
import { ProjectTemplateStatus } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import * as repo from "@/modules/project-template/project-template.repository";
import type { TemplateDetailRecord } from "@/modules/project-template/project-template.repository";
import type {
  CreateTemplateInput,
  DuplicateTemplateInput,
  ListTemplatesQuery,
  UpdateTemplateInput,
} from "@/modules/project-template/project-template.schema";
import type { TemplateDetail } from "@/modules/project-template/project-template.types";
import { validateTemplateForActivation } from "@/modules/project-template/services/template-activation.service";

export function mapTemplateDetail(
  template: TemplateDetailRecord,
): TemplateDetail {
  return {
    id: template.id,
    key: template.key,
    name: template.name,
    description: template.description,
    status: template.status,
    version: template.version,
    parentTemplateId: template.parentTemplateId,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    projectRoles: template.projectRoles.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      sortOrder: role.sortOrder,
    })),
    taskTypes: template.taskTypes.map((taskType) => ({
      id: taskType.id,
      workflowId: taskType.workflowId,
      name: taskType.name,
      key: taskType.key,
      description: taskType.description,
      sortOrder: taskType.sortOrder,
      isActive: taskType.isActive,
    })),
    workflows: template.workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      isDefault: workflow.isDefault,
      isActive: workflow.isActive,
      statuses: workflow.statuses.map((status) => ({
        id: status.id,
        name: status.name,
        key: status.key,
        description: status.description,
        sortOrder: status.sortOrder,
        category: status.category,
        color: status.color,
        isInitial: status.isInitial,
        isFinal: status.isFinal,
      })),
      transitions: workflow.transitions.map((transition) => ({
        id: transition.id,
        fromStatusId: transition.fromStatusId,
        toStatusId: transition.toStatusId,
        name: transition.name,
        isActive: transition.isActive,
        approvalRules: transition.approvalRules.map((rule) => ({
          id: rule.id,
          approverType: rule.approverType,
          projectRoleId: rule.projectRoleId,
          taskRole: rule.taskRole,
          minApprovals: rule.minApprovals,
          onRejectStatusId: rule.onRejectStatusId,
        })),
      })),
    })),
  };
}

export async function getTemplateDetailOrThrow(
  templateId: number,
): Promise<TemplateDetail> {
  const template = await repo.findTemplateDetail(templateId);

  if (!template) {
    throw new AppError(404, "Không tìm thấy template");
  }

  return mapTemplateDetail(template);
}

export async function getTemplateOrThrow(templateId: number) {
  const template = await repo.findTemplateById(templateId);

  if (!template) {
    throw new AppError(404, "Không tìm thấy template");
  }

  return template;
}

export async function ensureDraftTemplate(templateId: number) {
  const template = await getTemplateOrThrow(templateId);

  if (template.status !== ProjectTemplateStatus.DRAFT) {
    throw new AppError(400, "Chỉ template DRAFT mới được chỉnh sửa");
  }

  return template;
}

export async function touchTemplate(templateId: number, userId: number) {
  await repo.updateTemplate(templateId, {
    updatedBy: { connect: { id: userId } },
  });
}

async function assertNameAvailable(name: string, excludeId?: number) {
  const existing = await repo.findTemplateByNameAmongDraftOrActive(
    name,
    excludeId,
  );

  if (existing) {
    throw new AppError(
      400,
      "Tên template đã tồn tại ở trạng thái DRAFT hoặc ACTIVE",
    );
  }
}

export function handleUniqueError(error: unknown, context: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(409, `${context} đã tồn tại`);
  }

  throw error;
}

export async function listTemplates(query: ListTemplatesQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const [templates, total] = await Promise.all([
    repo.findTemplates({
      skip,
      take: limit,
      keyword: query.keyword,
      status: query.status,
    }),
    repo.countTemplates({
      keyword: query.keyword,
      status: query.status,
    }),
  ]);

  return {
    templates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

export async function createTemplate(
  userId: number,
  input: CreateTemplateInput,
) {
  const existingKey = await repo.findTemplateByKey(input.key);

  if (existingKey) {
    throw new AppError(409, "Key template đã tồn tại");
  }

  await assertNameAvailable(input.name);

  try {
    return await repo.createTemplate({
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      status: ProjectTemplateStatus.DRAFT,
      version: 1,
      createdBy: { connect: { id: userId } },
    });
  } catch (error) {
    handleUniqueError(error, "Key hoặc tên template");
  }
}

export async function getTemplateDetail(templateId: number) {
  return getTemplateDetailOrThrow(templateId);
}

export async function updateTemplate(
  templateId: number,
  userId: number,
  input: UpdateTemplateInput,
) {
  const template = await getTemplateOrThrow(templateId);

  if (template.status !== ProjectTemplateStatus.DRAFT) {
    throw new AppError(400, "Chỉ template DRAFT mới được chỉnh sửa");
  }

  if (input.name) {
    await assertNameAvailable(input.name, templateId);
  }

  try {
    await repo.updateTemplate(templateId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      updatedBy: { connect: { id: userId } },
    });
  } catch (error) {
    handleUniqueError(error, "Tên template");
  }

  return getTemplateDetailOrThrow(templateId);
}

export async function deleteTemplate(templateId: number) {
  const template = await getTemplateOrThrow(templateId);

  if (template.status !== ProjectTemplateStatus.DRAFT) {
    throw new AppError(400, "Chỉ template DRAFT mới được xóa");
  }

  await repo.deleteTemplateInTransaction(templateId);
}

export async function archiveTemplate(templateId: number, userId: number) {
  const template = await getTemplateOrThrow(templateId);

  if (template.status !== ProjectTemplateStatus.ACTIVE) {
    throw new AppError(400, "Chỉ template ACTIVE mới được lưu trữ");
  }

  await repo.updateTemplate(templateId, {
    status: ProjectTemplateStatus.ARCHIVED,
    updatedBy: { connect: { id: userId } },
  });

  return getTemplateDetailOrThrow(templateId);
}

export async function duplicateTemplate(
  templateId: number,
  userId: number,
  input: DuplicateTemplateInput,
) {
  const source = await repo.findTemplateForDuplicate(templateId);

  if (!source) {
    throw new AppError(404, "Không tìm thấy template");
  }

  if (
    source.status !== ProjectTemplateStatus.ACTIVE &&
    source.status !== ProjectTemplateStatus.ARCHIVED
  ) {
    throw new AppError(
      400,
      "Chỉ template ACTIVE hoặc ARCHIVED mới được sao chép",
    );
  }

  const existingKey = await repo.findTemplateByKey(input.key);

  if (existingKey) {
    throw new AppError(409, "Key template đã tồn tại");
  }

  await assertNameAvailable(input.name);

  try {
    const newTemplateId = await repo.duplicateTemplateInTransaction(source, {
      key: input.key,
      name: input.name,
      description: input.description ?? source.description,
      createdById: userId,
    });

    return getTemplateDetailOrThrow(newTemplateId);
  } catch (error) {
    handleUniqueError(error, "Key hoặc tên template");
  }
}

export async function activateTemplate(templateId: number, userId: number) {
  const template = await getTemplateOrThrow(templateId);

  if (template.status !== ProjectTemplateStatus.DRAFT) {
    throw new AppError(400, "Chỉ template DRAFT mới được kích hoạt");
  }

  const fullTemplate = await repo.findTemplateDetailForActivation(templateId);

  if (!fullTemplate) {
    throw new AppError(404, "Không tìm thấy template");
  }

  const errors = validateTemplateForActivation(fullTemplate);

  if (errors.length > 0) {
    throw new AppError(400, "Cấu hình template chưa hợp lệ", errors);
  }

  await repo.updateTemplate(templateId, {
    status: ProjectTemplateStatus.ACTIVE,
    updatedBy: { connect: { id: userId } },
  });

  return getTemplateDetailOrThrow(templateId);
}
