import { Role } from "@prisma/client";
import { Router } from "express";
import * as adminController from "@/modules/admin/admin.controller";
import {
  adminGroupListQuerySchema,
  adminGroupMembersQuerySchema,
  adminPostListQuerySchema,
  adminUserListQuerySchema,
  groupIdParamsSchema,
  postIdParamsSchema,
  updateUserStatusSchema,
  userIdParamsSchema,
} from "@/modules/admin/admin.schema";
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

router.get("/dashboard", asyncHandler(adminController.getDashboard));

router.get(
  "/users",
  validateQuery(adminUserListQuerySchema),
  asyncHandler(adminController.listUsers),
);
router.patch(
  "/users/:userId/status",
  validateParams(userIdParamsSchema),
  validateBody(updateUserStatusSchema),
  asyncHandler(adminController.updateUserStatus),
);

router.get(
  "/posts",
  validateQuery(adminPostListQuerySchema),
  asyncHandler(adminController.listPosts),
);
router.get(
  "/posts/:postId",
  validateParams(postIdParamsSchema),
  asyncHandler(adminController.getPostDetail),
);
router.delete(
  "/posts/:postId",
  validateParams(postIdParamsSchema),
  asyncHandler(adminController.deletePost),
);

router.get(
  "/groups",
  validateQuery(adminGroupListQuerySchema),
  asyncHandler(adminController.listGroups),
);
router.get(
  "/groups/:groupId/members",
  validateParams(groupIdParamsSchema),
  validateQuery(adminGroupMembersQuerySchema),
  asyncHandler(adminController.listGroupMembers),
);
router.get(
  "/groups/:groupId",
  validateParams(groupIdParamsSchema),
  asyncHandler(adminController.getGroupDetail),
);
router.delete(
  "/groups/:groupId",
  validateParams(groupIdParamsSchema),
  asyncHandler(adminController.deleteGroup),
);

export default router;
