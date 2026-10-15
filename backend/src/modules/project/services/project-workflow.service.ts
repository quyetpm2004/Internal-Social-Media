import {
  Prisma,
  WorkflowStatusCategory,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import * as projectRepository from "@/modules/project/project.repository";
import * as projectTaskRepository from "@/modules/project/project-task.repository";
import {
  mapProjectApprovalRule,
  mapProjectWorkflowStatus,
  mapProjectWorkflowSummary,
  mapProjectWorkflowTransition,
  mapWorkflowConfig,
} from "@/modules/project/project.mapper";
import type {
  CreateProjectApprovalRuleInput,
  CreateProjectWorkflowInput,
  CreateProjectWorkflowStatusInput,
  CreateProjectWorkflowTransitionInput,
  CreateProjectTaskTypeInput,
  UpdateProjectApprovalRuleInput,
  UpdateProjectTaskTypeInput,
  UpdateProjectWorkflowInput,
  UpdateProjectWorkflowStatusInput,
  UpdateProjectWorkflowTransitionInput,
} from "@/modules/project/project.schema";

type StatusFlags = {
  category: WorkflowStatusCategory;
  isInitial: boolean;
  isFinal: boolean;
};

type ApprovalRuleFields = {
  approverType: "PROJECT_ROLE" | "TASK_ROLE";
  projectRoleId: number | null;
  taskRole: "ASSIGNEE" | "REVIEWER" | "REPORTER" | null;
  minApprovals: number;
  onRejectStatusId: number;
};

const TASK_IN_USE_MESSAGE = "Đang có công việc sử dụng dữ liệu này";

function rethrowUnique(error: unknown, message: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(409, message);
  }
  throw error;
}

function rethrowIfTaskInUse(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    throw new AppError(400, TASK_IN_USE_MESSAGE);
  }
  throw error;
}

function assertStatusFlags(input: StatusFlags) {
  if (input.isInitial && input.isFinal) {
    throw new AppError(
      400,
      "Trạng thái không thể vừa là bắt đầu vừa là kết thúc",
    );
  }

  if (
    input.category === WorkflowStatusCategory.IN_PROGRESS &&
    (input.isInitial || input.isFinal)
  ) {
    throw new AppError(
      400,
      "Nhóm Đang làm không được là trạng thái bắt đầu hoặc kết thúc",
    );
  }

  if (input.isInitial && input.category !== WorkflowStatusCategory.TODO) {
    throw new AppError(400, "Trạng thái bắt đầu phải có nhóm Cần làm");
  }

  if (
    input.isFinal &&
    input.category !== WorkflowStatusCategory.DONE &&
    input.category !== WorkflowStatusCategory.CANCELLED
  ) {
    throw new AppError(
      400,
      "Trạng thái kết thúc phải có nhóm Hoàn thành hoặc Hủy",
    );
  }
}

async function assertCanView(projectId: number, userId: number) {
  const project = await projectRepository.findVisibleProject(projectId, userId);
  if (!project) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
}

async function assertCanConfigure(projectId: number, userId: number) {
  await assertCanView(projectId, userId);
  const canConfigure = await projectRepository.canManageMembers(
    projectId,
    userId,
  );
  if (!canConfigure) {
    throw new AppError(403, "Bạn không có quyền sửa quy trình");
  }
}

async function assertWorkflow(projectId: number, workflowId: number) {
  const workflow = await projectRepository.findProjectWorkflow(
    projectId,
    workflowId,
  );
  if (!workflow) {
    throw new AppError(404, "Không tìm thấy quy trình");
  }
  return workflow;
}

// Check trạng thái có thuộc quy trình không
async function assertStatusesInWorkflow(
  workflowId: number,
  statusIds: number[],
) {
  const uniqueIds = [...new Set(statusIds)];
  const found = await projectRepository.countStatusesInWorkflow(
    workflowId,
    uniqueIds,
  );
  if (found !== uniqueIds.length) {
    throw new AppError(400, "Trạng thái không thuộc quy trình này");
  }
}

function sameStatusIds(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  const seen = new Set(left);
  if (seen.size !== left.length) return false;
  return right.every((id) => seen.has(id));
}

