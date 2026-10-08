import { getFileUrl } from "@/modules/file/file.service";
import {
  groupMemberAssignments,
  mapInviteCandidate,
  mapProjectMember,
  mapProjectRole,
  sortProjectRoles,
  type GroupedProjectMember,
  type InviteCandidateRecord,
  type ProjectRoleRecord,
} from "@/modules/project/project.mapper";
import * as projectRepository from "@/modules/project/project.repository";
import type {
  AddProjectMemberInput,
  MemberCandidateQuery,
  ProjectMemberListQuery,
  UpdateProjectMemberRolesInput,
} from "@/modules/project/project.schema";
import { AppError } from "@/shared/errors/app-error";

const PROJECT_MANAGER_KEY = "PROJECT_MANAGER";
const AVATAR_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

async function avatarUrlMap(keys: Array<string | null>) {
  const uniqueKeys = [
    ...new Set(keys.filter((key): key is string => Boolean(key))),
  ];
  const entries = await Promise.all(
    uniqueKeys.map(
      async (key) =>
        [key, await getFileUrl(key, AVATAR_URL_TTL_SECONDS)] as const,
    ),
  );
  return new Map(entries);
}

function avatarUrlFor(
  urls: Map<string, string>,
  avatarKey: string | null,
) {
  if (!avatarKey) return null;
  return urls.get(avatarKey) ?? null;
}

async function loadProjectMembers(projectId: number, actorId: number) {
  const project = await projectRepository.findAccessibleProject(
    projectId,
    actorId,
  );
  if (!project) {
    throw new AppError(404, "Không tìm thấy dự án");
  }

  const [roles, rows] = await Promise.all([
    projectRepository.listProjectRoles(projectId),
    projectRepository.listMemberAssignments(projectId),
  ]);

  return {
    roles: sortProjectRoles(roles),
    members: groupMemberAssignments(rows),
  };
}

function assertCanManage(members: GroupedProjectMember[], actorId: number) {
  const actor = members.find((member) => member.userId === actorId);
  const canManage = Boolean(
    actor?.roles.some((role) => role.key === PROJECT_MANAGER_KEY),
  );
  if (!canManage) {
    throw new AppError(403, "Bạn không có quyền quản lý thành viên");
  }
}

function pickRoles(roles: ProjectRoleRecord[], roleIds: number[]) {
  const uniqueIds = [...new Set(roleIds)];
  const selected = uniqueIds.map((roleId) =>
    roles.find((role) => role.id === roleId),
  );
  if (selected.some((role) => !role)) {
    throw new AppError(400, "Vai trò không thuộc dự án này");
  }
  return selected as ProjectRoleRecord[];
}

function assertManagerRemains(
  members: GroupedProjectMember[],
  targetUserId: number,
  nextRoles: ProjectRoleRecord[] | null,
) {
  const managerIds = members
    .filter((member) =>
      member.roles.some((role) => role.key === PROJECT_MANAGER_KEY),
    )
    .map((member) => member.userId);
  const targetIsManager = managerIds.includes(targetUserId);
  const keepsManager =
    nextRoles?.some((role) => role.key === PROJECT_MANAGER_KEY) ?? false;

  if (targetIsManager && !keepsManager && managerIds.length <= 1) {
    throw new AppError(400, "Dự án phải còn ít nhất một Quản trị");
  }
}

async function mapMemberById(
  projectId: number,
  memberUserId: number,
  actorId: number,
) {
  const rows = await projectRepository.listMemberAssignments(projectId);
  const member = groupMemberAssignments(rows).find(
    (item) => item.userId === memberUserId,
  );
  if (!member) {
    throw new AppError(500, "Không đọc lại được thành viên");
  }

  const urls = await avatarUrlMap([member.avatarKey]);
  return mapProjectMember(
    member,
    actorId,
    avatarUrlFor(urls, member.avatarKey),
  );
}

