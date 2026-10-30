import {
  Prisma,
  ProjectPriority,
  TemplateTaskRole,
  WorkflowStatusCategory,
  WorkflowTransitionMode,
} from "@prisma/client";
import {
  mapProjectTaskDetail,
  mapProjectTaskListItem,
} from "@/modules/project/project.mapper";
import {
  assertDates,
  attachmentFailure,
  avatarUrlMap,
  mapStoredFile,
  mapTaskComment,
  isCalendarDate,
  isForeignKeyError,
  presentDescription,
  resolveCompletedAt,
  storedDescription,
  toDate,
} from "@/modules/project/task-common";
import * as projectRepository from "@/modules/project/project.repository";
import * as projectTaskRepository from "@/modules/project/project-task.repository";
import type { TaskMemberWrite } from "@/modules/project/project-task.repository";
import type {
  CreateProjectTaskCommentInput,
  ProjectTaskListQuery,
  SaveProjectTaskInput,
  UpdateProjectTaskStatusInput,
} from "@/modules/project/project.schema";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";

function taskTypeBelongsToWorkflow(
  taskTypeWorkflowId: number | null,
  workflow: { id: number; isDefault: boolean },
) {
  if (taskTypeWorkflowId === workflow.id) return true;
  return taskTypeWorkflowId == null && workflow.isDefault;
}

const TASK_IN_USE_BY_PARENT = "Hãy xóa hoặc chuyển các việc con trước";

/**
 * Check xem assignees, reviewerIds có hợp lệ hay k
 * Chọn ít nhất một quyền phụ trách
 * Mỗi quyền phụ trách chỉ chọn một lần
 * Người giám sát bị trùng
 */
function assertPeopleShape(input: SaveProjectTaskInput) {
  if (input.assignees.length < 1) {
    throw new AppError(400, "Chọn ít nhất một quyền phụ trách");
  }
  const roleIds = input.assignees.map((assignee) => assignee.projectRoleId);
  if (new Set(roleIds).size !== roleIds.length) {
    throw new AppError(400, "Mỗi quyền phụ trách chỉ chọn một lần");
  }
  if (new Set(input.reviewerIds).size !== input.reviewerIds.length) {
    throw new AppError(400, "Người giám sát bị trùng");
  }
}

function memberRows(
  taskId: number,
  input: SaveProjectTaskInput,
): TaskMemberWrite[] {
  return [
    ...input.assignees.map((assignee) => ({
      taskId,
      userId: assignee.userId,
      taskRole: TemplateTaskRole.ASSIGNEE,
      projectRoleId: assignee.projectRoleId,
    })),
    {
      taskId,
      userId: input.reporterId,
      taskRole: TemplateTaskRole.REPORTER,
      projectRoleId: null,
    },
    ...input.reviewerIds.map((userId) => ({
      taskId,
      userId,
      taskRole: TemplateTaskRole.REVIEWER,
      projectRoleId: null,
    })),
  ];
}

// Check xem user được xem proj hay k
async function assertCanView(projectId: number, userId: number) {
  await projectRepository.findVisibleProject(projectId, userId);
}

async function assertMember(projectId: number, userId: number) {
  const member = await projectTaskRepository.isProjectMember(projectId, userId);
  if (!member) {
    throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
  }
}

/**
 * Người tạo task được sửa và xóa.
 * Người phụ trách và người giám sát chỉ được chuyển trạng thái.
 */
async function taskAccess(
  projectId: number,
  userId: number,
  task: {
    createdById: number;
    members: Array<{ userId: number; taskRole: string }>;
  },
) {
  const membership = await projectTaskRepository.isProjectMember(
    projectId,
    userId,
  );
  if (!membership) {
    return { canEdit: false, canChangeStatus: false };
  }
  const canEdit = task.createdById === userId;
  const canChangeStatus =
    canEdit ||
    task.members.some(
      (member) =>
        member.userId === userId &&
        (member.taskRole === TemplateTaskRole.ASSIGNEE ||
          member.taskRole === TemplateTaskRole.REVIEWER),
    );
  return { canEdit, canChangeStatus };
}

/**
 * Tìm trạng thái bắt đầu nếu không có trạng thái được chọn
 */
