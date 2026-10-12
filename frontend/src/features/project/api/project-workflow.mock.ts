import type { AxiosError } from "axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  CreateProjectWorkflowStatusPayload,
  CreateProjectWorkflowTransitionPayload,
  ProjectWorkflow,
  ProjectWorkflowConfig,
  SaveProjectApprovalRulePayload,
  SaveProjectWorkflowPayload,
  SaveProjectWorkflowStatusPayload,
  SaveProjectWorkflowTransitionPayload,
} from "@/features/project/types/project.type";

export const USE_PROJECT_WORKFLOW_MOCK = true;

const stores = new Map<number, ProjectWorkflowConfig>();
let nextId = 100;

function fail(message: string): never {
  const error = new Error(message) as AxiosError<{ message: string }>;
  error.response = {
    data: { message },
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: {} as AxiosError["config"],
  };
  throw error;
}

function ok<T>(data: T): ApiResponse<T> {
  return { message: "ok", data };
}

function seed(): ProjectWorkflowConfig {
  return {
    canConfigure: true,
    projectRoles: [
      { id: 1, key: "PROJECT_MANAGER", name: "Project Manager", sortOrder: 0 },
      { id: 2, key: "QA", name: "QA", sortOrder: 1 },
      { id: 3, key: "DEVELOPER", name: "Developer", sortOrder: 2 },
    ],
    taskTypes: [
      { id: 1, name: "Feature", workflowId: 1 },
      { id: 2, name: "Bug", workflowId: 2 },
    ],
    workflows: [
      {
        id: 1,
        name: "Development",
        description: "Quy trình phát triển tính năng",
        isDefault: true,
        isActive: true,
        statuses: [
          {
            id: 1,
            name: "To Do",
            key: "TODO",
            description: "Việc chưa bắt đầu",
            sortOrder: 0,
            category: "TODO",
            color: "#64748B",
            isInitial: true,
            isFinal: false,
          },
          {
            id: 2,
            name: "In Progress",
            key: "IN_PROGRESS",
            description: "Đang làm",
            sortOrder: 1,
            category: "IN_PROGRESS",
            color: "#3B82F6",
            isInitial: false,
            isFinal: false,
          },
          {
            id: 3,
            name: "Review",
            key: "REVIEW",
            description: "Chờ xem xét",
            sortOrder: 2,
            category: "IN_PROGRESS",
            color: "#8B5CF6",
            isInitial: false,
            isFinal: false,
          },
          {
            id: 4,
            name: "Testing",
            key: "TESTING",
            description: "Đang kiểm thử",
            sortOrder: 3,
            category: "IN_PROGRESS",
            color: "#F59E0B",
            isInitial: false,
            isFinal: false,
          },
          {
            id: 5,
            name: "Done",
            key: "DONE",
            description: "Hoàn thành",
            sortOrder: 4,
            category: "DONE",
            color: "#22C55E",
            isInitial: false,
            isFinal: true,
          },
          {
            id: 6,
            name: "Cancelled",
            key: "CANCELLED",
            description: null,
            sortOrder: 5,
            category: "CANCELLED",
            color: "#EF4444",
            isInitial: false,
            isFinal: true,
          },
        ],
        transitions: [
          {
            id: 11,
            fromStatusId: 1,
            toStatusId: 2,
            name: "Bắt đầu làm",
            isActive: true,
            approvalRules: [],
          },
          {
            id: 12,
            fromStatusId: 2,
            toStatusId: 3,
            name: "Gửi review",
            isActive: true,
            approvalRules: [
              {
                id: 21,
                approverType: "PROJECT_ROLE",
                projectRoleId: 2,
                taskRole: null,
                minApprovals: 1,
                onRejectStatusId: 2,
              },
            ],
          },
          {
            id: 13,
            fromStatusId: 3,
            toStatusId: 4,
            name: "Chuyển kiểm thử",
            isActive: true,
            approvalRules: [
              {
                id: 22,
                approverType: "TASK_ROLE",
                projectRoleId: null,
                taskRole: "REVIEWER",
                minApprovals: 1,
                onRejectStatusId: 2,
              },
            ],
          },
          {
            id: 14,
            fromStatusId: 4,
            toStatusId: 5,
            name: "Hoàn thành",
            isActive: true,
            approvalRules: [],
          },
          {
            id: 15,
            fromStatusId: 3,
            toStatusId: 2,
            name: "Yêu cầu sửa",
            isActive: true,
            approvalRules: [],
          },
          {
            id: 16,
            fromStatusId: 2,
            toStatusId: 6,
            name: "Hủy việc",
            isActive: false,
            approvalRules: [],
          },
        ],
      },
      {
        id: 2,
        name: "Bug Fix",
        description: "Quy trình xử lý lỗi",
        isDefault: false,
        isActive: true,
        statuses: [
          {
            id: 31,
            name: "Open",
            key: "OPEN",
            description: null,
            sortOrder: 0,
            category: "TODO",
            color: "#64748B",
            isInitial: true,
            isFinal: false,
          },
          {
            id: 32,
            name: "Fixing",
            key: "FIXING",
            description: null,
            sortOrder: 1,
            category: "IN_PROGRESS",
            color: "#3B82F6",
            isInitial: false,
            isFinal: false,
          },
          {
            id: 33,
            name: "Closed",
            key: "CLOSED",
            description: null,
            sortOrder: 2,
            category: "DONE",
            color: "#22C55E",
            isInitial: false,
            isFinal: true,
          },
        ],
        transitions: [
          {
            id: 41,
            fromStatusId: 31,
            toStatusId: 32,
            name: "Nhận lỗi",
            isActive: true,
            approvalRules: [],
          },
          {
            id: 42,
            fromStatusId: 32,
            toStatusId: 33,
            name: "Đóng lỗi",
            isActive: true,
            approvalRules: [],
          },
        ],
      },
    ],
  };
}

