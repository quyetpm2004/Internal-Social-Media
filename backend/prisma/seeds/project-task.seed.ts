import {
  Prisma,
  PrismaClient,
  ProjectPriority,
  TemplateTaskRole,
  WorkflowStatusCategory,
} from "@prisma/client";

const SEED_MARKER = "seed-task-v1";

type StatusRow = {
  id: number;
  name: string;
  sortOrder: number;
  category: WorkflowStatusCategory;
  isInitial: boolean;
};

type WorkflowRow = {
  id: number;
  name: string;
  isDefault: boolean;
  statuses: StatusRow[];
};

type TaskTypeRow = {
  id: number;
  name: string;
  workflowId: number | null;
  isActive: boolean;
};

type ChildSeed = {
  title: string;
  priority: ProjectPriority;
  statusIndex: number;
  estimate: number;
};

type TaskSeed = {
  title: string;
  priority: ProjectPriority;
  statusIndex: number;
  startOffset: number | null;
  dueOffset: number | null;
  createdToday?: boolean;
  estimate: number;
  description: string;
  assigneeCount: number;
  children?: ChildSeed[];
};

const primaryTasks: TaskSeed[] = [
  {
    title: "Thiết kế luồng đăng nhập",
    priority: ProjectPriority.HIGH,
    statusIndex: 1,
    startOffset: -7,
    dueOffset: 10,
    estimate: 480,
    description: "Phác thảo các bước đăng nhập và phân quyền cho dự án.",
    assigneeCount: 2,
    children: [
      {
        title: "Viết API đăng nhập",
        priority: ProjectPriority.MEDIUM,
        statusIndex: 0,
        estimate: 240,
      },
      {
        title: "Viết test đăng nhập",
        priority: ProjectPriority.LOW,
        statusIndex: 0,
        estimate: 90,
      },
    ],
  },
  {
    title: "Cập nhật giao diện header",
    priority: ProjectPriority.LOW,
    statusIndex: 0,
    startOffset: -2,
    dueOffset: 0,
    estimate: 120,
    description: "Chỉnh lại header cho khớp bố cục mới.",
    assigneeCount: 1,
  },
  {
    title: "Rà soát phân quyền dự án",
    priority: ProjectPriority.URGENT,
    statusIndex: 2,
    startOffset: 0,
    dueOffset: 1,
    estimate: 60,
    description: "Kiểm tra vai trò được phép tạo và sửa công việc.",
    assigneeCount: 1,
  },
  {
    title: "Viết tài liệu API",
    priority: ProjectPriority.MEDIUM,
    statusIndex: -1,
    startOffset: -14,
    dueOffset: -1,
    createdToday: true,
    estimate: 180,
    description: "Bổ sung mô tả các API công việc.",
    assigneeCount: 1,
  },
];