async function resolveStatusId(
  tx: Prisma.TransactionClient,
  workflowId: number,
  statusId: number | null | undefined,
) {
  if (statusId == null) {
    const initial = await projectTaskRepository.findInitialStatus(
      tx,
      workflowId,
    );
    if (!initial) {
      throw new AppError(400, "Quy trình chưa có trạng thái bắt đầu");
    }
    return initial;
  }

  const status = await projectTaskRepository.findWorkflowStatus(
    tx,
    workflowId,
    statusId,
  );
  if (!status) {
    throw new AppError(400, "Trạng thái không hợp lệ");
  }
  return status;
}

/**
 * Kiểm tra xem quyền phụ trách, người được chọn có hợp lệ hay k
 */
async function assertAssigneesAndUsers(
  tx: Prisma.TransactionClient,
  projectId: number,
  input: SaveProjectTaskInput,
) {
  const roleIds = input.assignees.map((assignee) => assignee.projectRoleId);
  const roles = await projectTaskRepository.findProjectRolesByIds(
    tx,
    projectId,
    roleIds,
  );
  if (roles.length !== roleIds.length) {
    throw new AppError(400, "Quyền phụ trách không hợp lệ");
  }

  const userIds = [
    ...new Set([
      ...input.assignees.map((assignee) => assignee.userId),
      input.reporterId,
      ...input.reviewerIds,
    ]),
  ];
  const members = await projectTaskRepository.findMemberUserIds(
    tx,
    projectId,
    userIds,
  );
  const memberIds = new Set(members.map((member) => member.userId));
  if (userIds.some((userId) => !memberIds.has(userId))) {
    throw new AppError(400, "Người được chọn không thuộc dự án");
  }
}

/**
 * Kiểm tra xem công việc cha có hợp lệ hay k
 * - Công việc cha không được tự thân tạo thành vòng lặp
 * - Công việc cha phải thuộc dự án
 * - Công việc cha phải là công việc cha của công việc hiện tại
 */
async function assertParentTask(
  tx: Prisma.TransactionClient,
  projectId: number,
  parentTaskId: number | null,
  taskId?: number,
) {
  if (parentTaskId == null) return;
  if (taskId != null && parentTaskId === taskId) {
    throw new AppError(400, "Công việc cha tạo thành vòng lặp");
  }

  const parent = await projectTaskRepository.findTaskParent(
    tx,
    projectId,
    parentTaskId,
  );
  if (!parent) {
    throw new AppError(400, "Công việc cha không hợp lệ");
  }
  if (taskId == null) return;

  const seen = new Set<number>([parent.id]);
  let currentParentId = parent.parentTaskId;
  while (currentParentId != null) {
    if (currentParentId === taskId || seen.has(currentParentId)) {
      throw new AppError(400, "Công việc cha tạo thành vòng lặp");
    }
    seen.add(currentParentId);
    const ancestor = await projectTaskRepository.findTaskParent(
      tx,
      projectId,
      currentParentId,
    );
    currentParentId = ancestor?.parentTaskId ?? null;
  }
}

/**
 * Kiểm tra xem quy trình, loại công việc, trạng thái có hợp lệ hay k
 */
async function resolveTaskWrite(
  tx: Prisma.TransactionClient,
  projectId: number,
  input: SaveProjectTaskInput,
  taskId?: number,
) {
  const workflow = await projectTaskRepository.findActiveWorkflow(
    tx,
    projectId,
    input.workflowId,
  );
  if (!workflow) {
    throw new AppError(400, "Quy trình không hợp lệ");
  }

  const taskType = await projectTaskRepository.findAssignableTaskType(
    tx,
    projectId,
    input.taskTypeId,
  );
  if (!taskType || !taskTypeBelongsToWorkflow(taskType.workflowId, workflow)) {
    throw new AppError(400, "Loại công việc không hợp lệ");
  }

  const status = await resolveStatusId(tx, input.workflowId, input.statusId);
  await assertAssigneesAndUsers(tx, projectId, input);
  await assertParentTask(tx, projectId, input.parentTaskId, taskId);
  if (input.phaseId != null) {
    const phase = await tx.projectPhase.findFirst({
      where: { id: input.phaseId, projectId },
      select: { id: true },
    });
    if (!phase) {
      throw new AppError(400, "Giai đoạn không hợp lệ");
    }
  }

  return { statusId: status.id, statusCategory: status.category };
}

