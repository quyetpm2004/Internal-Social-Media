import {
  Prisma,
  ProjectPriority,
  TemplateTaskRole,
  WorkflowStatusCategory,
} from "@prisma/client";
import * as memberRepository from "@/modules/department/department-member.repository";
import {
  mapDepartmentTaskConfig,
  mapDepartmentTaskDetail,
  mapDepartmentTaskListItem,
} from "@/modules/department/department-task.mapper";
import * as taskRepository from "@/modules/department/department-task.repository";
import type { CreateProjectTaskCommentInput } from "@/modules/project/project.schema";
import type {
  SaveDepartmentTaskConfigInput,
  SaveDepartmentTaskInput,
  UpdateDepartmentTaskStatusInput,
} from "@/modules/department/department-task.schema";
import * as projectTaskRepository from "@/modules/project/project-task.repository";
import type { TaskMemberWrite } from "@/modules/project/project-task.repository";
import {
  assertDates,
  attachmentFailure,
  avatarUrlMap,
  isForeignKeyError,
  mapStoredFile,
  mapTaskComment,
  presentDescription,
  resolveCompletedAt,
  storedDescription,
  toDate,
} from "@/modules/project/task-common";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";

const TASK_IN_USE_BY_PARENT = "Hãy xóa hoặc chuyển các việc con trước";
const STATUS_IN_USE = "Trạng thái đang có công việc, không thể xóa";
const STATUS_NAME_TAKEN = "Tên trạng thái bị trùng";
const MAX_STATUS_KEY_LENGTH = 40;

function isUniqueError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function requireDepartment(managerId: number) {
  const department = await memberRepository.findManagedDepartment(managerId);
  if (!department) {
    throw new AppError(404, "Bạn chưa quản lý phòng ban nào");
  }
  return department;
}

async function ensureWorkflow(departmentId: number) {
  const existing = await taskRepository.findWorkflowByDepartment(departmentId);
  if (existing) return existing;
  try {
    return await taskRepository.createDefaultWorkflow(departmentId);
  } catch (error) {
    if (!isUniqueError(error)) throw error;
    const created = await taskRepository.findWorkflowByDepartment(departmentId);
    if (created) return created;
    throw error;
  }
}

async function resolveStatus(
  tx: Prisma.TransactionClient,
  workflowId: number,
  statusId: number | null | undefined,
) {
  if (statusId == null) {
    const initial = await taskRepository.findInitialStatus(tx, workflowId);
    if (!initial) {
      throw new AppError(400, "Quy trình chưa có trạng thái bắt đầu");
    }
    return initial;
  }
  const status = await taskRepository.findWorkflowStatus(
    tx,
    workflowId,
    statusId,
  );
  if (!status) throw new AppError(400, "Trạng thái không hợp lệ");
  return status;
}

async function assertAssignee(
  tx: Prisma.TransactionClient,
  departmentId: number,
  assigneeId: number | null,
) {
  if (assigneeId == null) return;
  const users = await taskRepository.findDepartmentUserIds(tx, departmentId, [
    assigneeId,
  ]);
  if (users.length !== 1) {
    throw new AppError(400, "Người thực hiện không thuộc phòng ban");
  }
}

async function assertParentTask(
  tx: Prisma.TransactionClient,
  departmentId: number,
  parentTaskId: number | null,
  taskId?: number,
) {
  if (parentTaskId == null) return;
  if (taskId != null && parentTaskId === taskId) {
    throw new AppError(400, "Công việc cha tạo thành vòng lặp");
  }

  const parent = await taskRepository.findTaskParent(
    tx,
    departmentId,
    parentTaskId,
  );
  if (!parent) throw new AppError(400, "Công việc cha không hợp lệ");
  if (taskId == null) return;

  const seen = new Set<number>([parent.id]);
  let currentParentId = parent.parentTaskId;
  while (currentParentId != null) {
    if (currentParentId === taskId || seen.has(currentParentId)) {
      throw new AppError(400, "Công việc cha tạo thành vòng lặp");
    }
    seen.add(currentParentId);
    const ancestor = await taskRepository.findTaskParent(
      tx,
      departmentId,
      currentParentId,
    );
    currentParentId = ancestor?.parentTaskId ?? null;
  }
}

function memberRows(
  taskId: number,
  assigneeId: number | null,
  reporterId: number,
): TaskMemberWrite[] {
  return [
    ...(assigneeId != null
      ? [
          {
            taskId,
            userId: assigneeId,
            taskRole: TemplateTaskRole.ASSIGNEE,
            projectRoleId: null,
          },
        ]
      : []),
    {
      taskId,
      userId: reporterId,
      taskRole: TemplateTaskRole.REPORTER,
      projectRoleId: null,
    },
  ];
}

