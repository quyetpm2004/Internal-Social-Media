import {
  ApprovalApproverType,
  PrismaClient,
  ProjectTemplateStatus,
  TemplateTaskRole,
  WorkflowStatusCategory,
} from "@prisma/client";

type StatusSeed = {
  key: string;
  name: string;
  category: WorkflowStatusCategory;
  sortOrder: number;
  isInitial?: boolean;
  isFinal?: boolean;
};

type ApprovalSeed = {
  approverType: ApprovalApproverType;
  projectRoleKey?: string;
  taskRole?: TemplateTaskRole;
  minApprovals: number;
  onReject: string;
};

type TransitionSeed = {
  from: string;
  to: string;
  name: string;
  approval?: ApprovalSeed;
};

type WorkflowSeed = {
  name: string;
  description: string;
  isDefault: boolean;
  statuses: StatusSeed[];
  transitions: TransitionSeed[];
};

type TaskTypeSeed = {
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  workflowName?: string;
};

type RoleSeed = {
  key: string;
  name: string;
  description: string;
  sortOrder: number;
};

type TemplateSeed = {
  key: string;
  name: string;
  description: string;
  roles: RoleSeed[];
  workflows: WorkflowSeed[];
  taskTypes: TaskTypeSeed[];
};

const templates: TemplateSeed[] = [
  {
    key: "KANBAN",
    name: "Kanban",
    description:
      "Bảng Kanban theo Jira Simplified Workflow: một luồng Backlog, Selected for Development, In Progress, Done.",
    roles: [
      {
        key: "TEAM_MEMBER",
        name: "Team Member",
        description: "Người thực hiện thẻ trên bảng",
        sortOrder: 1,
      },
    ],
    workflows: [
      {
        name: "Kanban Board",
        description: "Luồng liên tục, không theo sprint",
        isDefault: true,
        statuses: [
          {
            key: "BACKLOG",
            name: "Backlog",
            category: WorkflowStatusCategory.TODO,
            sortOrder: 1,
            isInitial: true,
          },
          {
            key: "SELECTED",
            name: "Selected for Development",
            category: WorkflowStatusCategory.TODO,
            sortOrder: 2,
          },
          {
            key: "IN_PROGRESS",
            name: "In Progress",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 3,
          },
          {
            key: "DONE",
            name: "Done",
            category: WorkflowStatusCategory.DONE,
            sortOrder: 4,
            isFinal: true,
          },
        ],
        transitions: [
          { from: "BACKLOG", to: "SELECTED", name: "Select for development" },
          { from: "SELECTED", to: "BACKLOG", name: "Move back to backlog" },
          { from: "SELECTED", to: "IN_PROGRESS", name: "Start work" },
          { from: "IN_PROGRESS", to: "SELECTED", name: "Stop work" },
          { from: "IN_PROGRESS", to: "DONE", name: "Complete" },
        ],
      },
    ],
    taskTypes: [
      {
        key: "TASK",
        name: "Task",
        description: "Công việc trên bảng Kanban",
        sortOrder: 1,
      },
      {
        key: "STORY",
        name: "Story",
        description: "Hạng mục cần giao",
        sortOrder: 2,
      },
    ],
  },
  {
    key: "SCRUM",
    name: "Scrum",
    description:
      "Bảng Scrum theo Jira Simplified Workflow: một luồng To Do, In Progress, Done cho mọi loại việc trong sprint.",
    roles: [
      {
        key: "PRODUCT_OWNER",
        name: "Product Owner",
        description: "Người quyết định hạng mục trong sprint",
        sortOrder: 1,
      },
      {
        key: "SCRUM_MASTER",
        name: "Scrum Master",
        description: "Người điều phối sprint",
        sortOrder: 2,
      },
      {
        key: "DEVELOPER",
        name: "Developer",
        description: "Người thực hiện việc trong sprint",
        sortOrder: 3,
      },
    ],
    workflows: [
      {
        name: "Scrum Board",
        description: "Luồng của sprint board",
        isDefault: true,
        statuses: [
          {
            key: "TODO",
            name: "To Do",
            category: WorkflowStatusCategory.TODO,
            sortOrder: 1,
            isInitial: true,
          },
          {
            key: "IN_PROGRESS",
            name: "In Progress",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 2,
          },
          {
            key: "DONE",
            name: "Done",
            category: WorkflowStatusCategory.DONE,
            sortOrder: 3,
            isFinal: true,
          },
        ],
        transitions: [
          { from: "TODO", to: "IN_PROGRESS", name: "Start sprint work" },
          { from: "IN_PROGRESS", to: "TODO", name: "Return to To Do" },
          { from: "IN_PROGRESS", to: "DONE", name: "Finish" },
        ],
      },
    ],
    taskTypes: [
      {
        key: "STORY",
        name: "Story",
        description: "User story trong sprint",
        sortOrder: 1,
      },
      {
        key: "TASK",
        name: "Task",
        description: "Việc nhỏ trong sprint",
        sortOrder: 2,
      },
      {
        key: "BUG",
        name: "Bug",
        description: "Lỗi xử lý trong sprint",
        sortOrder: 3,
      },
    ],
  },
  {
    key: "BUG_TRACKING",
    name: "Bug Tracking",
    description:
      "Theo dõi lỗi theo Jira default workflow: một luồng Open, In Progress, Resolved, Reopened, Closed.",
    roles: [
      {
        key: "REPORTER",
        name: "Reporter",
        description: "Người ghi nhận lỗi",
        sortOrder: 1,
      },
      {
        key: "DEVELOPER",
        name: "Developer",
        description: "Người sửa lỗi",
        sortOrder: 2,
      },
      {
        key: "QA",
        name: "QA",
        description: "Người xác nhận lỗi đã được sửa",
        sortOrder: 3,
      },
    ],
    workflows: [
      {
        name: "Bug Workflow",
        description: "Vòng đời một lỗi",
        isDefault: true,
        statuses: [
          {
            key: "OPEN",
            name: "Open",
            category: WorkflowStatusCategory.TODO,
            sortOrder: 1,
            isInitial: true,
          },
          {
            key: "IN_PROGRESS",
            name: "In Progress",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 2,
          },
          {
            key: "RESOLVED",
            name: "Resolved",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 3,
          },
          {
            key: "REOPENED",
            name: "Reopened",
            category: WorkflowStatusCategory.TODO,
            sortOrder: 4,
          },
          {
            key: "CLOSED",
            name: "Closed",
            category: WorkflowStatusCategory.DONE,
            sortOrder: 5,
            isFinal: true,
          },
        ],
        transitions: [
          { from: "OPEN", to: "IN_PROGRESS", name: "Start progress" },
          { from: "IN_PROGRESS", to: "RESOLVED", name: "Resolve" },
          {
            from: "RESOLVED",
            to: "CLOSED",
            name: "Close",
            approval: {
              approverType: ApprovalApproverType.PROJECT_ROLE,
              projectRoleKey: "QA",
              minApprovals: 1,
              onReject: "REOPENED",
            },
          },
          { from: "RESOLVED", to: "REOPENED", name: "Reopen" },
          { from: "REOPENED", to: "IN_PROGRESS", name: "Restart" },
        ],
      },
    ],
    taskTypes: [
      {
        key: "BUG",
        name: "Bug",
        description: "Lỗi chức năng",
        sortOrder: 1,
      },
      {
        key: "INCIDENT",
        name: "Incident",
        description: "Sự cố cần xử lý",
        sortOrder: 2,
      },
    ],
  },
  {
    key: "SOFTWARE_DELIVERY",
    name: "Software Delivery",
    description:
      "Mẫu giao phần mềm với hai quy trình: phát triển tính năng và xử lý hotfix.",
    roles: [
      {
        key: "PROJECT_MANAGER",
        name: "Project Manager",
        description: "Người phụ trách phát hành",
        sortOrder: 1,
      },
      {
        key: "DEVELOPER",
        name: "Developer",
        description: "Người phát triển",
        sortOrder: 2,
      },
      {
        key: "QA",
        name: "QA",
        description: "Người kiểm thử",
        sortOrder: 3,
      },
    ],
    workflows: [
      {
        name: "Feature Delivery",
        description: "Vòng đời một tính năng",
        isDefault: true,
        statuses: [
          {
            key: "TODO",
            name: "To Do",
            category: WorkflowStatusCategory.TODO,
            sortOrder: 1,
            isInitial: true,
          },
          {
            key: "IN_PROGRESS",
            name: "In Progress",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 2,
          },
          {
            key: "CODE_REVIEW",
            name: "Code Review",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 3,
          },
          {
            key: "TESTING",
            name: "Testing",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 4,
          },
          {
            key: "DONE",
            name: "Done",
            category: WorkflowStatusCategory.DONE,
            sortOrder: 5,
            isFinal: true,
          },
        ],
        transitions: [
          { from: "TODO", to: "IN_PROGRESS", name: "Start" },
          { from: "IN_PROGRESS", to: "CODE_REVIEW", name: "Submit review" },
          { from: "CODE_REVIEW", to: "IN_PROGRESS", name: "Request changes" },
          {
            from: "CODE_REVIEW",
            to: "TESTING",
            name: "Ready for test",
            approval: {
              approverType: ApprovalApproverType.PROJECT_ROLE,
              projectRoleKey: "QA",
              minApprovals: 1,
              onReject: "IN_PROGRESS",
            },
          },
          { from: "TESTING", to: "IN_PROGRESS", name: "Test failed" },
          { from: "TESTING", to: "DONE", name: "Accept" },
        ],
      },
      {
        name: "Hotfix",
        description: "Sửa lỗi khẩn cấp và phát hành",
        isDefault: false,
        statuses: [
          {
            key: "REPORTED",
            name: "Reported",
            category: WorkflowStatusCategory.TODO,
            sortOrder: 1,
            isInitial: true,
          },
          {
            key: "FIXING",
            name: "Fixing",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 2,
          },
          {
            key: "VERIFIED",
            name: "Verified",
            category: WorkflowStatusCategory.IN_PROGRESS,
            sortOrder: 3,
          },
          {
            key: "RELEASED",
            name: "Released",
            category: WorkflowStatusCategory.DONE,
            sortOrder: 4,
            isFinal: true,
          },
        ],
        transitions: [
          { from: "REPORTED", to: "FIXING", name: "Start fix" },
          { from: "FIXING", to: "VERIFIED", name: "Ready to verify" },
          { from: "VERIFIED", to: "FIXING", name: "Verification failed" },
          {
            from: "VERIFIED",
            to: "RELEASED",
            name: "Release",
            approval: {
              approverType: ApprovalApproverType.PROJECT_ROLE,
              projectRoleKey: "PROJECT_MANAGER",
              minApprovals: 1,
              onReject: "FIXING",
            },
          },
        ],
      },
    ],
    taskTypes: [
      {
        key: "FEATURE",
        name: "Feature",
        description: "Tính năng mới, dùng workflow Feature Delivery",
        sortOrder: 1,
      },
      {
        key: "IMPROVEMENT",
        name: "Improvement",
        description: "Cải tiến, dùng workflow mặc định",
        sortOrder: 2,
      },
      {
        key: "HOTFIX",
        name: "Hotfix",
        description: "Sửa khẩn cấp, dùng workflow Hotfix",
        sortOrder: 3,
        workflowName: "Hotfix",
      },
    ],
  },
];