function assertApprovalRuleShape(fields: ApprovalRuleFields) {
  if (fields.minApprovals < 1) {
    throw new AppError(400, "Số người duyệt phải từ 1");
  }

  if (fields.approverType === "PROJECT_ROLE") {
    if (!fields.projectRoleId || fields.taskRole != null) {
      throw new AppError(400, "PROJECT_ROLE yêu cầu vai trò dự án");
    }
  }

  if (fields.approverType === "TASK_ROLE") {
    if (!fields.taskRole || fields.projectRoleId != null) {
      throw new AppError(400, "TASK_ROLE yêu cầu vai trò trên công việc");
    }
  }
}

export async function getProjectWorkflows(projectId: number, userId: number) {
  await assertCanView(projectId, userId);

  const [workflows, projectRoles, taskTypes, canConfigure] = await Promise.all([
    projectRepository.listProjectWorkflows(projectId),
    projectRepository.getProjectRoles(projectId),
    projectRepository.listProjectTaskTypes(projectId),
    projectRepository.canManageMembers(projectId, userId),
  ]);

  return mapWorkflowConfig({
    canConfigure,
    projectRoles,
    taskTypes,
    workflows,
  });
}

export async function createWorkflow(
  projectId: number,
  userId: number,
  input: CreateProjectWorkflowInput,
) {
  await assertCanConfigure(projectId, userId);

  if (input.isDefault && !input.isActive) {
    throw new AppError(400, "Quy trình mặc định phải đang dùng");
  }

  const workflow = await projectRepository.createProjectWorkflow(projectId, {
    name: input.name,
    description: input.description,
    isDefault: input.isDefault,
    isActive: input.isActive,
  });

  return mapProjectWorkflowSummary(workflow);
}

export async function updateWorkflow(
  projectId: number,
  workflowId: number,
  userId: number,
  input: UpdateProjectWorkflowInput,
) {
  await assertCanConfigure(projectId, userId);
  const current = await assertWorkflow(projectId, workflowId);

  // Đang là default thì không thể xóa
  if (input.isDefault === false && current.isDefault) {
    throw new AppError(400, "Dự án phải có một quy trình mặc định");
  }

  const nextDefault = input.isDefault ?? current.isDefault;
  const nextActive = input.isActive ?? current.isActive;
  if (nextDefault && !nextActive) {
    throw new AppError(400, "Quy trình mặc định phải đang dùng");
  }

  const workflow = await projectRepository.updateProjectWorkflow(
    projectId,
    workflowId,
    input,
  );
  return mapProjectWorkflowSummary(workflow);
}

export async function deleteWorkflow(
  projectId: number,
  workflowId: number,
  userId: number,
) {
  await assertCanConfigure(projectId, userId);
  const workflow = await assertWorkflow(projectId, workflowId);

  if (workflow.isDefault) {
    throw new AppError(400, "Không thể xóa quy trình mặc định");
  }

  const [workflowCount, taskTypeCount] = await Promise.all([
    projectRepository.countProjectWorkflows(projectId),
    projectRepository.countTaskTypesUsingWorkflow(workflowId),
  ]);

  if (workflowCount <= 1) {
    throw new AppError(400, "Dự án phải có ít nhất một quy trình");
  }

  if (taskTypeCount > 0) {
    throw new AppError(
      400,
      "Không thể xóa quy trình đang được loại công việc sử dụng",
    );
  }

  const taskCount = await projectTaskRepository.countTasksUsingWorkflow(
    workflowId,
  );
  if (taskCount > 0) {
    throw new AppError(400, TASK_IN_USE_MESSAGE);
  }

  try {
    await projectRepository.deleteProjectWorkflow(workflowId);
  } catch (error) {
    rethrowIfTaskInUse(error);
  }
  return true;
}

export async function createStatus(
  projectId: number,
  workflowId: number,
  userId: number,
  input: CreateProjectWorkflowStatusInput,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  assertStatusFlags({
    category: input.category,
    isInitial: input.isInitial,
    isFinal: input.isFinal,
  });

  const [existingKey, existingName] = await Promise.all([
    projectRepository.findProjectWorkflowStatusByKey(workflowId, input.key),
    projectRepository.findProjectWorkflowStatusByName(workflowId, input.name),
  ]);
  if (existingKey) {
    throw new AppError(409, "Key trạng thái đã tồn tại trong quy trình");
  }
  if (existingName) {
    throw new AppError(409, "Tên trạng thái đã tồn tại trong quy trình");
  }

  try {
    const status = await projectRepository.createProjectWorkflowStatus(
      workflowId,
      input,
    );
    return mapProjectWorkflowStatus(status);
  } catch (error) {
    rethrowUnique(error, "Key hoặc tên trạng thái đã tồn tại trong quy trình");
  }
}

