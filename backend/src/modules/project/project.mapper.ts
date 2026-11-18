export function mapTemplateOptions(templates: any) {
  return templates.map((template: any) => ({
    id: template.id,
    key: template.key,
    name: template.name,
    description: template.description,
    workflowName: template.workflows[0]?.name || "",
    statusFlow:
      template.workflows[0]?.statuses.map((status: any) => status.name) || [],
  }));
}

export function mapProjectDetail(
  project: any,
  currentUserId: number,
  access: { canEdit: boolean; canReassignManager: boolean },
) {
  const workflow = project.workflows?.[0];

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    visibility: project.visibility,
    priority: project.priority,
    status: project.status,
    isUrgent: project.isUrgent,
    startDate: project.startDate,
    endDate: project.endDate,
    templateId: project.templateId,
    templateName: project.template?.name ?? "",
    templateVersion: project.templateVersion,
    workflowName: workflow?.name ?? "",
    workflowStatuses: workflow?.statuses ?? [],
    memberCount: new Set(
      project.members?.map((member: { userId: number }) => member.userId) ?? [],
    ).size,
    createdBy: project.createdBy,
    canEdit: access.canEdit,
    canReassignManager: access.canReassignManager,
    departmentId: project.departmentId ?? null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function mapProjectList(projects: any, currentUserId: number) {
  return projects.map((project: any) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    visibility: project.visibility,
    priority: project.priority,
    status: project.status,
    isUrgent: project.isUrgent,
    startDate: project.startDate,
    endDate: project.endDate,
    templateName: project.template?.name ?? "",
    workflowName: project.workflows?.[0]?.name ?? "",
    memberCount: new Set(
      project.members?.map((member: { userId: number }) => member.userId) ?? [],
    ).size,
    isMember:
      project.members?.some(
        (member: { userId: number }) => member.userId === currentUserId,
      ) ?? false,
  }));
}

type ProjectMemberRoleRow = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  sortOrder?: number;
};

type ProjectMemberRow = {
  userId: number;
  fullName: string;
  email: string;
  avatarKey: string | null;
  joinedAt: Date;
  roles: ProjectMemberRoleRow[];
};

export function mapProjectRoles(projectRoles: ProjectMemberRoleRow[]) {
  return projectRoles.map((projectRole) => ({
    id: projectRole.id,
    name: projectRole.name,
    key: projectRole.key,
    description: projectRole.description,
    sortOrder: projectRole.sortOrder,
  }));
}

export function mapProjectMembers(
  projectMembers: ProjectMemberRow[],
  userId: number,
  avatarUrls: Map<string, string>,
) {
  return projectMembers.map((member) => ({
    userId: member.userId,
    fullName: member.fullName,
    email: member.email,
    avatarUrl: member.avatarKey
      ? (avatarUrls.get(member.avatarKey) ?? null)
      : null,
    isMe: member.userId === userId,
    joinedAt: member.joinedAt,
    roles: mapProjectRoles(member.roles),
  }));
}

type MemberCandidateRow = {
  id: number;
  fullName: string;
  email: string;
  avatarKey: string | null;
};

export function mapMemberCandidates(
  candidates: MemberCandidateRow[],
  avatarUrls: Map<string, string>,
) {
  return candidates.map((candidate) => ({
    id: candidate.id,
    fullName: candidate.fullName,
    email: candidate.email,
    avatarUrl: candidate.avatarKey
      ? (avatarUrls.get(candidate.avatarKey) ?? null)
      : null,
  }));
}

type WorkflowRoleRow = {
  id: number;
  key: string;
  name: string;
  sortOrder: number;
};

type WorkflowTaskTypeRow = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  workflowId: number | null;
};

type WorkflowStatusRow = {
  id: number;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number;
  category: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  color: string | null;
  isInitial: boolean;
  isFinal: boolean;
};

type WorkflowApprovalRuleRow = {
  id: number;
  approverType: "PROJECT_ROLE" | "TASK_ROLE";
  projectRoleId: number | null;
  taskRole: "ASSIGNEE" | "REVIEWER" | "REPORTER" | null;
  minApprovals: number;
  onRejectStatusId: number;
};

type WorkflowTransitionRow = {
  id: number;
  fromStatusId: number;
  toStatusId: number;
  name: string;
  isActive: boolean;
  approvalRules: WorkflowApprovalRuleRow[];
};

type WorkflowRow = {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  transitionMode: "FREE" | "STRICT";
  statuses?: WorkflowStatusRow[];
  transitions?: WorkflowTransitionRow[];
};

export function mapProjectWorkflowStatus(status: WorkflowStatusRow) {
  return {
    id: status.id,
    name: status.name,
    key: status.key,
    description: status.description,
    sortOrder: status.sortOrder,
    category: status.category,
    color: status.color,
    isInitial: status.isInitial,
    isFinal: status.isFinal,
  };
}

export function mapProjectApprovalRule(rule: WorkflowApprovalRuleRow) {
  return {
    id: rule.id,
    approverType: rule.approverType,
    projectRoleId: rule.projectRoleId,
    taskRole: rule.taskRole,
    minApprovals: rule.minApprovals,
    onRejectStatusId: rule.onRejectStatusId,
  };
}

