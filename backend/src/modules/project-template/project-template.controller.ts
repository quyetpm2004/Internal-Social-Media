import { Request, Response } from "express";
import type {
  CreateApprovalRuleInput,
  CreateProjectRoleInput,
  CreateStatusInput,
  CreateTaskTypeInput,
  CreateTemplateInput,
  CreateTransitionInput,
  CreateWorkflowInput,
  DuplicateTemplateInput,
  ListTemplatesQuery,
  UpdateApprovalRuleInput,
  UpdateProjectRoleInput,
  UpdateStatusInput,
  UpdateTaskTypeInput,
  UpdateTemplateInput,
  UpdateTransitionInput,
  UpdateWorkflowInput,
} from "@/modules/project-template/project-template.schema";
import * as approvalRuleService from "@/modules/project-template/services/approval-rule.service";
import * as projectRoleService from "@/modules/project-template/services/project-role.service";
import * as taskTypeService from "@/modules/project-template/services/task-type.service";
import * as templateService from "@/modules/project-template/services/template.service";
import * as workflowService from "@/modules/project-template/services/workflow.service";

export async function listTemplates(req: Request, res: Response) {
  const query = req.validated as ListTemplatesQuery;
  const data = await templateService.listTemplates(query);

  res.status(200).json({
    message: "Lấy danh sách template thành công",
    data,
  });
}

export async function createTemplate(req: Request, res: Response) {
  const body = req.validated as CreateTemplateInput;
  const data = await templateService.createTemplate(req.user!.id, body);

  res.status(201).json({
    message: "Tạo template thành công",
    data,
  });
}

export async function getTemplateDetail(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const data = await templateService.getTemplateDetail(templateId);

  res.status(200).json({
    message: "Lấy chi tiết template thành công",
    data,
  });
}

export async function updateTemplate(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const body = req.validated as UpdateTemplateInput;
  const data = await templateService.updateTemplate(
    templateId,
    req.user!.id,
    body,
  );

  res.status(200).json({
    message: "Cập nhật template thành công",
    data,
  });
}

export async function deleteTemplate(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  await templateService.deleteTemplate(templateId);

  res.status(200).json({
    message: "Xóa template thành công",
  });
}

export async function archiveTemplate(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const data = await templateService.archiveTemplate(templateId, req.user!.id);

  res.status(200).json({
    message: "Lưu trữ template thành công",
    data,
  });
}

export async function duplicateTemplate(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const body = req.validated as DuplicateTemplateInput;
  const data = await templateService.duplicateTemplate(
    templateId,
    req.user!.id,
    body,
  );

  res.status(201).json({
    message: "Sao chép template thành công",
    data,
  });
}

export async function activateTemplate(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const data = await templateService.activateTemplate(
    templateId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Kích hoạt template thành công",
    data,
  });
}

export async function createProjectRole(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const body = req.validated as CreateProjectRoleInput;
  const data = await projectRoleService.createProjectRole(
    templateId,
    req.user!.id,
    body,
  );

  res.status(201).json({
    message: "Tạo vai trò dự án thành công",
    data,
  });
}

export async function updateProjectRole(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const roleId = Number(req.params.roleId);
  const body = req.validated as UpdateProjectRoleInput;
  const data = await projectRoleService.updateProjectRole(
    templateId,
    roleId,
    req.user!.id,
    body,
  );

  res.status(200).json({
    message: "Cập nhật vai trò dự án thành công",
    data,
  });
}

export async function deleteProjectRole(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const roleId = Number(req.params.roleId);
  await projectRoleService.deleteProjectRole(
    templateId,
    roleId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Xóa vai trò dự án thành công",
  });
}

export async function createTaskType(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const body = req.validated as CreateTaskTypeInput;
  const data = await taskTypeService.createTaskType(
    templateId,
    req.user!.id,
    body,
  );

  res.status(201).json({
    message: "Tạo loại công việc thành công",
    data,
  });
}

export async function updateTaskType(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const taskTypeId = Number(req.params.taskTypeId);
  const body = req.validated as UpdateTaskTypeInput;
  const data = await taskTypeService.updateTaskType(
    templateId,
    taskTypeId,
    req.user!.id,
    body,
  );

  res.status(200).json({
    message: "Cập nhật loại công việc thành công",
    data,
  });
}

