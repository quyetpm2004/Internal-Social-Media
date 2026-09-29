import { Prisma } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import * as repo from "@/modules/project-template/project-template.repository";
import type {
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
} from "@/modules/project-template/project-template.schema";
import {
  ensureDraftTemplate,
  handleUniqueError,
  touchTemplate,
} from "@/modules/project-template/services/template.service";

async function assertWorkflowBelongsToTemplate(
  templateId: number,
  workflowId: number,
) {
  const workflow = await repo.findWorkflow(templateId, workflowId);
  if (!workflow) {
    throw new AppError(400, "Workflow không thuộc template này");
  }
}

export async function createTaskType(
  templateId: number,
  userId: number,
  input: CreateTaskTypeInput,
) {
  await ensureDraftTemplate(templateId);

  if (input.workflowId != null) {
    await assertWorkflowBelongsToTemplate(templateId, input.workflowId);
  }

  const existingKey = await repo.findTaskTypeByKey(templateId, input.key);
  if (existingKey) {
    throw new AppError(409, "Key loại công việc đã tồn tại trong template");
  }

  const existingName = await repo.findTaskTypeByName(templateId, input.name);
  if (existingName) {
    throw new AppError(409, "Tên loại công việc đã tồn tại trong template");
  }

  try {
    const taskType = await repo.createTaskType({
      template: { connect: { id: templateId } },
      ...(input.workflowId != null
        ? { workflow: { connect: { id: input.workflowId } } }
        : {}),
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    });

    await touchTemplate(templateId, userId);
    return taskType;
  } catch (error) {
    handleUniqueError(error, "Key hoặc tên loại công việc");
  }
}

export async function updateTaskType(
  templateId: number,
  taskTypeId: number,
  userId: number,
  input: UpdateTaskTypeInput,
) {
  await ensureDraftTemplate(templateId);

  const taskType = await repo.findTaskType(templateId, taskTypeId);
  if (!taskType) {
    throw new AppError(404, "Không tìm thấy loại công việc");
  }

  if (input.workflowId != null) {
    await assertWorkflowBelongsToTemplate(templateId, input.workflowId);
  }

  if (input.name) {
    const existingName = await repo.findTaskTypeByName(templateId, input.name);
    if (existingName && existingName.id !== taskTypeId) {
      throw new AppError(409, "Tên loại công việc đã tồn tại trong template");
    }
  }

  try {
    const updated = await repo.updateTaskType(taskTypeId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.workflowId !== undefined
        ? input.workflowId === null
          ? { workflow: { disconnect: true } }
          : { workflow: { connect: { id: input.workflowId } } }
        : {}),
    });

    await touchTemplate(templateId, userId);
    return updated;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "Tên loại công việc đã tồn tại trong template");
    }
    throw error;
  }
}

export async function deleteTaskType(
  templateId: number,
  taskTypeId: number,
  userId: number,
) {
  await ensureDraftTemplate(templateId);

  const taskType = await repo.findTaskType(templateId, taskTypeId);
  if (!taskType) {
    throw new AppError(404, "Không tìm thấy loại công việc");
  }

  await repo.deleteTaskType(taskTypeId);
  await touchTemplate(templateId, userId);
}