export async function getProjectMembers(
  projectId: number,
  actorId: number,
  query: ProjectMemberListQuery,
) {
  const { roles, members } = await loadProjectMembers(projectId, actorId);
  const urls = await avatarUrlMap(members.map((member) => member.avatarKey));
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const actor = members.find((member) => member.userId === actorId);

  const filtered = members
    .filter((member) => {
      const matchesKeyword =
        keyword.length === 0 ||
        member.fullName.toLowerCase().includes(keyword) ||
        member.email.toLowerCase().includes(keyword);
      const matchesRole =
        query.roleId == null ||
        member.roles.some((role) => role.id === query.roleId);
      return matchesKeyword && matchesRole;
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"));

  return {
    total: members.length,
    canManage: Boolean(
      actor?.roles.some((role) => role.key === PROJECT_MANAGER_KEY),
    ),
    myRoles: (actor?.roles ?? []).map(mapProjectRole),
    roles: roles.map(mapProjectRole),
    members: filtered.map((member) =>
      mapProjectMember(
        member,
        actorId,
        avatarUrlFor(urls, member.avatarKey),
      ),
    ),
  };
}

export async function searchMemberCandidates(
  projectId: number,
  actorId: number,
  query: MemberCandidateQuery,
) {
  const { members } = await loadProjectMembers(projectId, actorId);
  assertCanManage(members, actorId);

  const candidates = await projectRepository.searchInviteCandidates(
    projectId,
    query.keyword.trim(),
  );
  const urls = await avatarUrlMap(
    candidates.map((candidate: InviteCandidateRecord) => candidate.avatarKey),
  );

  return candidates.map((candidate: InviteCandidateRecord) =>
    mapInviteCandidate(
      candidate,
      avatarUrlFor(urls, candidate.avatarKey),
    ),
  );
}

export async function addProjectMember(
  projectId: number,
  actorId: number,
  input: AddProjectMemberInput,
) {
  const { roles, members } = await loadProjectMembers(projectId, actorId);
  assertCanManage(members, actorId);

  const selectedRoles = pickRoles(roles, input.roleIds);
  if (members.some((member) => member.userId === input.userId)) {
    throw new AppError(400, "Người này đã ở trong dự án");
  }

  const user = await projectRepository.findUserForInvite(input.userId);
  if (!user) {
    throw new AppError(404, "Không tìm thấy người dùng");
  }
  if (user.status !== "ACTIVE") {
    throw new AppError(400, "Người dùng không hoạt động");
  }

  await projectRepository.addMemberAssignments({
    projectId,
    userId: input.userId,
    roleIds: selectedRoles.map((role) => role.id),
    joinedAt: new Date(),
  });

  return mapMemberById(projectId, input.userId, actorId);
}

export async function updateProjectMemberRoles(
  projectId: number,
  actorId: number,
  memberUserId: number,
  input: UpdateProjectMemberRolesInput,
) {
  const { roles, members } = await loadProjectMembers(projectId, actorId);
  assertCanManage(members, actorId);

  const target = members.find((member) => member.userId === memberUserId);
  if (!target) {
    throw new AppError(404, "Thành viên không tồn tại");
  }

  const selectedRoles = pickRoles(roles, input.roleIds);
  assertManagerRemains(members, memberUserId, selectedRoles);

  await projectRepository.replaceMemberAssignments({
    projectId,
    userId: memberUserId,
    roleIds: selectedRoles.map((role) => role.id),
    joinedAt: target.joinedAt,
  });

  return mapMemberById(projectId, memberUserId, actorId);
}

export async function removeProjectMember(
  projectId: number,
  actorId: number,
  memberUserId: number,
) {
  const { members } = await loadProjectMembers(projectId, actorId);
  assertCanManage(members, actorId);

  const target = members.find((member) => member.userId === memberUserId);
  if (!target) {
    throw new AppError(404, "Thành viên không tồn tại");
  }

  assertManagerRemains(members, memberUserId, null);
  await projectRepository.removeMemberAssignments(projectId, memberUserId);
}
