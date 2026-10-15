import { Request, Response } from "express";
import * as projectService from "@/modules/project/services/project.service";
import * as projectMemberService from "@/modules/project/services/project-member.service";
import * as projectTaskService from "@/modules/project/services/project-task.service";
import * as projectWorkflowService from "@/modules/project/services/project-workflow.service";
import { AppError } from "@/shared/errors/app-error";

function requireUserId(req: Request) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Bạn chưa đăng nhập");
  }
  return userId;
}

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

export async function getProjectWorkflows(req: Request, res: Response) {
  const data = await projectWorkflowService.getProjectWorkflows(
    Number(req.params.id),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Lấy quy trình dự án thành công",
    data,
  });
}

export async function createProjectWorkflow(req: Request, res: Response) {
  const data = await projectWorkflowService.createWorkflow(
    Number(req.params.id),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Tạo quy trình thành công",
    data,
  });
}

export async function updateProjectWorkflow(req: Request, res: Response) {
  const data = await projectWorkflowService.updateWorkflow(
    Number(req.params.id),
    Number(req.params.workflowId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật quy trình thành công",
    data,
  });
}

export async function deleteProjectWorkflow(req: Request, res: Response) {
  const data = await projectWorkflowService.deleteWorkflow(
    Number(req.params.id),
    Number(req.params.workflowId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Xóa quy trình thành công",
    data,
  });
}

export async function createProjectWorkflowStatus(req: Request, res: Response) {
  const data = await projectWorkflowService.createStatus(
    Number(req.params.id),
    Number(req.params.workflowId),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Tạo trạng thái thành công",
    data,
  });
}

export async function updateProjectWorkflowStatus(req: Request, res: Response) {
  const data = await projectWorkflowService.updateStatus(
    Number(req.params.id),
    Number(req.params.workflowId),
    Number(req.params.statusId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật trạng thái thành công",
    data,
  });
}

export async function deleteProjectWorkflowStatus(req: Request, res: Response) {
  const data = await projectWorkflowService.deleteStatus(
    Number(req.params.id),
    Number(req.params.workflowId),
    Number(req.params.statusId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Xóa trạng thái thành công",
    data,
  });
}

export async function reorderProjectWorkflowStatuses(
  req: Request,
  res: Response,
) {
  const data = await projectWorkflowService.reorderStatuses(
    Number(req.params.id),
    Number(req.params.workflowId),
    requireUserId(req),
    req.validated.statusIds,
  );
  res.status(200).json({
    message: "Sắp xếp trạng thái thành công",
    data,
  });
}

export async function createProjectWorkflowTransition(
  req: Request,
  res: Response,
) {
  const data = await projectWorkflowService.createTransition(
    Number(req.params.id),
    Number(req.params.workflowId),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Tạo đường đi thành công",
    data,
  });
}

export async function updateProjectWorkflowTransition(
  req: Request,
  res: Response,
) {
  const data = await projectWorkflowService.updateTransition(
    Number(req.params.id),
    Number(req.params.workflowId),
    Number(req.params.transitionId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật đường đi thành công",
    data,
  });
}

export async function deleteProjectWorkflowTransition(
  req: Request,
  res: Response,
) {
  const data = await projectWorkflowService.deleteTransition(
    Number(req.params.id),
    Number(req.params.workflowId),
    Number(req.params.transitionId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Xóa đường đi thành công",
    data,
  });
}

export async function createProjectApprovalRule(req: Request, res: Response) {
  const data = await projectWorkflowService.createApprovalRule(
    Number(req.params.id),
    Number(req.params.workflowId),
    Number(req.params.transitionId),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Tạo quy tắc duyệt thành công",
    data,
  });
}

export async function updateProjectApprovalRule(req: Request, res: Response) {
  const data = await projectWorkflowService.updateApprovalRule(
    Number(req.params.id),
    Number(req.params.workflowId),
    Number(req.params.transitionId),
    Number(req.params.ruleId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật quy tắc duyệt thành công",
    data,
  });
}

export async function createProjectRole(req: Request, res: Response) {
  const data = await projectMemberService.createProjectRole(
    Number(req.params.id),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Tạo vai trò thành công",
    data,
  });
}

export async function updateProjectRole(req: Request, res: Response) {
  const data = await projectMemberService.updateProjectRole(
    Number(req.params.id),
    Number(req.params.roleId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật vai trò thành công",
    data,
  });
}

export async function deleteProjectRole(req: Request, res: Response) {
  const data = await projectMemberService.deleteProjectRole(
    Number(req.params.id),
    Number(req.params.roleId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Xóa vai trò thành công",
    data,
  });
}

export async function createProjectTaskType(req: Request, res: Response) {
  const data = await projectWorkflowService.createTaskType(
    Number(req.params.id),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Tạo loại công việc thành công",
    data,
  });
}

export async function updateProjectTaskType(req: Request, res: Response) {
  const data = await projectWorkflowService.updateTaskType(
    Number(req.params.id),
    Number(req.params.taskTypeId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật loại công việc thành công",
    data,
  });
}

export async function deleteProjectTaskType(req: Request, res: Response) {
  const data = await projectWorkflowService.deleteTaskType(
    Number(req.params.id),
    Number(req.params.taskTypeId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Xóa loại công việc thành công",
    data,
  });
}

export async function getProjectTasks(req: Request, res: Response) {
  const data = await projectTaskService.getProjectTasks(
    Number(req.params.id),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Lấy danh sách công việc thành công",
    data,
  });
}

export async function createProjectTask(req: Request, res: Response) {
  const data = await projectTaskService.createProjectTask(
    Number(req.params.id),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Tạo công việc thành công",
    data,
  });
}

export async function getProjectTask(req: Request, res: Response) {
  const data = await projectTaskService.getProjectTask(
    Number(req.params.id),
    Number(req.params.taskId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Lấy chi tiết công việc thành công",
    data,
  });
}

export async function updateProjectTask(req: Request, res: Response) {
  const data = await projectTaskService.updateProjectTask(
    Number(req.params.id),
    Number(req.params.taskId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Cập nhật công việc thành công",
    data,
  });
}

export async function updateProjectTaskStatus(req: Request, res: Response) {
  const data = await projectTaskService.updateProjectTaskStatus(
    Number(req.params.id),
    Number(req.params.taskId),
    requireUserId(req),
    req.validated,
  );
  res.status(200).json({
    message: "Đã chuyển trạng thái",
    data,
  });
}

export async function getProjectTaskComments(req: Request, res: Response) {
  const data = await projectTaskService.listTaskComments(
    Number(req.params.id),
    Number(req.params.taskId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Lấy bình luận công việc thành công",
    data,
  });
}

export async function createProjectTaskComment(req: Request, res: Response) {
  const data = await projectTaskService.createTaskComment(
    Number(req.params.id),
    Number(req.params.taskId),
    requireUserId(req),
    req.validated,
  );
  res.status(201).json({
    message: "Đã thêm bình luận",
    data,
  });
}

export async function deleteProjectTask(req: Request, res: Response) {
  const data = await projectTaskService.deleteProjectTask(
    Number(req.params.id),
    Number(req.params.taskId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Xóa công việc thành công",
    data,
  });
}

export async function deleteProjectApprovalRule(req: Request, res: Response) {
  const data = await projectWorkflowService.deleteApprovalRule(
    Number(req.params.id),
    Number(req.params.workflowId),
    Number(req.params.transitionId),
    Number(req.params.ruleId),
    requireUserId(req),
  );
  res.status(200).json({
    message: "Xóa quy tắc duyệt thành công",
    data,
  });
}
