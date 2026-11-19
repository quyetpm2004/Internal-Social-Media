import * as projectRepository from "@/modules/project/project.repository";
import prisma from "@/shared/utils/prisma";
import { Role, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import {
  assertCan,
  assertProjectManager,
  getPermissionScope,
  loadActor,
  resolveProjectAccess,
  type PermissionActor,
} from "@/shared/permissions";
import {
  CreateProjectSchema,
  GetProjectListSchema,
  ReassignProjectManagerInput,
  UpdateProjectSchema,
} from "@/modules/project/project.schema";
import {
  mapProjectDetail,
  mapProjectList,
} from "@/modules/project/project.mapper";

export async function getTemplateOptions() {
  const templates = await projectRepository.getTemplateOptions();
  return templates || [];
}

/**
 * Chỉ Giám đốc và Manager tạo dự án (route đã chặn bằng project.create).
 * - Manager: dự án luôn thuộc phòng của mình.
 * - Giám đốc: chọn phòng ban hoặc để trống (liên phòng ban).
 * - Bắt buộc chọn PM; người tạo không tự thành thành viên trừ khi chọn chính mình.
 */
export async function createProjectFromTemplate(
  input: CreateProjectSchema,
  actor: PermissionActor,
) {
  assertCan(actor.role, "project.create");

  let departmentId: number | null;
  if (getPermissionScope(actor.role, "project.create") === "OWN") {
    if (actor.departmentId === null) {
      throw new AppError(403, "Bạn chưa thuộc phòng ban nào");
    }
    if (
      input.departmentId != null &&
      input.departmentId !== actor.departmentId
    ) {
      throw new AppError(403, "Chỉ được tạo dự án cho phòng ban của bạn");
    }
    departmentId = actor.departmentId;
  } else {
    departmentId = input.departmentId ?? null;
    if (
      departmentId !== null &&
      !(await projectRepository.findDepartmentExists(departmentId))
    ) {
      throw new AppError(404, "Phòng ban không tồn tại");
    }
  }

  await assertValidProjectManager(input.projectManagerId);

  const template = await projectRepository.findTemplateForClone(
    input.templateId,
  );
  if (!template) {
    throw new AppError(404, "Template not found");
  }

  const projectId = await prisma.$transaction(
    (tx) =>
      projectRepository.createProjectFromTemplate(
        tx,
        input,
        actor.id,
        template,
        { departmentId, projectManagerId: input.projectManagerId },
      ),
    { timeout: 15000 },
  );

  return loadProjectDetail(projectId, actor);
}

async function assertValidProjectManager(userId: number) {
  const user = await projectRepository.getUserForInvite(userId);
  if (!user) {
    throw new AppError(
      404,
      "Không tìm thấy người dùng được chọn làm quản trị dự án",
    );
  }
  if (user.status !== Status.ACTIVE) {
    throw new AppError(400, "Người dùng được chọn không hoạt động");
  }
  const target = await loadActor(userId);
  if (target.role === Role.ADMIN) {
    throw new AppError(
      400,
      "Không thể chọn quản trị hệ thống làm quản trị dự án",
    );
  }
}

async function loadProjectDetail(projectId: number, actor: PermissionActor) {
  const [project, access] = await Promise.all([
    projectRepository.findProjectById(projectId),
    resolveProjectAccess(projectId, actor),
  ]);
  if (!project || !access) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
  return mapProjectDetail(project, actor.id, {
    canEdit: access.isProjectManager,
    canReassignManager: access.canReassignManager,
    isMember: access.isMember,
  });
}

export async function getProjectList(
  userId: number,
  query: GetProjectListSchema,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    projectRepository.getProjectList({
      userId,
      keyword: query.keyword,
      membership: query.membership,
      skip,
      take: limit,
    }),
    projectRepository.countVisibleProjects(
      userId,
      query.keyword,
      query.membership,
    ),
  ]);

  return {
    projects: mapProjectList(projects, userId),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

export async function getProject(id: number, userId: number) {
  const project = await projectRepository.getProjectDetail(id, userId);
  if (!project) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
  return loadProjectDetail(id, await loadActor(userId));
}

/** Chỉ PM sửa thông tin dự án (trước đây là người tạo). */
export async function updateProject(
  id: number,
  userId: number,
  input: UpdateProjectSchema,
) {
  const actor = await loadActor(userId);
  await assertProjectManager(id, actor, "Bạn không có quyền sửa dự án");

  await projectRepository.updateProject(id, input, userId);
  return loadProjectDetail(id, actor);
}

/**
 * Chỉ định lại PM: ngoại lệ cho phép Giám đốc/Manager (không là thành viên) tác động vào dự án.
 * Giám đốc: mọi dự án. Manager: dự án thuộc phòng mình. Dự án luôn còn ít nhất một PM.
 */
export async function reassignProjectManager(
  projectId: number,
  userId: number,
  input: ReassignProjectManagerInput,
) {
  const actor = await loadActor(userId);
  const access = await resolveProjectAccess(projectId, actor);
  if (!access || !access.canView) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
  if (!access.canReassignManager) {
    throw new AppError(403, "Bạn không có quyền chỉ định lại quản trị dự án");
  }

  await assertValidProjectManager(input.userId);

  const fallbackRole =
    await projectRepository.findFallbackProjectRole(projectId);
  if (!fallbackRole) {
    throw new AppError(
      400,
      "Dự án chưa có vai trò nào khác để chuyển quản trị cũ sang",
    );
  }

  await projectRepository.reassignProjectManager(
    projectId,
    input.userId,
    fallbackRole.id,
  );
  return loadProjectDetail(projectId, actor);
}
