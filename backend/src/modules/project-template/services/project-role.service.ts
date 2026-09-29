import { Prisma } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import * as repo from "@/modules/project-template/project-template.repository";
import type {
  CreateProjectRoleInput,
  UpdateProjectRoleInput,
} from "@/modules/project-template/project-template.schema";
import {
  ensureDraftTemplate,
  handleUniqueError,
  touchTemplate,
} from "@/modules/project-template/services/template.service";

export async function createProjectRole(
  templateId: number,
  userId: number,
  input: CreateProjectRoleInput,
) {
  await ensureDraftTemplate(templateId);

  const existingKey = await repo.findProjectRoleByKey(templateId, input.key);
  if (existingKey) {
    throw new AppError(409, "Key vai trò đã tồn tại trong template");
  }

  const existingName = await repo.findProjectRoleByName(templateId, input.name);
  if (existingName) {
    throw new AppError(409, "Tên vai trò đã tồn tại trong template");
  }

  try {
    const role = await repo.createProjectRole({
      template: { connect: { id: templateId } },
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
    });

    await touchTemplate(templateId, userId);
    return role;
  } catch (error) {
    handleUniqueError(error, "Key hoặc tên vai trò");
  }
}

export async function updateProjectRole(
  templateId: number,
  roleId: number,
  userId: number,
  input: UpdateProjectRoleInput,
) {
  await ensureDraftTemplate(templateId);

  const role = await repo.findProjectRole(templateId, roleId);
  if (!role) {
    throw new AppError(404, "Không tìm thấy vai trò dự án");
  }

  if (input.name) {
    const existingName = await repo.findProjectRoleByName(templateId, input.name);
    if (existingName && existingName.id !== roleId) {
      throw new AppError(409, "Tên vai trò đã tồn tại trong template");
    }
  }

  try {
    const updated = await repo.updateProjectRole(roleId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    });

    await touchTemplate(templateId, userId);
    return updated;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "Tên vai trò đã tồn tại trong template");
    }
    throw error;
  }
}

export async function deleteProjectRole(
  templateId: number,
  roleId: number,
  userId: number,
) {
  await ensureDraftTemplate(templateId);

  const role = await repo.findProjectRole(templateId, roleId);
  if (!role) {
    throw new AppError(404, "Không tìm thấy vai trò dự án");
  }

  const ruleCount = await repo.countApprovalRulesByProjectRole(roleId);
  if (ruleCount > 0) {
    throw new AppError(
      400,
      "Không thể xóa vai trò đang được quy tắc duyệt sử dụng",
    );
  }

  await repo.deleteProjectRole(roleId);
  await touchTemplate(templateId, userId);
}
