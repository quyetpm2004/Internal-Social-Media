import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { Router } from "express";
import * as projectController from "@/modules/project/project.controller";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";
import {
  addProjectMemberSchema,
  approvalRuleIdParamsSchema,
  createProjectApprovalRuleSchema,
  createProjectRoleCatalogSchema,
  createProjectSchema,
  createProjectTaskTypeSchema,
  createProjectWorkflowSchema,
  createProjectWorkflowStatusSchema,
  createProjectWorkflowTransitionSchema,
  getProjectListSchema,
  memberCandidateQuerySchema,
  projectIdParamsSchema,
  projectMemberListQuerySchema,
  projectMemberUserParamsSchema,
  projectRoleParamsSchema,
  projectTaskListQuerySchema,
  projectTaskParamsSchema,
  projectTaskTypeParamsSchema,
  reorderProjectWorkflowStatusesSchema,
  createProjectTaskCommentSchema,
  saveProjectTaskSchema,
  updateProjectTaskStatusSchema,
  statusIdParamsSchema,
  transitionIdParamsSchema,
  updateProjectApprovalRuleSchema,
  updateProjectMemberRolesSchema,
  updateProjectRoleCatalogSchema,
  updateProjectSchema,
  updateProjectTaskTypeSchema,
  updateProjectWorkflowSchema,
  updateProjectWorkflowStatusSchema,
  updateProjectWorkflowTransitionSchema,
  workflowIdParamsSchema,
} from "@/modules/project/project.schema";

const router = Router();

router.use(authMiddleware);

router.get(
  "/template-options",
  asyncHandler(projectController.getTemplateOptions),
);

router.post(
  "/",
  validateBody(createProjectSchema),
  asyncHandler(projectController.createProjectFromTemplate),
);

router.get(
  "/",
  validateQuery(getProjectListSchema),
  asyncHandler(projectController.getProjectList),
);

router.get(
  "/:id",
  validateParams(projectIdParamsSchema),
  asyncHandler(projectController.getProject),
);

router.patch(
  "/:id",
  validateParams(projectIdParamsSchema),
  validateBody(updateProjectSchema),
  asyncHandler(projectController.updateProject),
);

router.get(
  "/:id/members/candidates",
  validateParams(projectIdParamsSchema),
  validateQuery(memberCandidateQuerySchema),
  asyncHandler(projectController.searchMemberCandidates),
);

router.get(
  "/:id/members",
  validateParams(projectIdParamsSchema),
  validateQuery(projectMemberListQuerySchema),
  asyncHandler(projectController.getProjectMembers),
);

router.post(
  "/:id/members",
  validateParams(projectIdParamsSchema),
  validateBody(addProjectMemberSchema),
  asyncHandler(projectController.addProjectMember),
);

router.patch(
  "/:id/members/:userId/roles",
  validateParams(projectMemberUserParamsSchema),
  validateBody(updateProjectMemberRolesSchema),
  asyncHandler(projectController.updateProjectMemberRoles),
);

router.delete(
  "/:id/members/:userId",
  validateParams(projectMemberUserParamsSchema),
  asyncHandler(projectController.removeProjectMember),
);

router.post(
  "/:id/roles",
  validateParams(projectIdParamsSchema),
  validateBody(createProjectRoleCatalogSchema),
  asyncHandler(projectController.createProjectRole),
);

router.patch(
  "/:id/roles/:roleId",
  validateParams(projectRoleParamsSchema),
  validateBody(updateProjectRoleCatalogSchema),
  asyncHandler(projectController.updateProjectRole),
);

router.delete(
  "/:id/roles/:roleId",
  validateParams(projectRoleParamsSchema),
  asyncHandler(projectController.deleteProjectRole),
);

router.post(
  "/:id/task-types",
  validateParams(projectIdParamsSchema),
  validateBody(createProjectTaskTypeSchema),
  asyncHandler(projectController.createProjectTaskType),
);

router.patch(
  "/:id/task-types/:taskTypeId",
  validateParams(projectTaskTypeParamsSchema),
  validateBody(updateProjectTaskTypeSchema),
  asyncHandler(projectController.updateProjectTaskType),
);

router.delete(
  "/:id/task-types/:taskTypeId",
  validateParams(projectTaskTypeParamsSchema),
  asyncHandler(projectController.deleteProjectTaskType),
);

router.get(
  "/:id/workflows",
  validateParams(projectIdParamsSchema),
  asyncHandler(projectController.getProjectWorkflows),
);