export function mapProjectWorkflowTransition(transition: WorkflowTransitionRow) {
  return {
    id: transition.id,
    fromStatusId: transition.fromStatusId,
    toStatusId: transition.toStatusId,
    name: transition.name,
    isActive: transition.isActive,
    approvalRules: transition.approvalRules.map(mapProjectApprovalRule),
  };
}

export function mapProjectWorkflowSummary(workflow: WorkflowRow) {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    isDefault: workflow.isDefault,
    isActive: workflow.isActive,
    transitionMode: workflow.transitionMode,
  };
}

export function mapProjectWorkflow(workflow: WorkflowRow) {
  return {
    ...mapProjectWorkflowSummary(workflow),
    statuses: (workflow.statuses ?? []).map(mapProjectWorkflowStatus),
    transitions: (workflow.transitions ?? []).map(mapProjectWorkflowTransition),
  };
}

export function mapWorkflowConfig(input: {
  canConfigure: boolean;
  projectRoles: WorkflowRoleRow[];
  taskTypes: WorkflowTaskTypeRow[];
  workflows: WorkflowRow[];
}) {
  return {
    canConfigure: input.canConfigure,
    projectRoles: input.projectRoles.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      sortOrder: role.sortOrder,
    })),
    taskTypes: input.taskTypes.map((taskType) => ({
      id: taskType.id,
      key: taskType.key,
      name: taskType.name,
      description: taskType.description,
      sortOrder: taskType.sortOrder,
      isActive: taskType.isActive,
      workflowId: taskType.workflowId,
    })),
    workflows: input.workflows.map((workflow) => mapProjectWorkflow(workflow)),
  };
}

type TaskStatusRow = {
  id: number;
  name: string;
  key: string;
  color: string | null;
  category: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
};

type TaskUserRow = {
  fullName: string;
  profile: { avatarKey: string | null } | null;
};

type TaskAssigneeRow = {
  userId: number;
  user: TaskUserRow;
  projectRole: {
    id: number;
    key: string;
    name: string;
    sortOrder: number;
  } | null;
};

type TaskMemberRow = TaskAssigneeRow & {
  taskRole: "ASSIGNEE" | "REVIEWER" | "REPORTER";
};

