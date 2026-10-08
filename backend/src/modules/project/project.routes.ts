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
  createProjectSchema,
  getProjectListSchema,
  memberCandidateQuerySchema,
  projectIdParamsSchema,
  projectMemberListQuerySchema,
  projectMemberUserParamsSchema,
  updateProjectMemberRolesSchema,
  updateProjectSchema,
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

export default router;