export async function updateStatus(
  projectId: number,
  workflowId: number,
  statusId: number,
  userId: number,
  input: UpdateProjectWorkflowStatusInput,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const current = await projectRepository.findProjectWorkflowStatus(
    workflowId,
    statusId,
  );
  if (!current) {
    throw new AppError(404, "Không tìm thấy trạng thái");
  }

  assertStatusFlags({
    category: input.category ?? current.category,
    isInitial: input.isInitial ?? current.isInitial,
    isFinal: input.isFinal ?? current.isFinal,
  });

  if (input.name !== undefined) {
    const existingName = await projectRepository.findProjectWorkflowStatusByName(
      workflowId,
      input.name,
    );
    if (existingName && existingName.id !== statusId) {
      throw new AppError(409, "Tên trạng thái đã tồn tại trong quy trình");
    }
  }

  try {
    const status = await projectRepository.updateProjectWorkflowStatus(
      workflowId,
      statusId,
      input,
    );
    return mapProjectWorkflowStatus(status);
  } catch (error) {
    rethrowUnique(error, "Tên trạng thái đã tồn tại trong quy trình");
  }
}

export async function deleteStatus(
  projectId: number,
  workflowId: number,
  statusId: number,
  userId: number,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const status = await projectRepository.findProjectWorkflowStatus(
    workflowId,
    statusId,
  );
  if (!status) {
    throw new AppError(404, "Không tìm thấy trạng thái");
  }

  const taskCount = await projectTaskRepository.countTasksUsingStatus(statusId);
  if (taskCount > 0) {
    throw new AppError(400, TASK_IN_USE_MESSAGE);
  }

  try {
    await projectRepository.deleteProjectWorkflowStatus(statusId);
  } catch (error) {
    rethrowIfTaskInUse(error);
  }
  return true;
}

export async function reorderStatuses(
  projectId: number,
  workflowId: number,
  userId: number,
  statusIds: number[],
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const current = await projectRepository.listProjectWorkflowStatusIds(
    workflowId,
  );
  if (!sameStatusIds(current.map((status) => status.id), statusIds)) {
    throw new AppError(400, "Danh sách trạng thái không khớp quy trình");
  }

  await projectRepository.reorderProjectWorkflowStatuses(statusIds);
  return true;
}

async function assertTransitionPair(
  workflowId: number,
  fromStatusId: number,
  toStatusId: number,
  excludeId?: number,
) {
  if (fromStatusId === toStatusId) {
    throw new AppError(400, "Trạng thái nguồn và đích phải khác nhau");
  }

  await assertStatusesInWorkflow(workflowId, [fromStatusId, toStatusId]);

  const existing = await projectRepository.findProjectWorkflowTransitionByPair(
    workflowId,
    fromStatusId,
    toStatusId,
    excludeId,
  );
  if (existing) {
    throw new AppError(409, "Đã có đường đi giữa hai trạng thái này");
  }
}

export async function createTransition(
  projectId: number,
  workflowId: number,
  userId: number,
  input: CreateProjectWorkflowTransitionInput,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);
  await assertTransitionPair(workflowId, input.fromStatusId, input.toStatusId);

  try {
    const transition = await projectRepository.createProjectWorkflowTransition({
      workflowId,
      fromStatusId: input.fromStatusId,
      toStatusId: input.toStatusId,
      name: input.name,
    });
    return mapProjectWorkflowTransition(transition);
  } catch (error) {
    rethrowUnique(error, "Đã có đường đi giữa hai trạng thái này");
  }
}

