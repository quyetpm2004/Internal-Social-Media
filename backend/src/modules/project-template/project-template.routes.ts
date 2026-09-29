import { Role } from "@prisma/client";
import { Router } from "express";
import * as projectTemplateController from "@/modules/project-template/project-template.controller";
import {
  approvalRuleIdParamsSchema,
  createApprovalRuleSchema,
  createProjectRoleSchema,
  createStatusSchema,
  createTaskTypeSchema,
  createTemplateSchema,
  createTransitionSchema,
  createWorkflowSchema,
  duplicateTemplateSchema,
  listTemplatesQuerySchema,
  roleIdParamsSchema,
  statusIdParamsSchema,
  taskTypeIdParamsSchema,
  templateIdParamsSchema,
  transitionIdParamsSchema,
  updateApprovalRuleSchema,
  updateProjectRoleSchema,
  updateStatusSchema,
  updateTaskTypeSchema,
  updateTemplateSchema,
  updateTransitionSchema,
  updateWorkflowSchema,
  workflowIdParamsSchema,
} from "@/modules/project-template/project-template.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { requireRoles } from "@/shared/middlewares/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware, requireRoles(Role.ADMIN));

router.get(
  "/",
  validateQuery(listTemplatesQuerySchema),
  asyncHandler(projectTemplateController.listTemplates),
);

router.post(
  "/",
  validateBody(createTemplateSchema),
  asyncHandler(projectTemplateController.createTemplate),
);

router.get(
  "/:id",
  validateParams(templateIdParamsSchema),
  asyncHandler(projectTemplateController.getTemplateDetail),
);

router.patch(
  "/:id",
  validateParams(templateIdParamsSchema),
  validateBody(updateTemplateSchema),
  asyncHandler(projectTemplateController.updateTemplate),
);

router.delete(
  "/:id",
  validateParams(templateIdParamsSchema),
  asyncHandler(projectTemplateController.deleteTemplate),
);

router.post(
  "/:id/archive",
  validateParams(templateIdParamsSchema),
  asyncHandler(projectTemplateController.archiveTemplate),
);

router.post(
  "/:id/duplicate",
  validateParams(templateIdParamsSchema),
  validateBody(duplicateTemplateSchema),
  asyncHandler(projectTemplateController.duplicateTemplate),
);

router.post(
  "/:id/activate",
  validateParams(templateIdParamsSchema),
  asyncHandler(projectTemplateController.activateTemplate),
);

router.post(
  "/:id/project-roles",
  validateParams(templateIdParamsSchema),
  validateBody(createProjectRoleSchema),
  asyncHandler(projectTemplateController.createProjectRole),
);

router.patch(
  "/:id/project-roles/:roleId",
  validateParams(roleIdParamsSchema),
  validateBody(updateProjectRoleSchema),
  asyncHandler(projectTemplateController.updateProjectRole),
);

router.delete(
  "/:id/project-roles/:roleId",
  validateParams(roleIdParamsSchema),
  asyncHandler(projectTemplateController.deleteProjectRole),
);

router.post(
  "/:id/task-types",
  validateParams(templateIdParamsSchema),
  validateBody(createTaskTypeSchema),
  asyncHandler(projectTemplateController.createTaskType),
);

router.patch(
  "/:id/task-types/:taskTypeId",
  validateParams(taskTypeIdParamsSchema),
  validateBody(updateTaskTypeSchema),
  asyncHandler(projectTemplateController.updateTaskType),
);

router.delete(
  "/:id/task-types/:taskTypeId",
  validateParams(taskTypeIdParamsSchema),
  asyncHandler(projectTemplateController.deleteTaskType),
);

router.post(
  "/:id/workflows",
  validateParams(templateIdParamsSchema),
  validateBody(createWorkflowSchema),
  asyncHandler(projectTemplateController.createWorkflow),
);

router.patch(
  "/:id/workflows/:workflowId",
  validateParams(workflowIdParamsSchema),
  validateBody(updateWorkflowSchema),
  asyncHandler(projectTemplateController.updateWorkflow),
);

router.delete(
  "/:id/workflows/:workflowId",
  validateParams(workflowIdParamsSchema),
  asyncHandler(projectTemplateController.deleteWorkflow),
);

router.post(
  "/:id/workflows/:workflowId/statuses",
  validateParams(workflowIdParamsSchema),
  validateBody(createStatusSchema),
  asyncHandler(projectTemplateController.createStatus),
);

router.patch(
  "/:id/workflows/:workflowId/statuses/:statusId",
  validateParams(statusIdParamsSchema),
  validateBody(updateStatusSchema),
  asyncHandler(projectTemplateController.updateStatus),
);

router.delete(
  "/:id/workflows/:workflowId/statuses/:statusId",
  validateParams(statusIdParamsSchema),
  asyncHandler(projectTemplateController.deleteStatus),
);

router.post(
  "/:id/workflows/:workflowId/transitions",
  validateParams(workflowIdParamsSchema),
  validateBody(createTransitionSchema),
  asyncHandler(projectTemplateController.createTransition),
);

router.patch(
  "/:id/workflows/:workflowId/transitions/:transitionId",
  validateParams(transitionIdParamsSchema),
  validateBody(updateTransitionSchema),
  asyncHandler(projectTemplateController.updateTransition),
);

router.delete(
  "/:id/workflows/:workflowId/transitions/:transitionId",
  validateParams(transitionIdParamsSchema),
  asyncHandler(projectTemplateController.deleteTransition),
);

router.post(
  "/:id/workflows/:workflowId/transitions/:transitionId/approval-rules",
  validateParams(transitionIdParamsSchema),
  validateBody(createApprovalRuleSchema),
  asyncHandler(projectTemplateController.createApprovalRule),
);

router.patch(
  "/:id/workflows/:workflowId/transitions/:transitionId/approval-rules/:ruleId",
  validateParams(approvalRuleIdParamsSchema),
  validateBody(updateApprovalRuleSchema),
  asyncHandler(projectTemplateController.updateApprovalRule),
);

router.delete(
  "/:id/workflows/:workflowId/transitions/:transitionId/approval-rules/:ruleId",
  validateParams(approvalRuleIdParamsSchema),
  asyncHandler(projectTemplateController.deleteApprovalRule),
);

export default router;
