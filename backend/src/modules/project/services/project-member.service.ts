import { Prisma } from "@prisma/client";
import { getFileUrl } from "@/modules/file/file.service";
import { AppError } from "@/shared/errors/app-error";
import {
  AddProjectMemberInput,
  CreateProjectRoleCatalogInput,
  MemberCandidateQuery,
  ProjectMemberListQuery,
  UpdateProjectMemberRolesInput,
  UpdateProjectRoleCatalogInput,
} from "../project.schema";
import * as projectRepository from "../project.repository";
import * as projectTaskRepository from "../project-task.repository";
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

function rethrowUnique(error: unknown, message: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(409, message);
  }
  throw error;
}

export async function createProjectRole(
  projectId: number,
  userId: number,
  input: CreateProjectRoleCatalogInput,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  await assertCanManage(projectId, userId);

  const existingKey = await projectRepository.findProjectRoleByKey(
    projectId,
    input.key,
  );
  if (existingKey) {
    throw new AppError(409, "Key vai trò đã tồn tại trong dự án");
  }

  const existingName = await projectRepository.findProjectRoleByName(
    projectId,
    input.name,
  );
  if (existingName) {
    throw new AppError(409, "Tên vai trò đã tồn tại trong dự án");
  }

  try {
    const role = await projectRepository.createProjectRole({
      projectId,
      key: input.key,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
    });
    return projectMapper.mapProjectRoles([role])[0];
  } catch (error) {
    rethrowUnique(error, "Key hoặc tên vai trò đã tồn tại");
  }
}

export async function updateProjectRole(
  projectId: number,
  roleId: number,
  userId: number,
  input: UpdateProjectRoleCatalogInput,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  await assertCanManage(projectId, userId);

  const role = await projectRepository.findProjectRole(projectId, roleId);
  if (!role) {
    throw new AppError(404, "Không tìm thấy vai trò dự án");
  }

  if (input.name) {
    const existingName = await projectRepository.findProjectRoleByName(
      projectId,
      input.name,
    );
    if (existingName && existingName.id !== roleId) {
      throw new AppError(409, "Tên vai trò đã tồn tại trong dự án");
    }
  }

  try {
    const updated = await projectRepository.updateProjectRole(roleId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    });
    return projectMapper.mapProjectRoles([updated])[0];
  } catch (error) {
    rethrowUnique(error, "Tên vai trò đã tồn tại trong dự án");
  }
}

export async function deleteProjectRole(
  projectId: number,
  roleId: number,
  userId: number,
) {
  await projectRepository.findVisibleProject(projectId, userId);
  await assertCanManage(projectId, userId);

  const role = await projectRepository.findProjectRole(projectId, roleId);
  if (!role) {
    throw new AppError(404, "Không tìm thấy vai trò dự án");
  }

  if (role.key === "PROJECT_MANAGER") {
    throw new AppError(400, "Không thể xóa vai trò Quản trị dự án");
  }

  const [memberCount, ruleCount] = await Promise.all([
    projectRepository.countMembersUsingRole(roleId),
    projectRepository.countApprovalRulesUsingRole(roleId),
  ]);
  if (memberCount > 0) {
    throw new AppError(400, "Không thể xóa vai trò đang được gán cho thành viên");
  }
  if (ruleCount > 0) {
    throw new AppError(
      400,
      "Không thể xóa vai trò đang được quy tắc duyệt sử dụng",
    );
  }

  const taskCount = await projectTaskRepository.countTasksUsingProjectRole(
    roleId,
  );
  if (taskCount > 0) {
    throw new AppError(400, "Đang có công việc sử dụng dữ liệu này");
  }

  try {
    await projectRepository.deleteProjectRole(roleId);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new AppError(400, "Đang có công việc sử dụng dữ liệu này");
    }
    throw error;
  }
  return true;
}