function formatDateOnly(value: Date | null) {
  if (!value) return null;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapAvatarUrl(
  user: TaskUserRow,
  avatarUrls: Map<string, string>,
) {
  const key = user.profile?.avatarKey;
  if (!key) return null;
  return avatarUrls.get(key) ?? null;
}

function mapTaskStatus(status: TaskStatusRow) {
  return {
    id: status.id,
    name: status.name,
    key: status.key,
    color: status.color,
    category: status.category,
  };
}

function mapAssignees(
  members: TaskAssigneeRow[],
  avatarUrls: Map<string, string>,
) {
  return members
    .flatMap((member) => {
      if (!member.projectRole) return [];
      return [
        {
          userId: member.userId,
          fullName: member.user.fullName,
          avatarUrl: mapAvatarUrl(member.user, avatarUrls),
          projectRole: {
            id: member.projectRole.id,
            key: member.projectRole.key,
            name: member.projectRole.name,
          },
          sortOrder: member.projectRole.sortOrder,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.projectRole.id - right.projectRole.id,
    )
    .map(({ sortOrder: _sortOrder, ...assignee }) => assignee);
}

function mapTaskPerson(member: TaskMemberRow, avatarUrls: Map<string, string>) {
  return {
    userId: member.userId,
    fullName: member.user.fullName,
    avatarUrl: mapAvatarUrl(member.user, avatarUrls),
  };
}

export function mapProjectTaskListItem(
  task: {
    id: number;
    code: string;
    title: string;
    taskType: { id: number; name: string; key: string } | null;
    workflow: { id: number; name: string };
    status: TaskStatusRow;
    members: TaskAssigneeRow[];
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    startDate: Date | null;
    dueDate: Date | null;
    createdAt: Date;
    estimatedMinutes: number | null;
  },
  avatarUrls: Map<string, string>,
) {
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    taskType: task.taskType,
    workflow: task.workflow,
    status: mapTaskStatus(task.status),
    assignees: mapAssignees(task.members, avatarUrls),
    priority: task.priority,
    startDate: formatDateOnly(task.startDate),
    dueDate: formatDateOnly(task.dueDate),
    createdAt: task.createdAt,
    estimatedMinutes: task.estimatedMinutes,
  };
}

function selectableTaskStatuses(task: {
  statusId: number;
  workflow: {
    transitionMode: "FREE" | "STRICT";
    statuses: TaskStatusRow[];
    transitions: { fromStatusId: number; toStatusId: number }[];
  };
}) {
  const statuses = task.workflow.statuses.map(mapTaskStatus);
  if (task.workflow.transitionMode === "FREE") return statuses;

  const allowed = new Set<number>([task.statusId]);
  for (const transition of task.workflow.transitions) {
    if (transition.fromStatusId === task.statusId) {
      allowed.add(transition.toStatusId);
    }
  }
  return statuses.filter((status) => allowed.has(status.id));
}

export function mapProjectTaskDetail(
  task: {
    id: number;
    code: string;
    title: string;
    description: string | null;
    workflowId: number;
    taskTypeId: number | null;
    statusId: number;
    taskType: { id: number; name: string; key: string } | null;
    workflow: {
      id: number;
      name: string;
      transitionMode: "FREE" | "STRICT";
      statuses: TaskStatusRow[];
      transitions: { fromStatusId: number; toStatusId: number }[];
    };
    status: TaskStatusRow;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    startDate: Date | null;
    dueDate: Date | null;
    estimatedMinutes: number | null;
    phaseId: number | null;
    members: TaskMemberRow[];
    createdAt: Date;
    updatedAt: Date;
  },
  avatarUrls: Map<string, string>,
  access: {
    canEdit: boolean;
    canChangeStatus: boolean;
    approvalActions?: Array<{ toStatusId: number; rejectStatusId: number }>;
    blockedStatusIds?: number[];
  },
) {
  const approvalActions = access.approvalActions ?? [];
  const blocked = new Set(access.blockedStatusIds ?? []);
  const statusById = new Map(
    task.workflow.statuses.map((status) => [status.id, status]),
  );
  const assignees = mapAssignees(
    task.members.filter((member) => member.taskRole === "ASSIGNEE"),
    avatarUrls,
  );
  const reporter = task.members.find((member) => member.taskRole === "REPORTER");
  const reviewers = task.members
    .filter((member) => member.taskRole === "REVIEWER")
    .map((member) => mapTaskPerson(member, avatarUrls));

  return {
    id: task.id,
    code: task.code,
    title: task.title,
    description: task.description,
    workflowId: task.workflowId,
    taskTypeId: task.taskTypeId,
    statusId: task.statusId,
    taskType: task.taskType,
    workflow: { id: task.workflow.id, name: task.workflow.name },
    status: mapTaskStatus(task.status),
    // Bước chuyển cần duyệt mà người xem không đủ tư cách thì không đưa vào danh sách chọn.
    statusOptions: selectableTaskStatuses(task).filter(
      (status) => status.id === task.statusId || !blocked.has(status.id),
    ),
    // Các bước duyệt mà người xem là người duyệt (duyệt = chuyển sang toStatus; từ chối = về rejectStatus).
    approvalActions: approvalActions.flatMap((action) => {
      const toStatus = statusById.get(action.toStatusId);
      const rejectStatus = statusById.get(action.rejectStatusId);
      if (!toStatus || !rejectStatus) return [];
      return [
        {
          toStatus: mapTaskStatus(toStatus),
          rejectStatus: mapTaskStatus(rejectStatus),
        },
      ];
    }),
    priority: task.priority,
    startDate: formatDateOnly(task.startDate),
    dueDate: formatDateOnly(task.dueDate),
    estimatedMinutes: task.estimatedMinutes,
    phaseId: task.phaseId,
    assignees,
    reporter: reporter ? mapTaskPerson(reporter, avatarUrls) : null,
    reviewers,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    canEdit: access.canEdit,
    canChangeStatus: access.canChangeStatus || approvalActions.length > 0,
  };
}

type DependencyTaskRow = {
  id: number;
  code: string;
  title: string;
  status: TaskStatusRow;
};

type DependencyFieldsRow = {
  id: number;
  relationshipType: "FS" | "SS" | "FF" | "SF";
  lag: { toNumber(): number };
  lagUnit: "DAY" | "HOUR";
};

function mapDependencyTask(task: DependencyTaskRow) {
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    status: mapTaskStatus(task.status),
  };
}

function mapDependencyFields(dependency: DependencyFieldsRow) {
  return {
    id: dependency.id,
    relationshipType: dependency.relationshipType,
    lag: dependency.lag.toNumber(),
    lagUnit: dependency.lagUnit,
  };
}

export function mapDependencyGroup(group: {
  id: number;
  taskId: number;
  logicType: "AND" | "OR";
  selectionMode: "MANUAL" | "AUTO";
  selectedDependencyId: number | null;
  dependencies: Array<DependencyFieldsRow & { predecessor: DependencyTaskRow }>;
}) {
  return {
    id: group.id,
    taskId: group.taskId,
    logicType: group.logicType,
    selectionMode: group.selectionMode,
    selectedDependencyId: group.selectedDependencyId,
    dependencies: group.dependencies.map((dependency) => ({
      ...mapDependencyFields(dependency),
      predecessor: mapDependencyTask(dependency.predecessor),
    })),
  };
}

export function mapTaskDependencies(data: {
  canEdit: boolean;
  groups: Parameters<typeof mapDependencyGroup>[0][];
  successors: Array<DependencyFieldsRow & { successor: DependencyTaskRow }>;
}) {
  return {
    canEdit: data.canEdit,
    groups: data.groups.map(mapDependencyGroup),
    successors: data.successors.map((dependency) => ({
      ...mapDependencyFields(dependency),
      successor: mapDependencyTask(dependency.successor),
    })),
  };
}
