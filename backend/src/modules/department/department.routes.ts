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
import * as taskController from "@/modules/department/department-task.controller";
import {
  departmentTaskParamsSchema,
  saveDepartmentTaskConfigSchema,
  saveDepartmentTaskSchema,
  updateDepartmentTaskStatusSchema,
} from "@/modules/department/department-task.schema";
import { createProjectTaskCommentSchema } from "@/modules/project/project.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { requireRoles } from "@/shared/middlewares/role.middleware";
import {
  validateBody,
  validateParams,
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

router.get("/me/task-config", asyncHandler(taskController.getTaskConfig));

router.put(
  "/me/task-config",
  validateBody(saveDepartmentTaskConfigSchema),
  asyncHandler(taskController.saveTaskConfig),
);

router.get("/me/tasks", asyncHandler(taskController.listTasks));

router.post(
  "/me/tasks",
  validateBody(saveDepartmentTaskSchema),
  asyncHandler(taskController.createTask),
);

router.get(
  "/me/tasks/:taskId",
  validateParams(departmentTaskParamsSchema),
  asyncHandler(taskController.getTask),
);

router.get(
  "/me/tasks/:taskId/comments",
  validateParams(departmentTaskParamsSchema),
  asyncHandler(taskController.listTaskComments),
);

router.post(
  "/me/tasks/:taskId/comments",
  validateParams(departmentTaskParamsSchema),
  validateBody(createProjectTaskCommentSchema),
  asyncHandler(taskController.createTaskComment),
);

router.get(
  "/me/tasks/:taskId/attachments",
  validateParams(departmentTaskParamsSchema),
  asyncHandler(taskController.listTaskAttachments),
);

router.patch(
  "/me/tasks/:taskId/status",
  validateParams(departmentTaskParamsSchema),
  validateBody(updateDepartmentTaskStatusSchema),
  asyncHandler(taskController.updateTaskStatus),
);

router.patch(
  "/me/tasks/:taskId",
  validateParams(departmentTaskParamsSchema),
  validateBody(saveDepartmentTaskSchema),
  asyncHandler(taskController.updateTask),
);

router.delete(
  "/me/tasks/:taskId",
  validateParams(departmentTaskParamsSchema),
  asyncHandler(taskController.deleteTask),
);

router.get(
  "/me/candidates",
  validateQuery(candidateListQuerySchema),
  asyncHandler(departmentController.listCandidates),
);

export default router;