async function writeChildren(
  tx: Prisma.TransactionClient,
  departmentId: number,
  workflowId: number,
  parentTaskId: number,
  userId: number,
  input: SaveDepartmentTaskInput,
  statusId: number,
  childCodes: string[],
  completedAt: Date | null,
) {
  if (input.children.length === 0) return;

  await taskRepository.createDepartmentTasks(
    tx,
    input.children.map((child, index) => ({
      departmentId,
      code: childCodes[index],
      title: child.title,
      description: null,
      workflowId,
      statusId,
      priority: input.priority as ProjectPriority,
      startDate: null,
      dueDate: null,
      estimatedMinutes: child.estimatedMinutes,
      parentTaskId,
      createdById: userId,
      completedAt,
    })),
  );

  const children = await taskRepository.findTaskIdsByCodes(
    tx,
    departmentId,
    childCodes,
  );
  await projectTaskRepository.createTaskMembers(
    tx,
    children.map((child) => ({
      taskId: child.id,
      userId,
      taskRole: TemplateTaskRole.REPORTER,
      projectRoleId: null,
    })),
  );
}

async function loadDetail(departmentId: number, taskId: number) {
  const task = await taskRepository.findDepartmentTaskDetail(
    departmentId,
    taskId,
  );
  if (!task) throw new AppError(404, "Không tìm thấy công việc");

  const rows = await projectTaskRepository.listTaskAttachments(taskId);
  const [fileUrls, avatarUrls] = await Promise.all([
    avatarUrlMap(rows.map((row) => row.fileKey)),
    avatarUrlMap(task.members.map((member) => member.user.profile?.avatarKey)),
  ]);
  const attachments = rows
    .filter((row) => row.source === "FILE")
    .map((row) => mapStoredFile(row, fileUrls));

  const detail = mapDepartmentTaskDetail(task, avatarUrls);
  return {
    ...detail,
    description: await presentDescription(detail.description),
    attachments,
    canEdit: true,
    canChangeStatus: true,
  };
}

export async function listTasks(managerId: number) {
  const department = await requireDepartment(managerId);
  const [tasks, members] = await Promise.all([
    taskRepository.listDepartmentTasks(department.id),
    memberRepository.findMembers(department.id),
  ]);
  return {
    tasks: tasks.map(mapDepartmentTaskListItem),
    members: members.map((member) => ({
      id: member.id,
      name: member.fullName,
    })),
  };
}

export async function getTask(managerId: number, taskId: number) {
  const department = await requireDepartment(managerId);
  return loadDetail(department.id, taskId);
}

