import * as projectRepository from "@/modules/project/project.repository";
import prisma from "@/shared/utils/prisma";
import { AppError } from "@/shared/errors/app-error";
import {
  CreateProjectSchema,
  GetProjectListSchema,
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

export async function createProjectFromTemplate(
  input: CreateProjectSchema,
  userId: number,
) {
  const template = await projectRepository.findTemplateForClone(
    input.templateId,
  );
  if (!template) {
    throw new AppError(404, "Template not found");
  }

  const projectId = await prisma.$transaction(
    (tx) =>
      projectRepository.createProjectFromTemplate(tx, input, userId, template),
    { timeout: 20000 },
  );

  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
  return mapProjectDetail(project, userId);
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
      skip,
      take: limit,
    }),
    projectRepository.countVisibleProjects(userId, query.keyword),
  ]);

  return {
    projects: mapProjectList(projects),
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
  return mapProjectDetail(project, userId);
}

export async function updateProject(
  id: number,
  userId: number,
  input: UpdateProjectSchema,
) {
  const project = await projectRepository.findProjectOwner(id);
  if (!project) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
  if (project.createdById !== userId) {
    throw new AppError(403, "Bạn không có quyền sửa dự án");
  }

  await projectRepository.updateProject(id, input, userId);

  const updated = await projectRepository.findProjectById(id);
  if (!updated) {
    throw new AppError(404, "Không tìm thấy dự án");
  }
  return mapProjectDetail(updated, userId);
}