function listFilter(projectId: number, query: ProjectTaskListQuery) {
  return {
    projectId,
    keyword: query.keyword || undefined,
    match: query.match,
    workflowId: query.workflowId,
    taskTypeId: query.taskTypeId,
    statusIds: [
      ...new Set([
        ...(query.statusIds ?? []),
        ...(query.statusId != null ? [query.statusId] : []),
      ]),
    ],
    assigneeId: query.assigneeId,
    reporterId: query.reporterId,
    reviewerId: query.reviewerId,
    date: query.date,
  };
}

/**
 * Check xem date, statusIds, taskType có hợp lệ hay k
 */
async function assertListFilters(
  projectId: number,
  query: ProjectTaskListQuery,
) {
  if (query.date && !isCalendarDate(query.date)) {
    throw new AppError(400, "Ngày không hợp lệ");
  }
  const statusIds = [
    ...new Set([
      ...(query.statusIds ?? []),
      ...(query.statusId != null ? [query.statusId] : []),
    ]),
  ];
  if (statusIds.length > 0 && !query.workflowId) {
    throw new AppError(400, "Chọn quy trình trước khi lọc theo trạng thái");
  }
  let selectedWorkflow: { id: number; isDefault: boolean } | null = null;
  if (query.workflowId) {
    const workflow = await projectTaskRepository.findWorkflowInProject(
      projectId,
      query.workflowId,
    );
    if (!workflow) {
      throw new AppError(400, "Quy trình không hợp lệ");
    }
    selectedWorkflow = workflow;
  }
  if (statusIds.length > 0 && query.workflowId) {
    const statuses = await Promise.all(
      statusIds.map((statusId) =>
        projectTaskRepository.findStatusInWorkflow(query.workflowId!, statusId),
      ),
    );
    if (statuses.some((status) => !status)) {
      throw new AppError(400, "Trạng thái không hợp lệ");
    }
  }
  if (query.taskTypeId) {
    const taskType = await projectTaskRepository.findTaskTypeInProject(
      projectId,
      query.taskTypeId,
    );
    if (!taskType) {
      throw new AppError(400, "Loại công việc không hợp lệ");
    }
    if (
      selectedWorkflow &&
      !taskTypeBelongsToWorkflow(taskType.workflowId, selectedWorkflow)
    ) {
      throw new AppError(400, "Loại công việc không hợp lệ");
    }
  }
}

async function loadDetail(projectId: number, taskId: number, userId: number) {
  const task = await projectTaskRepository.findProjectTaskDetail(
    projectId,
    taskId,
  );
  if (!task) {
    throw new AppError(404, "Không tìm thấy công việc");
  }
  const [access, avatarUrls] = await Promise.all([
    taskAccess(projectId, userId, task),
    avatarUrlMap(task.members.map((member) => member.user.profile?.avatarKey)),
  ]);
  const detail = mapProjectTaskDetail(task, avatarUrls, access);
  detail.description = await presentDescription(detail.description);
  return detail;
}

export async function getProjectTasks(
  projectId: number,
  userId: number,
  query: ProjectTaskListQuery,
) {
  await assertCanView(projectId, userId);
  await assertListFilters(projectId, query);

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const filter = listFilter(projectId, query);
  const listWhere = projectTaskRepository.buildTaskWhere(filter, true);
  const summaryWhere = projectTaskRepository.buildTaskWhere(filter, false);

  const [tasks, total, summary, membership] = await Promise.all([
    projectTaskRepository.listProjectTasks(
      listWhere,
      (page - 1) * limit,
      limit,
    ),
    projectTaskRepository.countProjectTasks(listWhere),
    query.workflowId
      ? statusSummary(query.workflowId, summaryWhere)
      : workflowSummary(projectId, summaryWhere),
    projectTaskRepository.isProjectMember(projectId, userId),
  ]);

  const avatarUrls = await avatarUrlMap(
    tasks.flatMap((task) =>
      task.members.map((member) => member.user.profile?.avatarKey),
    ),
  );

  return {
    tasks: tasks.map((task) => ({
      ...mapProjectTaskListItem(task, avatarUrls),
      canEdit: Boolean(membership) && task.createdById === userId,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
    summary,
  };
}

/**
 * Trả về list workflows và số lượng công việc theo workflow
 */
async function workflowSummary(
  projectId: number,
  where: Prisma.TaskWhereInput,
) {
  const [workflows, grouped] = await Promise.all([
    projectTaskRepository.listWorkflowNames(projectId),
    projectTaskRepository.groupTaskCountsByWorkflow(where),
  ]);
  const counts = new Map(
    grouped.map((row) => [row.workflowId, row._count._all]),
  );
  return {
    mode: "workflow" as const,
    workflows: workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      count: counts.get(workflow.id) ?? 0,
    })),
  };
}