export async function createTask(
  managerId: number,
  input: SaveDepartmentTaskInput,
) {
  const department = await requireDepartment(managerId);
  assertDates(input.startDate, input.dueDate);
  const workflow = await ensureWorkflow(department.id);

  let taskId: number;
  try {
    taskId = await prisma.$transaction(
      async (tx) => {
        const status = await resolveStatus(tx, workflow.id, input.statusId);
        await assertAssignee(tx, department.id, input.assigneeId);
        await assertParentTask(tx, department.id, input.parentTaskId);

        const completedAt =
          status.category === WorkflowStatusCategory.DONE ? new Date() : null;
        const description = await storedDescription(
          tx,
          managerId,
          null,
          input.description,
        );
        const codes = await taskRepository.allocateTaskCodes(
          tx,
          department.id,
          1 + input.children.length,
        );
        const task = await taskRepository.createDepartmentTask(tx, {
          departmentId: department.id,
          code: codes[0],
          title: input.title,
          description: description.html,
          workflowId: workflow.id,
          statusId: status.id,
          priority: input.priority as ProjectPriority,
          startDate: toDate(input.startDate),
          dueDate: toDate(input.dueDate),
          estimatedMinutes: input.estimatedMinutes,
          parentTaskId: input.parentTaskId,
          createdById: managerId,
          completedAt,
        });
        await projectTaskRepository.claimTaskAttachments(
          tx,
          task.id,
          managerId,
          "DESCRIPTION",
          description.imageIds,
        );
        await projectTaskRepository.claimTaskAttachments(
          tx,
          task.id,
          managerId,
          "FILE",
          [...new Set(input.attachmentIds ?? [])],
        );
        await projectTaskRepository.createTaskMembers(
          tx,
          memberRows(task.id, input.assigneeId, managerId),
        );
        await writeChildren(
          tx,
          department.id,
          workflow.id,
          task.id,
          managerId,
          input,
          status.id,
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

  return loadDetail(department.id, taskId);
}

export async function updateTask(
  managerId: number,
  taskId: number,
  input: SaveDepartmentTaskInput,
) {
  const department = await requireDepartment(managerId);
  const current = await taskRepository.findDepartmentTaskDetail(
    department.id,
    taskId,
  );
  if (!current) throw new AppError(404, "Không tìm thấy công việc");
  assertDates(input.startDate, input.dueDate);
  const workflow = await ensureWorkflow(department.id);
  const reporterId =
    current.members.find((member) => member.taskRole === TemplateTaskRole.REPORTER)
      ?.user.id ?? managerId;

  try {
    await prisma.$transaction(
      async (tx) => {
        const status = await resolveStatus(
          tx,
          workflow.id,
          input.statusId ?? current.statusId,
        );
        await assertAssignee(tx, department.id, input.assigneeId);
        await assertParentTask(tx, department.id, input.parentTaskId, taskId);

        const completedAt = resolveCompletedAt(
          status.category,
          current.status.category,
          current.completedAt,
        );
        const description = await storedDescription(
          tx,
          managerId,
          taskId,
          input.description,
        );
        await taskRepository.updateDepartmentTask(tx, taskId, {
          title: input.title,
          description: description.html,
          statusId: status.id,
          priority: input.priority as ProjectPriority,
          startDate: toDate(input.startDate),
          dueDate: toDate(input.dueDate),
          estimatedMinutes: input.estimatedMinutes,
          parentTaskId: input.parentTaskId,
          updatedById: managerId,
          completedAt,
        });
        await projectTaskRepository.claimTaskAttachments(
          tx,
          taskId,
          managerId,
          "DESCRIPTION",
          description.imageIds,
        );
        if (input.attachmentIds) {
          await projectTaskRepository.claimTaskAttachments(
            tx,
            taskId,
            managerId,
            "FILE",
            [...new Set(input.attachmentIds)],
          );
        }
        await projectTaskRepository.replaceTaskMembers(
          tx,
          taskId,
          memberRows(taskId, input.assigneeId, reporterId),
        );
        if (input.children.length > 0) {
          const codes = await taskRepository.allocateTaskCodes(
            tx,
            department.id,
            input.children.length,
          );
          await writeChildren(
            tx,
            department.id,
            workflow.id,
            taskId,
            managerId,
            input,
            status.id,
            codes,
            status.category === WorkflowStatusCategory.DONE ? new Date() : null,
          );
        }
      },
      { timeout: 15000 },
    );
  } catch (error) {
    attachmentFailure(error);
  }

  return loadDetail(department.id, taskId);
}

export async function updateTaskStatus(
  managerId: number,
  taskId: number,
  input: UpdateDepartmentTaskStatusInput,
) {
  const department = await requireDepartment(managerId);
  const current = await taskRepository.findDepartmentTaskDetail(
    department.id,
    taskId,
  );
  if (!current) throw new AppError(404, "Không tìm thấy công việc");
  if (current.statusId === input.statusId) {
    return loadDetail(department.id, taskId);
  }

  const workflow = await ensureWorkflow(department.id);
  const status = await taskRepository.findStatusInWorkflow(
    workflow.id,
    input.statusId,
  );
  if (!status) throw new AppError(400, "Trạng thái không hợp lệ");

  await taskRepository.updateTaskStatus(
    taskId,
    status.id,
    managerId,
    resolveCompletedAt(
      status.category,
      current.status.category,
      current.completedAt,
    ),
  );
  return loadDetail(department.id, taskId);
}

export async function deleteTask(managerId: number, taskId: number) {
  const department = await requireDepartment(managerId);
  const current = await taskRepository.findDepartmentTaskDetail(
    department.id,
    taskId,
  );
  if (!current) throw new AppError(404, "Không tìm thấy công việc");

  try {
    await prisma.$transaction(async (tx) => {
      const childCount = await taskRepository.countChildTasks(
        tx,
        department.id,
        taskId,
      );
      if (childCount > 0) throw new AppError(400, TASK_IN_USE_BY_PARENT);
      await taskRepository.deleteDepartmentTask(tx, taskId);
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

function statusKey(name: string, taken: Set<string>) {
  const base =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, MAX_STATUS_KEY_LENGTH) || "status";

  let key = base;
  let suffix = 2;
  while (taken.has(key)) {
    key = `${base}_${suffix}`;
    suffix += 1;
  }
  taken.add(key);
  return key;
}

function assertStatusRules(statuses: SaveDepartmentTaskConfigInput["statuses"]) {
  for (const status of statuses) {
    const category = status.category as WorkflowStatusCategory;
    if (status.isInitial && status.isFinal) {
      throw new AppError(
        400,
        "Trạng thái không thể vừa là bắt đầu vừa là kết thúc",
      );
    }
    if (status.isInitial && category !== WorkflowStatusCategory.TODO) {
      throw new AppError(400, "Trạng thái bắt đầu phải có nhóm Cần làm");
    }
    if (
      status.isFinal &&
      category !== WorkflowStatusCategory.DONE &&
      category !== WorkflowStatusCategory.CANCELLED
    ) {
      throw new AppError(
        400,
        "Trạng thái kết thúc phải có nhóm Hoàn thành hoặc Hủy",
      );
    }
  }

  if (statuses.filter((status) => status.isInitial).length !== 1) {
    throw new AppError(400, "Cần đúng một trạng thái bắt đầu");
  }
  if (!statuses.some((status) => status.category === "DONE")) {
    throw new AppError(400, "Cần ít nhất một trạng thái thuộc nhóm Hoàn thành");
  }

  const names = statuses.map((status) => status.name.toLowerCase());
  if (new Set(names).size !== names.length) {
    throw new AppError(400, STATUS_NAME_TAKEN);
  }
}

async function loadTaskConfig(departmentId: number) {
  const workflow = await ensureWorkflow(departmentId);
  const grouped = await taskRepository.groupTaskCountsByStatus(departmentId);
  const counts = new Map(grouped.map((row) => [row.statusId, row._count._all]));
  return mapDepartmentTaskConfig(workflow, counts);
}

export async function getTaskConfig(managerId: number) {
  const department = await requireDepartment(managerId);
  return loadTaskConfig(department.id);
}

export async function saveTaskConfig(
  managerId: number,
  input: SaveDepartmentTaskConfigInput,
) {
  const department = await requireDepartment(managerId);
  const workflow = await ensureWorkflow(department.id);
  assertStatusRules(input.statuses);

  const existing = new Map(
    workflow.statuses.map((status) => [status.id, status]),
  );
  const keptIds = new Set<number>();
  for (const status of input.statuses) {
    if (status.id == null) continue;
    if (!existing.has(status.id) || keptIds.has(status.id)) {
      throw new AppError(400, "Trạng thái không hợp lệ");
    }
    keptIds.add(status.id);
  }

  const removedIds = workflow.statuses
    .filter((status) => !keptIds.has(status.id))
    .map((status) => status.id);
  if (removedIds.length > 0) {
    const grouped = await taskRepository.groupTaskCountsByStatus(department.id);
    if (grouped.some((row) => removedIds.includes(row.statusId))) {
      throw new AppError(400, STATUS_IN_USE);
    }
  }

  const takenKeys = new Set(workflow.statuses.map((status) => status.key));

  try {
    await prisma.$transaction(async (tx) => {
      await taskRepository.updateWorkflow(
        tx,
        workflow.id,
        input.name,
        input.description || null,
      );
      if (removedIds.length > 0) {
        await taskRepository.deleteStatuses(tx, workflow.id, removedIds);
      }

      for (const [index, status] of input.statuses.entries()) {
        const data = {
          name: status.name,
          category: status.category as WorkflowStatusCategory,
          color: status.color,
          isInitial: status.isInitial,
          isFinal: status.isFinal,
          sortOrder: index,
        };

        if (status.id == null) {
          await taskRepository.createStatus(
            tx,
            workflow.id,
            statusKey(status.name, takenKeys),
            data,
          );
          continue;
        }

        const before = existing.get(status.id)!;
        await taskRepository.updateStatus(tx, status.id, data);
        const wasDone = before.category === WorkflowStatusCategory.DONE;
        const isDone = data.category === WorkflowStatusCategory.DONE;
        if (wasDone !== isDone) {
          await taskRepository.syncCompletedAtForStatus(tx, status.id, isDone);
        }
      }
    });
  } catch (error) {
    if (isUniqueError(error)) throw new AppError(409, STATUS_NAME_TAKEN);
    throw error;
  }

  return loadTaskConfig(department.id);
}

async function assertTaskInDepartment(managerId: number, taskId: number) {
  const department = await requireDepartment(managerId);
  const task = await taskRepository.findDepartmentTaskDetail(
    department.id,
    taskId,
  );
  if (!task) throw new AppError(404, "Không tìm thấy công việc");
}

export async function listTaskComments(managerId: number, taskId: number) {
  await assertTaskInDepartment(managerId, taskId);
  const comments = await projectTaskRepository.listTaskComments(taskId);
  const [avatarUrls, fileUrls] = await Promise.all([
    avatarUrlMap(comments.map((comment) => comment.user.profile?.avatarKey)),
    avatarUrlMap(
      comments.flatMap((comment) =>
        comment.attachments.map((file) => file.fileKey),
      ),
    ),
  ]);
  return comments.map((comment) =>
    mapTaskComment(comment, avatarUrls, fileUrls),
  );
}

export async function listTaskAttachments(managerId: number, taskId: number) {
  await assertTaskInDepartment(managerId, taskId);
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
  managerId: number,
  taskId: number,
  input: CreateProjectTaskCommentInput,
) {
  await assertTaskInDepartment(managerId, taskId);
  let comment;
  try {
    comment = await projectTaskRepository.createTaskComment(
      taskId,
      managerId,
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
