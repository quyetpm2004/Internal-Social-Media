import { Prisma, WorkflowStatusCategory } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import * as repo from "@/modules/project-template/project-template.repository";
import type {
  CreateStatusInput,
  CreateTransitionInput,
  CreateWorkflowInput,
  UpdateStatusInput,
  UpdateTransitionInput,
  UpdateWorkflowInput,
} from "@/modules/project-template/project-template.schema";
import {
  ensureDraftTemplate,
  handleUniqueError,
  touchTemplate,
} from "@/modules/project-template/services/template.service";

function validateStatusCategoryRules(input: {
  category: WorkflowStatusCategory;
  isInitial: boolean;
  isFinal: boolean;
}) {
  if (input.isInitial && input.isFinal) {
    throw new AppError(
      400,
      "Trạng thái không thể vừa là bắt đầu vừa là kết thúc",
    );
  }

  if (input.isInitial && input.category !== WorkflowStatusCategory.TODO) {
    throw new AppError(400, "Trạng thái bắt đầu phải có category TODO");
  }

  if (
    input.isFinal &&
    input.category !== WorkflowStatusCategory.DONE &&
    input.category !== WorkflowStatusCategory.CANCELLED
  ) {
    throw new AppError(
      400,
      "Trạng thái kết thúc phải có category DONE hoặc CANCELLED",
    );
  }

  if (
    input.category === WorkflowStatusCategory.IN_PROGRESS &&
    (input.isInitial || input.isFinal)
  ) {
    throw new AppError(
      400,
      "Category IN_PROGRESS không được là trạng thái bắt đầu hoặc kết thúc",
    );
  }
}

async function ensureWorkflowInTemplate(templateId: number, workflowId: number) {
  const workflow = await repo.findWorkflow(templateId, workflowId);
  if (!workflow) {
    throw new AppError(404, "Không tìm thấy workflow");
  }
  return workflow;
}

export async function createWorkflow(
  templateId: number,
  userId: number,
  input: CreateWorkflowInput,
) {
  await ensureDraftTemplate(templateId);

  try {
    const workflow = await repo.createWorkflowInTransaction(templateId, {
      name: input.name,
      description: input.description ?? null,
      isDefault: input.isDefault,
      isActive: input.isActive,
    });

    await touchTemplate(templateId, userId);
    return workflow;
  } catch (error) {
    handleUniqueError(error, "Workflow");
  }
}

export async function updateWorkflow(
  templateId: number,
  workflowId: number,
  userId: number,
  input: UpdateWorkflowInput,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  try {
    const workflow = await repo.updateWorkflowInTransaction(
      templateId,
      workflowId,
      {
        name: input.name,
        description: input.description,
        isDefault: input.isDefault,
        isActive: input.isActive,
      },
    );

    await touchTemplate(templateId, userId);
    return workflow;
  } catch (error) {
    handleUniqueError(error, "Workflow");
  }
}

export async function deleteWorkflow(
  templateId: number,
  workflowId: number,
  userId: number,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  const taskTypeCount = await repo.countTaskTypesByWorkflow(workflowId);
  if (taskTypeCount > 0) {
    throw new AppError(
      400,
      "Không thể xóa workflow đang được loại công việc sử dụng",
    );
  }

  await repo.deleteWorkflowInTransaction(workflowId);
  await touchTemplate(templateId, userId);
}

export async function createStatus(
  templateId: number,
  workflowId: number,
  userId: number,
  input: CreateStatusInput,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  const isInitial = input.isInitial ?? false;
  const isFinal = input.isFinal ?? false;

  validateStatusCategoryRules({
    category: input.category,
    isInitial,
    isFinal,
  });

  const existingKey = await repo.findStatusByKey(workflowId, input.key);
  if (existingKey) {
    throw new AppError(409, "Key trạng thái đã tồn tại trong workflow");
  }

  const existingName = await repo.findStatusByName(workflowId, input.name);
  if (existingName) {
    throw new AppError(409, "Tên trạng thái đã tồn tại trong workflow");
  }

  try {
    const status = await repo.createStatusInTransaction(workflowId, {
      name: input.name,
      key: input.key,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      category: input.category,
      color: input.color ?? null,
      isInitial,
      isFinal,
    });

    await touchTemplate(templateId, userId);
    return status;
  } catch (error) {
    handleUniqueError(error, "Key hoặc tên trạng thái");
  }
}