export async function deleteTaskType(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const taskTypeId = Number(req.params.taskTypeId);
  await taskTypeService.deleteTaskType(templateId, taskTypeId, req.user!.id);

  res.status(200).json({
    message: "Xóa loại công việc thành công",
  });
}

export async function createWorkflow(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const body = req.validated as CreateWorkflowInput;
  const data = await workflowService.createWorkflow(
    templateId,
    req.user!.id,
    body,
  );

  res.status(201).json({
    message: "Tạo workflow thành công",
    data,
  });
}

export async function updateWorkflow(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const body = req.validated as UpdateWorkflowInput;
  const data = await workflowService.updateWorkflow(
    templateId,
    workflowId,
    req.user!.id,
    body,
  );

  res.status(200).json({
    message: "Cập nhật workflow thành công",
    data,
  });
}

export async function deleteWorkflow(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  await workflowService.deleteWorkflow(templateId, workflowId, req.user!.id);

  res.status(200).json({
    message: "Xóa workflow thành công",
  });
}

export async function createStatus(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const body = req.validated as CreateStatusInput;
  const data = await workflowService.createStatus(
    templateId,
    workflowId,
    req.user!.id,
    body,
  );

  res.status(201).json({
    message: "Tạo trạng thái thành công",
    data,
  });
}

export async function updateStatus(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const statusId = Number(req.params.statusId);
  const body = req.validated as UpdateStatusInput;
  const data = await workflowService.updateStatus(
    templateId,
    workflowId,
    statusId,
    req.user!.id,
    body,
  );

  res.status(200).json({
    message: "Cập nhật trạng thái thành công",
    data,
  });
}

export async function deleteStatus(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const statusId = Number(req.params.statusId);
  await workflowService.deleteStatus(
    templateId,
    workflowId,
    statusId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Xóa trạng thái thành công",
  });
}

export async function createTransition(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const body = req.validated as CreateTransitionInput;
  const data = await workflowService.createTransition(
    templateId,
    workflowId,
    req.user!.id,
    body,
  );

  res.status(201).json({
    message: "Tạo transition thành công",
    data,
  });
}

export async function updateTransition(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const transitionId = Number(req.params.transitionId);
  const body = req.validated as UpdateTransitionInput;
  const data = await workflowService.updateTransition(
    templateId,
    workflowId,
    transitionId,
    req.user!.id,
    body,
  );

  res.status(200).json({
    message: "Cập nhật transition thành công",
    data,
  });
}

export async function deleteTransition(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const transitionId = Number(req.params.transitionId);
  await workflowService.deleteTransition(
    templateId,
    workflowId,
    transitionId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Xóa transition thành công",
  });
}

export async function createApprovalRule(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const transitionId = Number(req.params.transitionId);
  const body = req.validated as CreateApprovalRuleInput;
  const data = await approvalRuleService.createApprovalRule(
    templateId,
    workflowId,
    transitionId,
    req.user!.id,
    body,
  );

  res.status(201).json({
    message: "Tạo quy tắc duyệt thành công",
    data,
  });
}

export async function updateApprovalRule(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const transitionId = Number(req.params.transitionId);
  const ruleId = Number(req.params.ruleId);
  const body = req.validated as UpdateApprovalRuleInput;
  const data = await approvalRuleService.updateApprovalRule(
    templateId,
    workflowId,
    transitionId,
    ruleId,
    req.user!.id,
    body,
  );

  res.status(200).json({
    message: "Cập nhật quy tắc duyệt thành công",
    data,
  });
}

export async function deleteApprovalRule(req: Request, res: Response) {
  const templateId = Number(req.params.id);
  const workflowId = Number(req.params.workflowId);
  const transitionId = Number(req.params.transitionId);
  const ruleId = Number(req.params.ruleId);
  await approvalRuleService.deleteApprovalRule(
    templateId,
    workflowId,
    transitionId,
    ruleId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Xóa quy tắc duyệt thành công",
  });
}