router.post(
  "/:id/workflows",
  validateParams(projectIdParamsSchema),
  validateBody(createProjectWorkflowSchema),
  asyncHandler(projectController.createProjectWorkflow),
);

router.patch(
  "/:id/workflows/:workflowId",
  validateParams(workflowIdParamsSchema),
  validateBody(updateProjectWorkflowSchema),
  asyncHandler(projectController.updateProjectWorkflow),
);

router.delete(
  "/:id/workflows/:workflowId",
  validateParams(workflowIdParamsSchema),
  asyncHandler(projectController.deleteProjectWorkflow),
);

router.post(
  "/:id/workflows/:workflowId/statuses",
  validateParams(workflowIdParamsSchema),
  validateBody(createProjectWorkflowStatusSchema),
  asyncHandler(projectController.createProjectWorkflowStatus),
);

router.patch(
  "/:id/workflows/:workflowId/statuses/reorder",
  validateParams(workflowIdParamsSchema),
  validateBody(reorderProjectWorkflowStatusesSchema),
  asyncHandler(projectController.reorderProjectWorkflowStatuses),
);

router.patch(
  "/:id/workflows/:workflowId/statuses/:statusId",
  validateParams(statusIdParamsSchema),
  validateBody(updateProjectWorkflowStatusSchema),
  asyncHandler(projectController.updateProjectWorkflowStatus),
);

router.delete(
  "/:id/workflows/:workflowId/statuses/:statusId",
  validateParams(statusIdParamsSchema),
  asyncHandler(projectController.deleteProjectWorkflowStatus),
);

router.post(
  "/:id/workflows/:workflowId/transitions",
  validateParams(workflowIdParamsSchema),
  validateBody(createProjectWorkflowTransitionSchema),
  asyncHandler(projectController.createProjectWorkflowTransition),
);

router.patch(
  "/:id/workflows/:workflowId/transitions/:transitionId",
  validateParams(transitionIdParamsSchema),
  validateBody(updateProjectWorkflowTransitionSchema),
  asyncHandler(projectController.updateProjectWorkflowTransition),
);

router.delete(
  "/:id/workflows/:workflowId/transitions/:transitionId",
  validateParams(transitionIdParamsSchema),
  asyncHandler(projectController.deleteProjectWorkflowTransition),
);

router.post(
  "/:id/workflows/:workflowId/transitions/:transitionId/approval-rules",
  validateParams(transitionIdParamsSchema),
  validateBody(createProjectApprovalRuleSchema),
  asyncHandler(projectController.createProjectApprovalRule),
);

router.patch(
  "/:id/workflows/:workflowId/transitions/:transitionId/approval-rules/:ruleId",
  validateParams(approvalRuleIdParamsSchema),
  validateBody(updateProjectApprovalRuleSchema),
  asyncHandler(projectController.updateProjectApprovalRule),
);

router.delete(
  "/:id/workflows/:workflowId/transitions/:transitionId/approval-rules/:ruleId",
  validateParams(approvalRuleIdParamsSchema),
  asyncHandler(projectController.deleteProjectApprovalRule),
);

router.get(
  "/:id/tasks",
  validateParams(projectIdParamsSchema),
  validateQuery(projectTaskListQuerySchema),
  asyncHandler(projectController.getProjectTasks),
);

router.post(
  "/:id/tasks",
  validateParams(projectIdParamsSchema),
  validateBody(saveProjectTaskSchema),
  asyncHandler(projectController.createProjectTask),
);

router.get(
  "/:id/tasks/:taskId",
  validateParams(projectTaskParamsSchema),
  asyncHandler(projectController.getProjectTask),
);

router.get(
  "/:id/tasks/:taskId/comments",
  validateParams(projectTaskParamsSchema),
  asyncHandler(projectController.getProjectTaskComments),
);

router.post(
  "/:id/tasks/:taskId/comments",
  validateParams(projectTaskParamsSchema),
  validateBody(createProjectTaskCommentSchema),
  asyncHandler(projectController.createProjectTaskComment),
);

router.patch(
  "/:id/tasks/:taskId/status",
  validateParams(projectTaskParamsSchema),
  validateBody(updateProjectTaskStatusSchema),
  asyncHandler(projectController.updateProjectTaskStatus),
);

router.patch(
  "/:id/tasks/:taskId",
  validateParams(projectTaskParamsSchema),
  validateBody(saveProjectTaskSchema),
  asyncHandler(projectController.updateProjectTask),
);

router.delete(
  "/:id/tasks/:taskId",
  validateParams(projectTaskParamsSchema),
  asyncHandler(projectController.deleteProjectTask),
);

export default router;
