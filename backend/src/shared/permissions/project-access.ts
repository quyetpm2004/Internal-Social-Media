import { ProjectVisibility, Role } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import {
  FORBIDDEN_MESSAGE,
  getPermissionScope,
  type PermissionActor,
} from "./permission.service";

export const PROJECT_MANAGER_ROLE_KEY = "PROJECT_MANAGER";

export interface ProjectAccess {
  projectId: number;
  departmentId: number | null;
  visibility: ProjectVisibility;
  canView: boolean;
  isMember: boolean;
  isProjectManager: boolean;
  canReassignManager: boolean;
}

export async function resolveProjectAccess(
  projectId: number,
  actor: PermissionActor,
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      visibility: true,
      departmentId: true,
      members: {
        where: { userId: actor.id },
        select: { projectRole: { select: { key: true } } },
      },
    },
  });
  if (!project) return null;

  const base = {
    projectId: project.id,
    departmentId: project.departmentId,
    visibility: project.visibility,
  };

  if (actor.role === Role.ADMIN) {
    return {
      ...base,
      canView: false,
      isMember: false,
      isProjectManager: false,
      canReassignManager: false,
    };
  }

  const isMember = project.members.length > 0;
  const isProjectManager = project.members.some(
    (member) => member.projectRole.key === PROJECT_MANAGER_ROLE_KEY,
  );

  const inScope = (
    permission: "project.view_private" | "project.reassign_manager",
  ) => {
    const scope = getPermissionScope(actor.role, permission);
    if (scope === "ALL") return true;
    return (
      scope === "OWN" &&
      actor.departmentId !== null &&
      actor.departmentId === project.departmentId
    );
  };

  const canViewPublic =
    project.visibility === ProjectVisibility.PUBLIC &&
    getPermissionScope(actor.role, "project.view_public") !== null;

  return {
    ...base,
    isMember,
    isProjectManager,
    canView: isMember || canViewPublic || inScope("project.view_private"),
    canReassignManager: inScope("project.reassign_manager"),
  };
}

async function requireAccess(projectId: number, actor: PermissionActor) {
  const access = await resolveProjectAccess(projectId, actor);
  if (!access || !access.canView) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
  return access;
}

export async function assertProjectView(
  projectId: number,
  actor: PermissionActor,
) {
  return requireAccess(projectId, actor);
}

export async function assertProjectMember(
  projectId: number,
  actor: PermissionActor,
) {
  const access = await requireAccess(projectId, actor);
  if (!access.isMember) {
    throw new AppError(403, FORBIDDEN_MESSAGE);
  }
  return access;
}

export async function assertProjectManager(
  projectId: number,
  actor: PermissionActor,
  message = FORBIDDEN_MESSAGE,
) {
  const access = await requireAccess(projectId, actor);
  if (!access.isProjectManager) {
    throw new AppError(403, message);
  }
  return access;
}
