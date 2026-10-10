import { getFileUrl } from "@/modules/file/file.service";
import { AppError } from "@/shared/errors/app-error";
import {
  AddProjectMemberInput,
  MemberCandidateQuery,
  ProjectMemberListQuery,
  UpdateProjectMemberRolesInput,
} from "../project.schema";
import * as projectRepository from "../project.repository";
import * as projectMapper from "../project.mapper";

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

export async function getProjectMembers(
  projectId: number,
  userId: number,
  query: ProjectMemberListQuery,
) {
  const { page, limit, keyword, roleId } = query;
  const [projectMember, projectRoles, projectMyRoles, canManage] =
    await Promise.all([
      projectRepository.getProjectMembers(
        projectId,
        userId,
        keyword,
        roleId,
        page,
        limit,
      ),
      projectRepository.getProjectRoles(projectId),
      projectRepository.getProjectMyRoles(projectId, userId),
      projectRepository.canManageMembers(projectId, userId),
    ]);
  const avatarUrls = await avatarUrlMap(
    projectMember.members.map((member) => member.avatarKey),
  );

  return {
    total: projectMember.total,
    members: projectMapper.mapProjectMembers(
      projectMember.members,
      userId,
      avatarUrls,
    ),
    roles: projectMapper.mapProjectRoles(projectRoles),
    myRoles: projectMapper.mapProjectRoles(projectMyRoles),
    canManage,
  };
}

async function assertCanManage(projectId: number, userId: number) {
  const canManage = await projectRepository.canManageMembers(projectId, userId);
  if (!canManage) {
    throw new AppError(403, "Bạn không có quyền quản lý thành viên");
  }
}

function assertManagerRemains(
  managerIds: number[],
  targetUserId: number,
  nextRoleKeys: string[],
) {
  const targetIsManager = managerIds.includes(targetUserId);
  const keepsManager = nextRoleKeys.includes("PROJECT_MANAGER");
  if (targetIsManager && !keepsManager && managerIds.length <= 1) {
    throw new AppError(400, "Dự án phải còn ít nhất một Quản trị");
  }
}

async function mapMember(
  projectId: number,
  actorId: number,
  memberUserId: number,
) {
  const member = await projectRepository.getProjectMember(
    projectId,
    memberUserId,
  );
  if (!member) {
    throw new AppError(500, "Không đọc lại được thành viên");
  }
  const avatarUrls = await avatarUrlMap([member.avatarKey]);
  return projectMapper.mapProjectMembers([member], actorId, avatarUrls)[0];
}

export async function addProjectMember(
  projectId: number,
  userId: number,
  input: AddProjectMemberInput,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  await assertCanManage(projectId, userId);

  const roleIds = [...new Set(input.roleIds)];
  const roles = await projectRepository.getProjectRolesByIds(projectId, roleIds);
  if (roles.length !== roleIds.length) {
    throw new AppError(400, "Vai trò không thuộc dự án này");
  }

  const existing = await projectRepository.getProjectMember(
    projectId,
    input.userId,
  );
  if (existing) {
    throw new AppError(400, "Người này đã ở trong dự án");
  }

  const user = await projectRepository.getUserForInvite(input.userId);
  if (!user) {
    throw new AppError(404, "Không tìm thấy người dùng");
  }
  if (user.status !== "ACTIVE") {
    throw new AppError(400, "Người dùng không hoạt động");
  }

  await projectRepository.addProjectMember(projectId, input.userId, roleIds);
  return mapMember(projectId, userId, input.userId);
}

export async function updateProjectMemberRoles(
  projectId: number,
  userId: number,
  memberUserId: number,
  input: UpdateProjectMemberRolesInput,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  await assertCanManage(projectId, userId);

  const member = await projectRepository.getProjectMember(
    projectId,
    memberUserId,
  );
  if (!member) {
    throw new AppError(404, "Thành viên không tồn tại");
  }

  const roleIds = [...new Set(input.roleIds)];
  const roles = await projectRepository.getProjectRolesByIds(projectId, roleIds);
  if (roles.length !== roleIds.length) {
    throw new AppError(400, "Vai trò không thuộc dự án này");
  }

  const managerIds = await projectRepository.getProjectManagerUserIds(projectId);
  assertManagerRemains(
    managerIds,
    memberUserId,
    roles.map((role) => role.key),
  );

  await projectRepository.updateProjectMemberRoles(
    projectId,
    memberUserId,
    roleIds,
    member.joinedAt,
  );
  return mapMember(projectId, userId, memberUserId);
}

export async function removeProjectMember(
  projectId: number,
  userId: number,
  memberUserId: number,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  await assertCanManage(projectId, userId);

  const member = await projectRepository.getProjectMember(
    projectId,
    memberUserId,
  );
  if (!member) {
    throw new AppError(404, "Thành viên không tồn tại");
  }

  const managerIds = await projectRepository.getProjectManagerUserIds(projectId);
  assertManagerRemains(managerIds, memberUserId, []);

  await projectRepository.removeProjectMember(projectId, memberUserId);
}

export async function searchMemberCandidates(
  projectId: number,
  userId: number,
  query: MemberCandidateQuery,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  await assertCanManage(projectId, userId);

  const candidates = await projectRepository.searchMemberCandidates(
    projectId,
    query.keyword,
  );
  const avatarUrls = await avatarUrlMap(
    candidates.map((candidate) => candidate.avatarKey),
  );
  return projectMapper.mapMemberCandidates(candidates, avatarUrls);
}