function storeFor(projectId: number) {
  const current = stores.get(projectId);
  if (current) return current;
  const created = seed();
  stores.set(projectId, created);
  return created;
}

function present(config: ProjectWorkflowConfig): ProjectWorkflowConfig {
  return {
    canConfigure: config.canConfigure,
    projectRoles: [...config.projectRoles].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
    ),
    taskTypes: config.taskTypes ? [...config.taskTypes] : [],
    workflows: [...config.workflows]
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id)
      .map((workflow) => ({
        ...workflow,
        statuses: [...workflow.statuses].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
        ),
        transitions: [...workflow.transitions]
          .sort((a, b) => a.id - b.id)
          .map((transition) => ({
            ...transition,
            approvalRules: [...transition.approvalRules].sort(
              (a, b) => a.id - b.id,
            ),
          })),
      })),
  };
}

function workflowOf(config: ProjectWorkflowConfig, workflowId: number) {
  const workflow = config.workflows.find((item) => item.id === workflowId);
  if (!workflow) fail("Không tìm thấy quy trình");
  return workflow;
}

function sameIds(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id)) && rightSet.size === right.length;
}

export const projectWorkflowMock = {
  async getWorkflows(projectId: number) {
    return ok(present(storeFor(projectId)));
  },

  async createWorkflow(projectId: number, data: SaveProjectWorkflowPayload) {
    const config = storeFor(projectId);
    const id = nextId++;
    if (data.isDefault) {
      for (const workflow of config.workflows) workflow.isDefault = false;
    }
    config.workflows.push({
      id,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      isActive: data.isDefault ? true : data.isActive,
      statuses: [],
      transitions: [],
    });
    return ok({ id });
  },

  async updateWorkflow(
    projectId: number,
    workflowId: number,
    data: Partial<SaveProjectWorkflowPayload>,
  ) {
    const config = storeFor(projectId);
    const workflow = workflowOf(config, workflowId);
    if (data.isDefault === false && workflow.isDefault) {
      fail("Dự án phải có một quy trình mặc định");
    }
    const nextDefault = data.isDefault ?? workflow.isDefault;
    const nextActive = data.isActive ?? workflow.isActive;
    if (nextDefault && nextActive === false) {
      fail("Quy trình mặc định phải đang dùng");
    }
    if (data.isDefault) {
      for (const item of config.workflows) {
        if (item.id !== workflowId) item.isDefault = false;
      }
    }
    if (data.name !== undefined) workflow.name = data.name;
    if (data.description !== undefined) workflow.description = data.description;
    if (data.isDefault !== undefined) workflow.isDefault = data.isDefault;
    if (data.isActive !== undefined) workflow.isActive = data.isActive;
    return ok({ id: workflowId });
  },

  async deleteWorkflow(projectId: number, workflowId: number) {
    const config = storeFor(projectId);
    workflowOf(config, workflowId);
    if (config.workflows.length <= 1) {
      fail("Dự án phải có ít nhất một quy trình");
    }
    const used = (config.taskTypes ?? []).some(
      (taskType) => taskType.workflowId === workflowId,
    );
    if (used) fail("Không thể xóa quy trình đang được loại công việc sử dụng");
    config.workflows = config.workflows.filter((item) => item.id !== workflowId);
    return ok(true);
  },

  async createWorkflowStatus(
    projectId: number,
    workflowId: number,
    data: CreateProjectWorkflowStatusPayload,
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    if (workflow.statuses.some((status) => status.key === data.key)) {
      fail("Key trạng thái đã tồn tại trong quy trình");
    }
    if (workflow.statuses.some((status) => status.name === data.name)) {
      fail("Tên trạng thái đã tồn tại trong quy trình");
    }
    const id = nextId++;
    if (data.isInitial) {
      for (const status of workflow.statuses) status.isInitial = false;
    }
    workflow.statuses.push({ id, ...data });
    return ok({ id });
  },

  async updateWorkflowStatus(
    projectId: number,
    workflowId: number,
    statusId: number,
    data: SaveProjectWorkflowStatusPayload,
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    const status = workflow.statuses.find((item) => item.id === statusId);
    if (!status) fail("Không tìm thấy trạng thái");
    if (
      workflow.statuses.some(
        (item) => item.id !== statusId && item.name === data.name,
      )
    ) {
      fail("Tên trạng thái đã tồn tại trong quy trình");
    }
    if (data.isInitial) {
      for (const item of workflow.statuses) {
        if (item.id !== statusId) item.isInitial = false;
      }
    }
    Object.assign(status, data);
    return ok({ id: statusId });
  },

  async deleteWorkflowStatus(
    projectId: number,
    workflowId: number,
    statusId: number,
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    if (!workflow.statuses.some((status) => status.id === statusId)) {
      fail("Không tìm thấy trạng thái");
    }
    const removed = new Set(
      workflow.transitions
        .filter(
          (transition) =>
            transition.fromStatusId === statusId ||
            transition.toStatusId === statusId,
        )
        .map((transition) => transition.id),
    );
    workflow.transitions = workflow.transitions.filter((transition) => {
      if (removed.has(transition.id)) return false;
      transition.approvalRules = transition.approvalRules.filter(
        (rule) => rule.onRejectStatusId !== statusId,
      );
      return true;
    });
    workflow.statuses = workflow.statuses.filter(
      (status) => status.id !== statusId,
    );
    return ok(true);
  },

  async reorderWorkflowStatuses(
    projectId: number,
    workflowId: number,
    statusIds: number[],
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    const currentIds = workflow.statuses.map((status) => status.id);
    if (!sameIds(currentIds, statusIds)) {
      fail("Danh sách trạng thái không khớp quy trình");
    }
    statusIds.forEach((id, index) => {
      const status = workflow.statuses.find((item) => item.id === id);
      if (status) status.sortOrder = index;
    });
    return ok(true);
  },

  async createWorkflowTransition(
    projectId: number,
    workflowId: number,
    data: CreateProjectWorkflowTransitionPayload,
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    const known = new Set(workflow.statuses.map((status) => status.id));
    if (!known.has(data.fromStatusId) || !known.has(data.toStatusId)) {
      fail("Trạng thái không thuộc quy trình này");
    }
    if (data.fromStatusId === data.toStatusId) {
      fail("Trạng thái nguồn và đích phải khác nhau");
    }
    if (
      workflow.transitions.some(
        (transition) =>
          transition.fromStatusId === data.fromStatusId &&
          transition.toStatusId === data.toStatusId,
      )
    ) {
      fail("Đã có đường đi giữa hai trạng thái này");
    }
    const id = nextId++;
    workflow.transitions.push({
      id,
      ...data,
      isActive: true,
      approvalRules: [],
    });
    return ok({ id });
  },

  async updateWorkflowTransition(
    projectId: number,
    workflowId: number,
    transitionId: number,
    data: SaveProjectWorkflowTransitionPayload,
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    const transition = workflow.transitions.find(
      (item) => item.id === transitionId,
    );
    if (!transition) fail("Không tìm thấy đường đi");
    transition.name = data.name;
    transition.isActive = data.isActive;
    return ok({ id: transitionId });
  },

  async deleteWorkflowTransition(
    projectId: number,
    workflowId: number,
    transitionId: number,
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    const before = workflow.transitions.length;
    workflow.transitions = workflow.transitions.filter(
      (transition) => transition.id !== transitionId,
    );
    if (workflow.transitions.length === before) fail("Không tìm thấy đường đi");
    return ok(true);
  },

  async createApprovalRule(
    projectId: number,
    workflowId: number,
    transitionId: number,
    data: SaveProjectApprovalRulePayload,
  ) {
    const config = storeFor(projectId);
    const workflow = workflowOf(config, workflowId);
    const transition = workflow.transitions.find(
      (item) => item.id === transitionId,
    );
    if (!transition) fail("Không tìm thấy đường đi");
    assertRule(config, workflow, transition, data);
    const id = nextId++;
    transition.approvalRules.push({ id, ...data });
    return ok({ id });
  },

  async updateApprovalRule(
    projectId: number,
    workflowId: number,
    transitionId: number,
    ruleId: number,
    data: SaveProjectApprovalRulePayload,
  ) {
    const config = storeFor(projectId);
    const workflow = workflowOf(config, workflowId);
    const transition = workflow.transitions.find(
      (item) => item.id === transitionId,
    );
    if (!transition) fail("Không tìm thấy đường đi");
    const rule = transition.approvalRules.find((item) => item.id === ruleId);
    if (!rule) fail("Không tìm thấy quy tắc duyệt");
    assertRule(config, workflow, transition, data, ruleId);
    Object.assign(rule, data);
    return ok({ id: ruleId });
  },

  async deleteApprovalRule(
    projectId: number,
    workflowId: number,
    transitionId: number,
    ruleId: number,
  ) {
    const workflow = workflowOf(storeFor(projectId), workflowId);
    const transition = workflow.transitions.find(
      (item) => item.id === transitionId,
    );
    if (!transition) fail("Không tìm thấy đường đi");
    const before = transition.approvalRules.length;
    transition.approvalRules = transition.approvalRules.filter(
      (rule) => rule.id !== ruleId,
    );
    if (transition.approvalRules.length === before) {
      fail("Không tìm thấy quy tắc duyệt");
    }
    return ok(true);
  },
};