/**
 Trả về list statuses và số lượng công việc theo status
 */
async function statusSummary(
  workflowId: number,
  where: Prisma.TaskWhereInput,
) {
  const [statuses, grouped] = await Promise.all([
    projectTaskRepository.listStatusSummaries(workflowId),
    projectTaskRepository.groupTaskCountsByStatus(where),
  ]);
  const counts = new Map(grouped.map((row) => [row.statusId, row._count._all]));
  return {
    mode: "status" as const,
    statuses: statuses.map((status) => ({
      id: status.id,
      name: status.name,
      key: status.key,
      color: status.color,
      sortOrder: status.sortOrder,
      count: counts.get(status.id) ?? 0,
    })),
  };
}

/**
 * Tạo child task
 * - Tạo child tasks
 * - Update quyền phụ trách của child tasks
 */
async function writeChildren(
  tx: Prisma.TransactionClient,
  projectId: number,
  parentTaskId: number,
  userId: number,
  input: SaveProjectTaskInput,
  statusId: number,
  childCodes: string[],
  completedAt: Date | null,
) {
  if (input.children.length === 0) return;

  await projectTaskRepository.createProjectTasks(
    tx,
    input.children.map((child, index) => ({
      projectId,
      code: childCodes[index],
      title: child.title,
      description: null,
      workflowId: input.workflowId,
      taskTypeId: input.taskTypeId,
      statusId,
      priority: input.priority as ProjectPriority,
      startDate: null,
      dueDate: null,
      estimatedMinutes: child.estimatedMinutes,
      parentTaskId,
      phaseId: input.phaseId ?? null,
      createdById: userId,
      completedAt,
    })),
  );

  const children = await projectTaskRepository.findTaskIdsByCodes(
    tx,
    projectId,
    childCodes,
  );
  await projectTaskRepository.createTaskMembers(
    tx,
    children.map((child) => ({
      taskId: child.id,
      userId: input.reporterId,
      taskRole: TemplateTaskRole.REPORTER,
      projectRoleId: null,
    })),
  );
}

export async function createProjectTask(
  projectId: number,
  userId: number,
  input: SaveProjectTaskInput,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  assertDates(input.startDate, input.dueDate);
  assertPeopleShape(input);

  let taskId: number;
  try {
    taskId = await prisma.$transaction(
      async (tx) => {
        const { statusId, statusCategory } = await resolveTaskWrite(
          tx,
          projectId,
          input,
        );
        const completedAt =
          statusCategory === WorkflowStatusCategory.DONE ? new Date() : null;
        const description = await storedDescription(
          tx,
          userId,
          null,
          input.description,
        );
        const codes = await projectTaskRepository.allocateTaskCodes(
          tx,
          projectId,
          1 + input.children.length,
        );
        const task = await projectTaskRepository.createProjectTask(tx, {
          projectId,
          code: codes[0],
          title: input.title,
          description: description.html,
          workflowId: input.workflowId,
          taskTypeId: input.taskTypeId,
          statusId,
          priority: input.priority as ProjectPriority,
          startDate: toDate(input.startDate),
          dueDate: toDate(input.dueDate),
          estimatedMinutes: input.estimatedMinutes,
          parentTaskId: input.parentTaskId,
          phaseId: input.phaseId ?? null,
          createdById: userId,
          completedAt,
        });
        await projectTaskRepository.claimTaskAttachments(
          tx,
          task.id,
          userId,
          "DESCRIPTION",
          description.imageIds,
        );
        await projectTaskRepository.claimTaskAttachments(
          tx,
          task.id,
          userId,
          "FILE",
          [...new Set(input.attachmentIds ?? [])],
        );
        await projectTaskRepository.createTaskMembers(
          tx,
          memberRows(task.id, input),
        );
        await writeChildren(
          tx,
          projectId,
          task.id,
          userId,
          input,
          statusId,
          codes.slice(1),
          completedAt,
        );
        return task.id;
      },
      { timeout: 15000 },
    );
  } catch (error) {
    attachmentFailure(error);
  }

  return loadDetail(projectId, taskId, userId);
}

