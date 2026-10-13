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

export function mapProjectDetail(project: any, currentUserId: number) {
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
    canEdit: project.createdById === currentUserId,
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