function assertRule(
  config: ProjectWorkflowConfig,
  workflow: ProjectWorkflow,
  transition: ProjectWorkflow["transitions"][number],
  data: SaveProjectApprovalRulePayload,
  excludeId?: number,
) {
  if (data.minApprovals < 1) fail("Số người duyệt phải từ 1");
  if (data.approverType === "PROJECT_ROLE") {
    if (!data.projectRoleId || data.taskRole) {
      fail("PROJECT_ROLE yêu cầu vai trò dự án");
    }
    if (!config.projectRoles.some((role) => role.id === data.projectRoleId)) {
      fail("Vai trò không thuộc dự án này");
    }
  }
  if (data.approverType === "TASK_ROLE") {
    if (!data.taskRole || data.projectRoleId) {
      fail("TASK_ROLE yêu cầu vai trò trên công việc");
    }
  }
  if (!workflow.statuses.some((status) => status.id === data.onRejectStatusId)) {
    fail("Trạng thái từ chối không thuộc quy trình này");
  }
  if (data.onRejectStatusId === transition.toStatusId) {
    fail("Trạng thái từ chối không được trùng trạng thái đích");
  }
  const duplicate = transition.approvalRules.some((rule) => {
    if (rule.id === excludeId) return false;
    if (rule.approverType !== data.approverType) return false;
    return data.approverType === "PROJECT_ROLE"
      ? rule.projectRoleId === data.projectRoleId
      : rule.taskRole === data.taskRole;
  });
  if (duplicate) fail("Đường đi này đã có quy tắc cho người duyệt này");
}