export async function updateStatus(
  templateId: number,
  workflowId: number,
  statusId: number,
  userId: number,
  input: UpdateStatusInput,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  const status = await repo.findStatus(workflowId, statusId);
  if (!status) {
    throw new AppError(404, "Không tìm thấy trạng thái");
  }

  const nextCategory = input.category ?? status.category;
  const nextIsInitial = input.isInitial ?? status.isInitial;
  const nextIsFinal = input.isFinal ?? status.isFinal;

  validateStatusCategoryRules({
    category: nextCategory,
    isInitial: nextIsInitial,
    isFinal: nextIsFinal,
  });

  if (input.name) {
    const existingName = await repo.findStatusByName(workflowId, input.name);
    if (existingName && existingName.id !== statusId) {
      throw new AppError(409, "Tên trạng thái đã tồn tại trong workflow");
    }
  }

  try {
    const updated = await repo.updateStatusInTransaction(workflowId, statusId, {
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      category: input.category,
      color: input.color,
      isInitial: input.isInitial,
      isFinal: input.isFinal,
    });

    await touchTemplate(templateId, userId);
    return updated;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "Tên trạng thái đã tồn tại trong workflow");
    }
    throw error;
  }
}

export async function deleteStatus(
  templateId: number,
  workflowId: number,
  statusId: number,
  userId: number,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  const status = await repo.findStatus(workflowId, statusId);
  if (!status) {
    throw new AppError(404, "Không tìm thấy trạng thái");
  }

  await repo.deleteStatusInTransaction(statusId);
  await touchTemplate(templateId, userId);
}

async function assertStatusInWorkflow(workflowId: number, statusId: number) {
  const status = await repo.findStatus(workflowId, statusId);
  if (!status) {
    throw new AppError(400, "Trạng thái không thuộc workflow này");
  }
  return status;
}

export async function createTransition(
  templateId: number,
  workflowId: number,
  userId: number,
  input: CreateTransitionInput,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  if (input.fromStatusId === input.toStatusId) {
    throw new AppError(400, "Trạng thái nguồn và đích phải khác nhau");
  }

  await assertStatusInWorkflow(workflowId, input.fromStatusId);
  await assertStatusInWorkflow(workflowId, input.toStatusId);

  const existing = await repo.findTransitionByTriple(
    workflowId,
    input.fromStatusId,
    input.toStatusId,
  );
  if (existing) {
    throw new AppError(409, "Transition đã tồn tại giữa hai trạng thái này");
  }

  try {
    const transition = await repo.createTransition({
      workflow: { connect: { id: workflowId } },
      fromStatus: { connect: { id: input.fromStatusId } },
      toStatus: { connect: { id: input.toStatusId } },
      name: input.name,
      isActive: input.isActive ?? true,
    });

    await touchTemplate(templateId, userId);
    return transition;
  } catch (error) {
    handleUniqueError(error, "Transition");
  }
}

export async function updateTransition(
  templateId: number,
  workflowId: number,
  transitionId: number,
  userId: number,
  input: UpdateTransitionInput,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  const transition = await repo.findTransition(workflowId, transitionId);
  if (!transition) {
    throw new AppError(404, "Không tìm thấy transition");
  }

  const fromStatusId = input.fromStatusId ?? transition.fromStatusId;
  const toStatusId = input.toStatusId ?? transition.toStatusId;

  if (fromStatusId === toStatusId) {
    throw new AppError(400, "Trạng thái nguồn và đích phải khác nhau");
  }

  if (input.fromStatusId !== undefined) {
    await assertStatusInWorkflow(workflowId, input.fromStatusId);
  }

  if (input.toStatusId !== undefined) {
    await assertStatusInWorkflow(workflowId, input.toStatusId);
  }

  const existing = await repo.findTransitionByTriple(
    workflowId,
    fromStatusId,
    toStatusId,
    transitionId,
  );
  if (existing) {
    throw new AppError(409, "Transition đã tồn tại giữa hai trạng thái này");
  }

  try {
    const updated = await repo.updateTransition(transitionId, {
      ...(input.fromStatusId !== undefined
        ? { fromStatus: { connect: { id: input.fromStatusId } } }
        : {}),
      ...(input.toStatusId !== undefined
        ? { toStatus: { connect: { id: input.toStatusId } } }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    await touchTemplate(templateId, userId);
    return updated;
  } catch (error) {
    handleUniqueError(error, "Transition");
  }
}

export async function deleteTransition(
  templateId: number,
  workflowId: number,
  transitionId: number,
  userId: number,
) {
  await ensureDraftTemplate(templateId);
  await ensureWorkflowInTemplate(templateId, workflowId);

  const transition = await repo.findTransition(workflowId, transitionId);
  if (!transition) {
    throw new AppError(404, "Không tìm thấy transition");
  }

  await repo.deleteTransition(transitionId);
  await touchTemplate(templateId, userId);
}