export async function getProjectTask(
  projectId: number,
  taskId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  return loadDetail(projectId, taskId, userId);
}

export async function updateProjectTask(
  projectId: number,
  taskId: number,
  userId: number,
  input: SaveProjectTaskInput,
) {
  await assertCanView(projectId, userId);
  const current = await projectTaskRepository.findProjectTaskDetail(
    projectId,
    taskId,
  );
  if (!current) {
    throw new AppError(404, "Không tìm thấy công việc");
  }
  if (!(await taskAccess(projectId, userId, current)).canEdit) {
    throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
  }

  assertDates(input.startDate, input.dueDate);
  assertPeopleShape(input);

  try {
    await prisma.$transaction(
      async (tx) => {
        const { statusId, statusCategory } = await resolveTaskWrite(
          tx,
          projectId,
          input,
          taskId,
        );
        if (input.workflowId === current.workflowId) {
          assertStatusMove(current.workflow, current.statusId, statusId);
        }
        const completedAt = resolveCompletedAt(
          statusCategory,
          current.status.category,
          current.completedAt,
        );
        const description = await storedDescription(
          tx,
          userId,
          taskId,
          input.description,
        );
        await projectTaskRepository.updateProjectTask(tx, taskId, {
          title: input.title,
          description: description.html,
          workflowId: input.workflowId,
          taskTypeId: input.taskTypeId,
          statusId,
          priority: input.priority as ProjectPriority,
          startDate: toDate(input.startDate),
          dueDate: toDate(input.dueDate),
          estimatedMinutes: input.estimatedMinutes,
          parentTaskId: input.parentTaskId,
          ...(input.phaseId !== undefined ? { phaseId: input.phaseId } : {}),
          updatedById: userId,
          completedAt,
        });
        await projectTaskRepository.claimTaskAttachments(
          tx,
          taskId,
          userId,
          "DESCRIPTION",
          description.imageIds,
        );
        if (input.attachmentIds) {
          await projectTaskRepository.claimTaskAttachments(
            tx,
            taskId,
            userId,
            "FILE",
            [...new Set(input.attachmentIds)],
          );
        }
        await projectTaskRepository.replaceTaskMembers(
          tx,
          taskId,
          memberRows(taskId, input),
        );
      if (input.children.length > 0) {
        const codes = await projectTaskRepository.allocateTaskCodes(
          tx,
          projectId,
          input.children.length,
        );
        await writeChildren(
          tx,
          projectId,
          taskId,
          userId,
          input,
          statusId,
          codes,
          statusCategory === WorkflowStatusCategory.DONE ? new Date() : null,
        );
      }
    },
    { timeout: 15000 },
  );
  } catch (error) {
    attachmentFailure(error);
  }

  return loadDetail(projectId, taskId, userId);
}

function assertStatusMove(
  workflow: {
    transitionMode: WorkflowTransitionMode;
    transitions: { fromStatusId: number; toStatusId: number }[];
  },
  fromStatusId: number,
  toStatusId: number,
) {
  if (
    fromStatusId === toStatusId ||
    workflow.transitionMode === WorkflowTransitionMode.FREE
  ) {
    return;
  }

  const allowed = workflow.transitions.some(
    (transition) =>
      transition.fromStatusId === fromStatusId &&
      transition.toStatusId === toStatusId,
  );
  if (!allowed) {
    throw new AppError(400, "Không có chuyển trạng thái cho bước này");
  }
}

