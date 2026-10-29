import { Role } from "@prisma/client";
import { Router } from "express";
import * as departmentController from "@/modules/department/department.controller";
import {
  addMemberSchema,
  candidateListQuerySchema,
  memberListQuerySchema,
  memberTaskListQuerySchema,
  updateMemberSchema,
} from "@/modules/department/department.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { requireRoles } from "@/shared/middlewares/role.middleware";
import {
  validateBody,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler(departmentController.getAllDepartments),
);

router.use("/me", authMiddleware, requireRoles(Role.MANAGER));

router.get(
  "/me/members",
  validateQuery(memberListQuerySchema),
  asyncHandler(departmentController.listMembers),
);

router.post(
  "/me/members",
  validateBody(addMemberSchema),
  asyncHandler(departmentController.addMember),
);

router.get(
  "/me/members/:userId/tasks",
  validateQuery(memberTaskListQuerySchema),
  asyncHandler(departmentController.listMemberTasks),
);

router.patch(
  "/me/members/:userId",
  validateBody(updateMemberSchema),
  asyncHandler(departmentController.updateMember),
);

router.delete(
  "/me/members/:userId",
  asyncHandler(departmentController.removeMember),
);

router.get("/me/projects", asyncHandler(departmentController.listProjects));

router.get(
  "/me/candidates",
  validateQuery(candidateListQuerySchema),
  asyncHandler(departmentController.listCandidates),
);

export default router;