async function clearProjectTemplates(prisma: PrismaClient) {
  await prisma.templateApprovalRule.deleteMany();
  await prisma.templateWorkflowTransition.deleteMany();
  await prisma.templateWorkflowStatus.deleteMany();
  await prisma.templateTaskType.deleteMany();
  await prisma.templateProjectRole.deleteMany();
  await prisma.templateWorkflow.deleteMany();
  await prisma.projectTemplate.updateMany({
    data: { parentTemplateId: null },
  });
  await prisma.projectTemplate.deleteMany();
}

async function createTemplate(
  prisma: PrismaClient,
  createdById: number,
  seed: TemplateSeed,
) {
  await prisma.$transaction(async (tx) => {
    const template = await tx.projectTemplate.create({
      data: {
        key: seed.key,
        name: seed.name,
        description: seed.description,
        status: ProjectTemplateStatus.DRAFT,
        version: 1,
        createdById,
        projectRoles: {
          create: seed.roles.map((role) => ({
            key: role.key,
            name: role.name,
            description: role.description,
            sortOrder: role.sortOrder,
          })),
        },
      },
      include: { projectRoles: true },
    });

    const roleIdByKey = new Map(
      template.projectRoles.map((role) => [role.key, role.id]),
    );
    const workflowIdByName = new Map<string, number>();

    for (const workflowSeed of seed.workflows) {
      const workflow = await tx.templateWorkflow.create({
        data: {
          templateId: template.id,
          name: workflowSeed.name,
          description: workflowSeed.description,
          isDefault: workflowSeed.isDefault,
          isActive: true,
          statuses: {
            create: workflowSeed.statuses.map((status) => ({
              key: status.key,
              name: status.name,
              category: status.category,
              sortOrder: status.sortOrder,
              isInitial: status.isInitial ?? false,
              isFinal: status.isFinal ?? false,
            })),
          },
        },
        include: { statuses: true },
      });

      workflowIdByName.set(workflow.name, workflow.id);
      const statusIdByKey = new Map(
        workflow.statuses.map((status) => [status.key, status.id]),
      );

      for (const transitionSeed of workflowSeed.transitions) {
        const fromStatusId = statusIdByKey.get(transitionSeed.from);
        const toStatusId = statusIdByKey.get(transitionSeed.to);
        if (!fromStatusId || !toStatusId) {
          throw new Error(
            `${seed.key}: transition ${transitionSeed.name} tham chiếu status không tồn tại`,
          );
        }

        const transition = await tx.templateWorkflowTransition.create({
          data: {
            workflowId: workflow.id,
            fromStatusId,
            toStatusId,
            name: transitionSeed.name,
            isActive: true,
          },
        });

        if (!transitionSeed.approval) continue;

        const approval = transitionSeed.approval;
        const onRejectStatusId = statusIdByKey.get(approval.onReject);
        if (!onRejectStatusId) {
          throw new Error(
            `${seed.key}: approval của ${transitionSeed.name} có status từ chối không tồn tại`,
          );
        }

        const projectRoleId = approval.projectRoleKey
          ? roleIdByKey.get(approval.projectRoleKey)
          : null;
        if (approval.projectRoleKey && !projectRoleId) {
          throw new Error(
            `${seed.key}: không tìm thấy role ${approval.projectRoleKey}`,
          );
        }

        await tx.templateApprovalRule.create({
          data: {
            transitionId: transition.id,
            approverType: approval.approverType,
            projectRoleId: projectRoleId ?? null,
            taskRole: approval.taskRole ?? null,
            minApprovals: approval.minApprovals,
            onRejectStatusId,
          },
        });
      }
    }

    for (const taskType of seed.taskTypes) {
      const workflowId = taskType.workflowName
        ? workflowIdByName.get(taskType.workflowName)
        : null;
      if (taskType.workflowName && !workflowId) {
        throw new Error(
          `${seed.key}: task type ${taskType.key} trỏ workflow không tồn tại`,
        );
      }

      await tx.templateTaskType.create({
        data: {
          templateId: template.id,
          workflowId: workflowId ?? null,
          key: taskType.key,
          name: taskType.name,
          description: taskType.description,
          sortOrder: taskType.sortOrder,
          isActive: true,
        },
      });
    }
  });
}

export async function seedProjectTemplates(prisma: PrismaClient) {
  console.log("--- Seeding Project Templates ---");

  const admin = await prisma.user.findUnique({
    where: { email: "admin@company.com" },
  });

  if (!admin) {
    throw new Error(
      "Không tìm thấy admin@company.com. Hãy seed user trước khi seed template.",
    );
  }

  await clearProjectTemplates(prisma);

  for (const template of templates) {
    await createTemplate(prisma, admin.id, template);
    console.log(`  created ${template.key} (${template.workflows.length} workflow)`);
  }
}
