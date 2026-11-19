import { Router } from "express";
import * as departmentController from "@/modules/department/department.controller";
import {
  addMemberSchema,
  appointManagerSchema,
  candidateListQuerySchema,
  createDepartmentSchema,
  departmentIdParamsSchema,
  memberListQuerySchema,
  memberParamsSchema,
  memberTaskListQuerySchema,
  transferMemberSchema,
  updateDepartmentSchema,
  updateMemberSchema,
} from "@/modules/department/department.schema";
import * as taskController from "@/modules/department/department-task.controller";
import {
  departmentScopedTaskParamsSchema,
  departmentTaskParamsSchema,
  saveDepartmentTaskConfigSchema,
  saveDepartmentTaskSchema,
  updateDepartmentTaskStatusSchema,
} from "@/modules/department/department-task.schema";
import { createProjectTaskCommentSchema } from "@/modules/project/project.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { requirePermission } from "@/shared/middlewares/role.middleware";
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

// ─── Cơ cấu tổ chức: chỉ Giám đốc ────────────────────────────────────────────

router.post(
  "/",
  authMiddleware,
  requirePermission("department.manage"),
  validateBody(createDepartmentSchema),
  asyncHandler(departmentController.createDepartment),
);

router.get(
  "/appointees",
  authMiddleware,
  requirePermission("department.appoint_manager"),
  validateQuery(candidateListQuerySchema),
  asyncHandler(departmentController.listAppointees),
);

router.use("/me", authMiddleware);

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

// ─── Theo :departmentId ──────────────────────────────────────────────────────
// Giám đốc truy cập mọi phòng; Manager/Employee chỉ phòng mình.

router.patch(
  "/:departmentId",
  authMiddleware,
  requirePermission("department.manage"),
  validateParams(departmentIdParamsSchema),
  validateBody(updateDepartmentSchema),
  asyncHandler(departmentController.updateDepartment),
);

router.delete(
  "/:departmentId",
  authMiddleware,
  requirePermission("department.manage"),
  validateParams(departmentIdParamsSchema),
  asyncHandler(departmentController.deleteDepartment),
);

router.put(
  "/:departmentId/manager",
  authMiddleware,
  requirePermission("department.appoint_manager"),
  validateParams(departmentIdParamsSchema),
  validateBody(appointManagerSchema),
  asyncHandler(departmentController.appointManager),
);

router.delete(
  "/:departmentId/manager",
  authMiddleware,
  requirePermission("department.appoint_manager"),
  validateParams(departmentIdParamsSchema),
  asyncHandler(departmentController.dismissManager),
);

router.get(
  "/:departmentId/members",
  authMiddleware,
  requirePermission("department.members.view"),
  validateParams(departmentIdParamsSchema),
  validateQuery(memberListQuerySchema),
  asyncHandler(departmentController.listMembers),
);

router.post(
  "/:departmentId/members",
  authMiddleware,
  requirePermission("department.members.manage"),
  validateParams(departmentIdParamsSchema),
  validateBody(addMemberSchema),
  asyncHandler(departmentController.addMember),
);

router.get(
  "/:departmentId/members/:userId/tasks",
  authMiddleware,
  requirePermission("department.dashboard.view"),
  validateParams(memberParamsSchema),
  validateQuery(memberTaskListQuerySchema),
  asyncHandler(departmentController.listMemberTasks),
);

router.patch(
  "/:departmentId/members/:userId",
  authMiddleware,
  requirePermission("department.members.manage"),
  validateParams(memberParamsSchema),
  validateBody(updateMemberSchema),
  asyncHandler(departmentController.updateMember),
);

router.delete(
  "/:departmentId/members/:userId",
  authMiddleware,
  requirePermission("department.members.manage"),
  validateParams(memberParamsSchema),
  asyncHandler(departmentController.removeMember),
);

router.post(
  "/:departmentId/members/:userId/transfer",
  authMiddleware,
  requirePermission("department.members.transfer"),
  validateParams(memberParamsSchema),
  validateBody(transferMemberSchema),
  asyncHandler(departmentController.transferMember),
);

router.get(
  "/:departmentId/candidates",
  authMiddleware,
  requirePermission("department.members.manage"),
  validateParams(departmentIdParamsSchema),
  validateQuery(candidateListQuerySchema),
  asyncHandler(departmentController.listCandidates),
);

router.get(
  "/:departmentId/projects",
  authMiddleware,
  requirePermission("department.dashboard.view"),
  validateParams(departmentIdParamsSchema),
  asyncHandler(departmentController.listProjects),
);

// ─── Công việc phòng ban theo :departmentId ──────────────────────────────────
// Xem: Giám đốc (mọi phòng), Manager/Employee (phòng mình). Quản lý: Manager.
// Employee chỉ tự đổi trạng thái việc được giao (service kiểm tra người thực hiện).

router.get(
  "/:departmentId/task-config",
  authMiddleware,
  requirePermission("department.tasks.view"),
  validateParams(departmentIdParamsSchema),
  asyncHandler(taskController.getTaskConfig),
);

router.put(
  "/:departmentId/task-config",
  authMiddleware,
  requirePermission("department.tasks.manage"),
  validateParams(departmentIdParamsSchema),
  validateBody(saveDepartmentTaskConfigSchema),
  asyncHandler(taskController.saveTaskConfig),
);

router.get(
  "/:departmentId/tasks",
  authMiddleware,
  requirePermission("department.tasks.view"),
  validateParams(departmentIdParamsSchema),
  asyncHandler(taskController.listTasks),
);

router.post(
  "/:departmentId/tasks",
  authMiddleware,
  requirePermission("department.tasks.manage"),
  validateParams(departmentIdParamsSchema),
  validateBody(saveDepartmentTaskSchema),
  asyncHandler(taskController.createTask),
);

router.get(
  "/:departmentId/tasks/:taskId",
  authMiddleware,
  requirePermission("department.tasks.view"),
  validateParams(departmentScopedTaskParamsSchema),
  asyncHandler(taskController.getTask),
);

router.get(
  "/:departmentId/tasks/:taskId/comments",
  authMiddleware,
  requirePermission("department.tasks.view"),
  validateParams(departmentScopedTaskParamsSchema),
  asyncHandler(taskController.listTaskComments),
);

router.post(
  "/:departmentId/tasks/:taskId/comments",
  authMiddleware,
  requirePermission("department.tasks.comment"),
  validateParams(departmentScopedTaskParamsSchema),
  validateBody(createProjectTaskCommentSchema),
  asyncHandler(taskController.createTaskComment),
);

router.get(
  "/:departmentId/tasks/:taskId/attachments",
  authMiddleware,
  requirePermission("department.tasks.view"),
  validateParams(departmentScopedTaskParamsSchema),
  asyncHandler(taskController.listTaskAttachments),
);

router.patch(
  "/:departmentId/tasks/:taskId/status",
  authMiddleware,
  requirePermission("department.tasks.update_assigned_status"),
  validateParams(departmentScopedTaskParamsSchema),
  validateBody(updateDepartmentTaskStatusSchema),
  asyncHandler(taskController.updateTaskStatus),
);

router.patch(
  "/:departmentId/tasks/:taskId",
  authMiddleware,
  requirePermission("department.tasks.manage"),
  validateParams(departmentScopedTaskParamsSchema),
  validateBody(saveDepartmentTaskSchema),
  asyncHandler(taskController.updateTask),
);

router.delete(
  "/:departmentId/tasks/:taskId",
  authMiddleware,
  requirePermission("department.tasks.manage"),
  validateParams(departmentScopedTaskParamsSchema),
  asyncHandler(taskController.deleteTask),
);

export default router;