const extraTasks: TaskSeed[] = [
  {
    title: "Theo dõi lỗi thanh toán",
    priority: ProjectPriority.HIGH,
    statusIndex: 1,
    startOffset: -3,
    dueOffset: 4,
    estimate: 200,
    description: "Ghi nhận lỗi và người phụ trách xử lý.",
    assigneeCount: 1,
  },
  {
    title: "Kiểm tra form tạo việc",
    priority: ProjectPriority.MEDIUM,
    statusIndex: 0,
    startOffset: 0,
    dueOffset: 3,
    estimate: 90,
    description: "Đối chiếu form với quy trình đang chọn.",
    assigneeCount: 2,
  },
  {
    title: "Chuẩn bị kịch bản demo",
    priority: ProjectPriority.LOW,
    statusIndex: -1,
    startOffset: null,
    dueOffset: null,
    estimate: 45,
    description: "Các bước demo danh sách và bộ lọc công việc.",
    assigneeCount: 1,
  },
];

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftKey(key: string, offset: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  const monthText = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayText = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${monthText}-${dayText}`;
}

function dateOnly(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

function createdAtOn(key: string) {
  return new Date(`${key}T09:00:00.000+07:00`);
}

function pickStatus(statuses: StatusRow[], index: number) {
  if (statuses.length === 0) return null;
  const resolved = index < 0 ? statuses.length - 1 : index % statuses.length;
  return statuses[resolved];
}

export async function seedProjectTasks(prisma: PrismaClient) {
  console.log("--- Seeding Project Tasks ---");

  const projects = await prisma.project.findMany({
    include: {
      roles: { orderBy: { sortOrder: "asc" } },
      members: { select: { userId: true } },
      workflows: {
        where: { isActive: true },
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        include: {
          statuses: { orderBy: { sortOrder: "asc" } },
        },
      },
      taskTypes: {
        select: { id: true, name: true, workflowId: true, isActive: true },
      },
    },
    orderBy: { id: "asc" },
  });

  if (projects.length === 0) {
    console.log("⏭️  Chưa có dự án, bỏ qua task seed.");
    return;
  }

  for (const project of projects) {
    const seeded = await prisma.projectTask.findFirst({
      where: { projectId: project.id, description: { contains: SEED_MARKER } },
      select: { id: true },
    });
    if (seeded) {
      console.log(`⏭️  ${project.name} đã có task mẫu.`);
      continue;
    }
    if (project.workflows.length === 0 || project.roles.length === 0) {
      console.log(`⏭️  ${project.name} thiếu quy trình hoặc vai trò.`);
      continue;
    }

    const userIds = [...new Set(project.members.map((member) => member.userId))];
    if (userIds.length === 0) {
      console.log(`⏭️  ${project.name} chưa có thành viên.`);
      continue;
    }

    const created = await prisma.$transaction((tx) =>
      seedProject(tx, {
        projectId: project.id,
        nextTaskNumber: project.nextTaskNumber,
        createdById: userIds[0],
        userIds,
        roles: project.roles.map((role) => role.id),
        workflows: project.workflows,
        taskTypes: project.taskTypes,
      }),
    );
    console.log(`✅ ${project.name}: ${created} task mẫu.`);
  }
}

async function seedProject(
  tx: Prisma.TransactionClient,
  input: {
    projectId: number;
    nextTaskNumber: number;
    createdById: number;
    userIds: number[];
    roles: number[];
    workflows: WorkflowRow[];
    taskTypes: TaskTypeRow[];
  },
) {
  const today = todayKey();
  await ensureInitialStatuses(tx, input.workflows);
  const typesByWorkflow = await assignTaskTypes(tx, input);

  const existing = await tx.projectTask.findMany({
    where: { projectId: input.projectId },
    select: { code: true },
  });
  let sequence = input.nextTaskNumber;
  for (const task of existing) {
    const match = /^T-(\d+)$/.exec(task.code);
    if (match) sequence = Math.max(sequence, Number(match[1]));
  }

  const nextCode = () => {
    sequence += 1;
    return `T-${sequence}`;
  };

  let count = 0;
  for (const [index, workflow] of input.workflows.entries()) {
    const taskTypeId = typesByWorkflow.get(workflow.id);
    if (!taskTypeId || workflow.statuses.length === 0) continue;
    const samples = index === 0 ? primaryTasks : extraTasks;
    for (const sample of samples) {
      const parentId = await createTask(tx, {
        input,
        workflowId: workflow.id,
        taskTypeId,
        statuses: workflow.statuses,
        sample,
        parentTaskId: null,
        code: nextCode(),
        today,
      });
      count += 1;
      for (const child of sample.children ?? []) {
        await createTask(tx, {
          input,
          workflowId: workflow.id,
          taskTypeId,
          statuses: workflow.statuses,
          sample: {
            title: child.title,
            priority: child.priority,
            statusIndex: child.statusIndex,
            startOffset: null,
            dueOffset: null,
            estimate: child.estimate,
            description: "Việc con của task mẫu.",
            assigneeCount: 1,
          },
          parentTaskId: parentId,
          code: nextCode(),
          today,
        });
        count += 1;
      }
    }
  }

  await tx.project.update({
    where: { id: input.projectId },
    data: { nextTaskNumber: sequence },
  });
  return count;
}

async function ensureInitialStatuses(
  tx: Prisma.TransactionClient,
  workflows: WorkflowRow[],
) {
  for (const workflow of workflows) {
    if (workflow.statuses.some((status) => status.isInitial)) continue;
    const initial =
      workflow.statuses.find(
        (status) => status.category === WorkflowStatusCategory.TODO,
      ) ?? workflow.statuses[0];
    if (!initial) continue;
    await tx.projectWorkflowStatus.update({
      where: { id: initial.id },
      data: { isInitial: true },
    });
    initial.isInitial = true;
  }
}

async function assignTaskTypes(
  tx: Prisma.TransactionClient,
  input: {
    projectId: number;
    workflows: WorkflowRow[];
    taskTypes: TaskTypeRow[];
  },
) {
  const types = input.taskTypes.filter((taskType) => taskType.isActive);
  const unassigned = types.filter((taskType) => taskType.workflowId == null);
  const map = new Map<number, number>();

  for (const workflow of input.workflows) {
    const linked = types.find((taskType) => taskType.workflowId === workflow.id);
    if (linked) {
      map.set(workflow.id, linked.id);
      continue;
    }
    const next = unassigned.shift();
    if (next) {
      await tx.projectTaskType.update({
        where: { id: next.id },
        data: { workflowId: workflow.id },
      });
      next.workflowId = workflow.id;
      map.set(workflow.id, next.id);
      continue;
    }
    const created = await tx.projectTaskType.create({
      data: {
        projectId: input.projectId,
        workflowId: workflow.id,
        name: `Công việc ${workflow.name}`.slice(0, 150),
        key: `SEED_${workflow.id}`.slice(0, 50),
        description: "Loại việc mẫu cho workflow chưa có task type.",
        sortOrder: 0,
        isActive: true,
      },
    });
    map.set(workflow.id, created.id);
  }

  const defaultWorkflow = input.workflows[0];
  if (defaultWorkflow) {
    for (const taskType of unassigned) {
      await tx.projectTaskType.update({
        where: { id: taskType.id },
        data: { workflowId: defaultWorkflow.id },
      });
    }
  }

  return map;
}

async function createTask(
  tx: Prisma.TransactionClient,
  args: {
    input: {
      projectId: number;
      createdById: number;
      userIds: number[];
      roles: number[];
    };
    workflowId: number;
    taskTypeId: number;
    statuses: StatusRow[];
    sample: TaskSeed;
    parentTaskId: number | null;
    code: string;
    today: string;
  },
) {
  const status = pickStatus(args.statuses, args.sample.statusIndex);
  if (!status) throw new Error("Workflow không có trạng thái");

  const startKey =
    args.sample.startOffset == null
      ? null
      : shiftKey(args.today, args.sample.startOffset);
  const dueKey =
    args.sample.dueOffset == null
      ? null
      : shiftKey(args.today, args.sample.dueOffset);
  const assigneeCount = Math.min(
    args.sample.assigneeCount,
    args.input.roles.length,
  );
  const reporterId = args.input.userIds[0];
  const reviewerId = args.input.userIds[1] ?? null;

  const task = await tx.projectTask.create({
    data: {
      projectId: args.input.projectId,
      code: args.code,
      title: args.sample.title,
      description: `<p>${args.sample.description}</p><p>${SEED_MARKER}</p>`,
      workflowId: args.workflowId,
      taskTypeId: args.taskTypeId,
      statusId: status.id,
      priority: args.sample.priority,
      startDate: startKey ? dateOnly(startKey) : null,
      dueDate: dueKey ? dateOnly(dueKey) : null,
      estimatedMinutes: args.sample.estimate,
      parentTaskId: args.parentTaskId,
      createdById: args.input.createdById,
      ...(args.sample.createdToday
        ? { createdAt: createdAtOn(args.today) }
        : {}),
      members: {
        create: [
          ...Array.from({ length: assigneeCount }, (_, index) => ({
            userId: args.input.userIds[index % args.input.userIds.length],
            taskRole: TemplateTaskRole.ASSIGNEE,
            projectRoleId: args.input.roles[index],
          })),
          {
            userId: reporterId,
            taskRole: TemplateTaskRole.REPORTER,
            projectRoleId: null,
          },
          ...(reviewerId
            ? [
                {
                  userId: reviewerId,
                  taskRole: TemplateTaskRole.REVIEWER,
                  projectRoleId: null,
                },
              ]
            : []),
        ],
      },
    },
    select: { id: true },
  });

  return task.id;
}
