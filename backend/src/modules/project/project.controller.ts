import { Request, Response } from "express";
import * as projectService from "@/modules/project/services/project.service";
import * as projectMemberService from "@/modules/project/services/project-member.service";
import { AppError } from "@/shared/errors/app-error";

export async function getTemplateOptions(req: Request, res: Response) {
  const data = await projectService.getTemplateOptions();
  res.status(200).json({
    message: "Lấy danh sách template options thành công",
    data,
  });
}

export async function createProjectFromTemplate(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền tạo dự án");
  }
  const data = await projectService.createProjectFromTemplate(req.body, userId);
  res.status(200).json({
    message: "Tạo dự án từ template thành công",
    data,
  });
}

export async function getProjectList(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền xem danh sách dự án");
  }
  const data = await projectService.getProjectList(userId, req.validated);
  res.status(200).json({
    message: "Lấy danh sách dự án thành công",
    data,
  });
}

export async function getProject(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền xem dự án");
  }
  const data = await projectService.getProject(req.validated.id, userId);
  res.status(200).json({
    message: "Lấy chi tiết dự án thành công",
    data,
  });
}

export async function updateProject(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền sửa dự án");
  }
  const data = await projectService.updateProject(
    Number(req.params.id),
    userId,
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật dự án thành công",
    data,
  });
}

export async function getProjectMembers(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền xem thành viên dự án");
  }
  const data = await projectMemberService.getProjectMembers(
    Number(req.params.id),
    userId,
    req.validated,
  );
  res.status(200).json({
    message: "Lấy danh sách thành viên dự án thành công",
    data,
  });
}

export async function searchMemberCandidates(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền tìm thành viên");
  }
  const data = await projectMemberService.searchMemberCandidates(
    Number(req.params.id),
    userId,
    req.validated,
  );
  res.status(200).json({
    message: "Tìm người để mời thành công",
    data,
  });
}

export async function addProjectMember(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền mời thành viên");
  }
  const data = await projectMemberService.addProjectMember(
    Number(req.params.id),
    userId,
    req.validated,
  );
  res.status(200).json({
    message: "Mời thành viên thành công",
    data,
  });
}

export async function updateProjectMemberRoles(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền đổi vai trò thành viên");
  }
  const data = await projectMemberService.updateProjectMemberRoles(
    Number(req.params.id),
    userId,
    Number(req.params.userId),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật vai trò thành công",
    data,
  });
}

export async function removeProjectMember(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn không có quyền xóa thành viên");
  }
  await projectMemberService.removeProjectMember(
    Number(req.params.id),
    userId,
    Number(req.params.userId),
  );
  res.status(200).json({
    message: "Xóa thành viên thành công",
    data: null,
  });
}
