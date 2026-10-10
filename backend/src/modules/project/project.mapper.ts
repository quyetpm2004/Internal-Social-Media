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

export function mapProjectList(projects: any) {
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