export async function updateProjectTaskStatus(
  projectId: number,
  taskId: number,
  userId: number,
  input: UpdateProjectTaskStatusInput,
) {
  await assertCanView(projectId, userId);
  const current = await projectTaskRepository.findProjectTaskDetail(
    projectId,
    taskId,
  );
  if (!current) {
    throw new AppError(404, "Không tìm thấy công việc");
  }
  if (!(await taskAccess(projectId, userId, current)).canChangeStatus) {
    throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
  }
  if (current.statusId === input.statusId) {
    return loadDetail(projectId, taskId, userId);
  }

  const status = await projectTaskRepository.findStatusInWorkflow(
    current.workflowId,
    input.statusId,
  );
  if (!status) {
    throw new AppError(400, "Trạng thái không hợp lệ");
  }

  assertStatusMove(current.workflow, current.statusId, input.statusId);

  await projectTaskRepository.updateProjectTaskStatus(
    taskId,
    input.statusId,
    userId,
    resolveCompletedAt(
      status.category,
      current.status.category,
      current.completedAt,
    ),
  );
  return loadDetail(projectId, taskId, userId);
}

export async function deleteProjectTask(
  projectId: number,
  taskId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  const current = await projectTaskRepository.findProjectTaskDetail(
    projectId,
    taskId,
  );
  if (!current) {
    throw new AppError(404, "Không tìm thấy công việc");
  }
  if (!(await taskAccess(projectId, userId, current)).canEdit) {
    throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const childCount = await projectTaskRepository.countChildTasks(
        tx,
        projectId,
        taskId,
      );
      if (childCount > 0) {
        throw new AppError(400, TASK_IN_USE_BY_PARENT);
      }
      await projectTaskRepository.deleteProjectTask(tx, taskId);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (isForeignKeyError(error)) {
      throw new AppError(400, TASK_IN_USE_BY_PARENT);
    }
    throw error;
  }

  return { id: taskId };
}

async function assertTaskInProject(projectId: number, taskId: number) {
  const task = await projectTaskRepository.findProjectTaskDetail(
    projectId,
    taskId,
  );
  if (!task) {
    throw new AppError(404, "Không tìm thấy công việc");
  }
}

export async function listTaskComments(
  projectId: number,
  taskId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  await assertTaskInProject(projectId, taskId);
  const comments = await projectTaskRepository.listTaskComments(taskId);
  const [avatarUrls, fileUrls] = await Promise.all([
    avatarUrlMap(comments.map((comment) => comment.user.profile?.avatarKey)),
    avatarUrlMap(
      comments.flatMap((comment) =>
        comment.attachments.map((file) => file.fileKey),
      ),
    ),
  ]);
  return comments.map((comment) => mapTaskComment(comment, avatarUrls, fileUrls));
}

export async function listTaskAttachments(
  projectId: number,
  taskId: number,
  userId: number,
) {
  await assertCanView(projectId, userId);
  await assertTaskInProject(projectId, taskId);
  const rows = await projectTaskRepository.listTaskAttachments(taskId);
  const urls = await avatarUrlMap(rows.map((row) => row.fileKey));
  const images = [];
  const files = [];
  for (const row of rows) {
    const item = mapStoredFile(row, urls);
    if (row.source === "DESCRIPTION") images.push(item);
    else files.push(item);
  }
  return { images, files };
}

export async function createTaskComment(
  projectId: number,
  taskId: number,
  userId: number,
  input: CreateProjectTaskCommentInput,
) {
  await assertCanView(projectId, userId);
  await assertMember(projectId, userId);
  await assertTaskInProject(projectId, taskId);
  let comment;
  try {
    comment = await projectTaskRepository.createTaskComment(
      taskId,
      userId,
      input.content,
      [...new Set(input.attachmentIds)],
    );
  } catch (error) {
    attachmentFailure(error);
  }
  const [avatarUrls, fileUrls] = await Promise.all([
    avatarUrlMap([comment.user.profile?.avatarKey]),
    avatarUrlMap(comment.attachments.map((file) => file.fileKey)),
  ]);
  return mapTaskComment(comment, avatarUrls, fileUrls);
}
