import { ProjectTemplate } from "@prisma/client";

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

export type ProjectRoleRecord = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type MemberAssignmentRecord = {
  userId: number;
  fullName: string;
  email: string;
  avatarKey: string | null;
  joinedAt: Date;
  role: ProjectRoleRecord;
};

export type InviteUserRecord = {
  id: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
};

export type InviteCandidateRecord = {
  id: number;
  fullName: string;
  email: string;
  avatarKey: string | null;
};

export type GroupedProjectMember = {
  userId: number;
  fullName: string;
  email: string;
  avatarKey: string | null;
  joinedAt: Date;
  roles: ProjectRoleRecord[];
};

export function sortProjectRoles(roles: ProjectRoleRecord[]) {
  return [...roles].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.name.localeCompare(right.name, "vi") ||
      left.id - right.id,
  );
}

export function mapProjectRole(role: ProjectRoleRecord) {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    sortOrder: role.sortOrder,
  };
}

export function groupMemberAssignments(rows: MemberAssignmentRecord[]) {
  const byUser = new Map<number, GroupedProjectMember>();

  for (const row of rows) {
    const current = byUser.get(row.userId);
    if (!current) {
      byUser.set(row.userId, {
        userId: row.userId,
        fullName: row.fullName,
        email: row.email,
        avatarKey: row.avatarKey,
        joinedAt: row.joinedAt,
        roles: [row.role],
      });
      continue;
    }

    if (row.joinedAt < current.joinedAt) {
      current.joinedAt = row.joinedAt;
    }
    if (!current.roles.some((role) => role.id === row.role.id)) {
      current.roles.push(row.role);
    }
  }

  return [...byUser.values()].map((member) => ({
    ...member,
    roles: sortProjectRoles(member.roles),
  }));
}

export function mapProjectMember(
  member: GroupedProjectMember,
  currentUserId: number,
  avatarUrl: string | null,
) {
  return {
    userId: member.userId,
    fullName: member.fullName,
    email: member.email,
    avatarUrl,
    isMe: member.userId === currentUserId,
    joinedAt: member.joinedAt,
    roles: member.roles.map(mapProjectRole),
  };
}

export function mapInviteCandidate(
  candidate: InviteCandidateRecord,
  avatarUrl: string | null,
) {
  return {
    id: candidate.id,
    fullName: candidate.fullName,
    email: candidate.email,
    avatarUrl,
  };
}