export async function updateTransition(
  projectId: number,
  workflowId: number,
  transitionId: number,
  userId: number,
  input: UpdateProjectWorkflowTransitionInput,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const current = await projectRepository.findProjectWorkflowTransition(
    workflowId,
    transitionId,
  );
  if (!current) {
    throw new AppError(404, "Không tìm thấy đường đi");
  }

  const fromStatusId = input.fromStatusId ?? current.fromStatusId;
  const toStatusId = input.toStatusId ?? current.toStatusId;
  const endpointsChanged =
    fromStatusId !== current.fromStatusId || toStatusId !== current.toStatusId;

  if (endpointsChanged || input.fromStatusId !== undefined || input.toStatusId !== undefined) {
    // To # from
    // Chưa tồn tại
    // Có status trong workflow hay không
    await assertTransitionPair(workflowId, fromStatusId, toStatusId, transitionId);
  }

  try {
    const transition = await projectRepository.updateProjectWorkflowTransition(
      transitionId,
      {
        ...(input.fromStatusId !== undefined
          ? { fromStatusId: input.fromStatusId }
          : {}),
        ...(input.toStatusId !== undefined
          ? { toStatusId: input.toStatusId }
          : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    );
    return mapProjectWorkflowTransition(transition);
  } catch (error) {
    rethrowUnique(error, "Đã có đường đi giữa hai trạng thái này");
  }
}

export async function deleteTransition(
  projectId: number,
  workflowId: number,
  transitionId: number,
  userId: number,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const transition = await projectRepository.findProjectWorkflowTransition(
    workflowId,
    transitionId,
  );
  if (!transition) {
    throw new AppError(404, "Không tìm thấy đường đi");
  }

  await projectRepository.deleteProjectWorkflowTransition(transitionId);
  return true;
}

async function assertApprovalRuleTarget(
  projectId: number,
  workflowId: number,
  toStatusId: number,
  fields: ApprovalRuleFields,
) {
  assertApprovalRuleShape(fields);

  if (fields.projectRoleId != null) {
    const role = await projectRepository.findProjectRoleInProject(
      projectId,
      fields.projectRoleId,
    );
    if (!role) {
      throw new AppError(400, "Vai trò không thuộc dự án này");
    }
  }

  const rejectStatus = await projectRepository.findProjectWorkflowStatus(
    workflowId,
    fields.onRejectStatusId,
  );
  if (!rejectStatus) {
    throw new AppError(400, "Trạng thái từ chối không thuộc quy trình này");
  }

  if (fields.onRejectStatusId === toStatusId) {
    throw new AppError(
      400,
      "Trạng thái từ chối không được trùng trạng thái đích",
    );
  }
}

export async function createApprovalRule(
  projectId: number,
  workflowId: number,
  transitionId: number,
  userId: number,
  input: CreateProjectApprovalRuleInput,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const transition = await projectRepository.findProjectWorkflowTransition(
    workflowId,
    transitionId,
  );
  if (!transition) {
    throw new AppError(404, "Không tìm thấy đường đi");
  }

  const fields: ApprovalRuleFields = {
    approverType: input.approverType,
    projectRoleId: input.projectRoleId,
    taskRole: input.taskRole,
    minApprovals: input.minApprovals,
    onRejectStatusId: input.onRejectStatusId,
  };

  await assertApprovalRuleTarget(
    projectId,
    workflowId,
    transition.toStatusId,
    fields,
  );

  const duplicate = await projectRepository.findDuplicateProjectApprovalRule({
    transitionId,
    ...fields,
  });
  if (duplicate) {
    throw new AppError(409, "Đường đi này đã có quy tắc cho người duyệt này");
  }

  const rule = await projectRepository.createProjectApprovalRule({
    transitionId,
    ...fields,
  });
  return mapProjectApprovalRule(rule);
}

export async function updateApprovalRule(
  projectId: number,
  workflowId: number,
  transitionId: number,
  ruleId: number,
  userId: number,
  input: UpdateProjectApprovalRuleInput,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const transition = await projectRepository.findProjectWorkflowTransition(
    workflowId,
    transitionId,
  );
  if (!transition) {
    throw new AppError(404, "Không tìm thấy đường đi");
  }

  const current = await projectRepository.findProjectApprovalRule(
    transitionId,
    ruleId,
  );
  if (!current) {
    throw new AppError(404, "Không tìm thấy quy tắc duyệt");
  }

  const fields: ApprovalRuleFields = {
    approverType: input.approverType ?? current.approverType,
    projectRoleId:
      input.projectRoleId !== undefined
        ? input.projectRoleId
        : current.projectRoleId,
    taskRole: input.taskRole !== undefined ? input.taskRole : current.taskRole,
    minApprovals: input.minApprovals ?? current.minApprovals,
    onRejectStatusId: input.onRejectStatusId ?? current.onRejectStatusId,
  };

  await assertApprovalRuleTarget(
    projectId,
    workflowId,
    transition.toStatusId,
    fields,
  );

  const duplicate = await projectRepository.findDuplicateProjectApprovalRule({
    transitionId,
    ...fields,
    excludeId: ruleId,
  });
  if (duplicate) {
    throw new AppError(409, "Đường đi này đã có quy tắc cho người duyệt này");
  }

  const rule = await projectRepository.updateProjectApprovalRule(ruleId, fields);
  return mapProjectApprovalRule(rule);
}

export async function deleteApprovalRule(
  projectId: number,
  workflowId: number,
  transitionId: number,
  ruleId: number,
  userId: number,
) {
  await assertCanConfigure(projectId, userId);
  await assertWorkflow(projectId, workflowId);

  const transition = await projectRepository.findProjectWorkflowTransition(
    workflowId,
    transitionId,
  );
  if (!transition) {
    throw new AppError(404, "Không tìm thấy đường đi");
  }

  const rule = await projectRepository.findProjectApprovalRule(
    transitionId,
    ruleId,
  );
  if (!rule) {
    throw new AppError(404, "Không tìm thấy quy tắc duyệt");
  }

  await projectRepository.deleteProjectApprovalRule(ruleId);
  return true;
}

export async function createTaskType(
  projectId: number,
  userId: number,
  input: CreateProjectTaskTypeInput,
) {
  await assertCanConfigure(projectId, userId);

  if (input.workflowId != null) {
    await assertWorkflow(projectId, input.workflowId);
  }

  const existingKey = await projectRepository.findProjectTaskTypeByKey(
    projectId,
    input.key,
  );
  if (existingKey) {
    throw new AppError(409, "Key loại công việc đã tồn tại trong dự án");
  }

  const existingName = await projectRepository.findProjectTaskTypeByName(
    projectId,
    input.name,
  );
  if (existingName) {
    throw new AppError(409, "Tên loại công việc đã tồn tại trong dự án");
  }

  try {
    return await projectRepository.createProjectTaskType({
      projectId,
      workflowId: input.workflowId,
      key: input.key,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    });
  } catch (error) {
    rethrowUnique(error, "Key hoặc tên loại công việc đã tồn tại");
  }
}

export async function updateTaskType(
  projectId: number,
  taskTypeId: number,
  userId: number,
  input: UpdateProjectTaskTypeInput,
) {
  await assertCanConfigure(projectId, userId);

  const taskType = await projectRepository.findProjectTaskType(
    projectId,
    taskTypeId,
  );
  if (!taskType) {
    throw new AppError(404, "Không tìm thấy loại công việc");
  }

  if (input.workflowId != null) {
    await assertWorkflow(projectId, input.workflowId);
  }

  if (input.name) {
    const existingName = await projectRepository.findProjectTaskTypeByName(
      projectId,
      input.name,
    );
    if (existingName && existingName.id !== taskTypeId) {
      throw new AppError(409, "Tên loại công việc đã tồn tại trong dự án");
    }
  }

  try {
    return await projectRepository.updateProjectTaskType(taskTypeId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.workflowId !== undefined
        ? { workflowId: input.workflowId }
        : {}),
    });
  } catch (error) {
    rethrowUnique(error, "Tên loại công việc đã tồn tại trong dự án");
  }
}

export async function deleteTaskType(
  projectId: number,
  taskTypeId: number,
  userId: number,
) {
  await assertCanConfigure(projectId, userId);

  const taskType = await projectRepository.findProjectTaskType(
    projectId,
    taskTypeId,
  );
  if (!taskType) {
    throw new AppError(404, "Không tìm thấy loại công việc");
  }

  const taskCount = await projectTaskRepository.countTasksUsingTaskType(
    taskTypeId,
  );
  if (taskCount > 0) {
    throw new AppError(400, TASK_IN_USE_MESSAGE);
  }

  try {
    await projectRepository.deleteProjectTaskType(taskTypeId);
  } catch (error) {
    rethrowIfTaskInUse(error);
  }
  return true;
}
