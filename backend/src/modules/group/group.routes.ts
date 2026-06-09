import { Router } from "express";
import * as groupController from "@/modules/group/group.controller";
import {
  addMemberSchema,
  createGroupPostSchema,
  createGroupSchema,
  groupFilesQuerySchema,
  groupMediaQuerySchema,
  groupIdParamsSchema,
  groupIdPostIdParamsSchema,
  groupIdUserIdParamsSchema,
  groupListQuerySchema,
  groupMembersQuerySchema,
  groupPostListQuerySchema,
  paginationQuerySchema,
  updateGroupSchema,
  updateGroupSettingSchema,
  updateMemberRoleSchema,
} from "@/modules/group/group.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validateBody(createGroupSchema),
  asyncHandler(groupController.createGroup),
);
router.get(
  "/",
  validateQuery(groupListQuerySchema),
  asyncHandler(groupController.getGroups),
);
router.get(
  "/:groupId",
  validateParams(groupIdParamsSchema),
  asyncHandler(groupController.getGroupById),
);
router.put(
  "/:groupId",
  validateParams(groupIdParamsSchema),
  validateBody(updateGroupSchema),
  asyncHandler(groupController.updateGroup),
);
router.delete(
  "/:groupId",
  validateParams(groupIdParamsSchema),
  asyncHandler(groupController.deleteGroup),
);

router.post(
  "/:groupId/members",
  validateParams(groupIdParamsSchema),
  validateBody(addMemberSchema),
  asyncHandler(groupController.addMemberToGroup),
);
router.get(
  "/:groupId/members",
  validateParams(groupIdParamsSchema),
  validateQuery(groupMembersQuerySchema),
  asyncHandler(groupController.getGroupMembers),
);
router.delete(
  "/:groupId/members/:userId",
  validateParams(groupIdUserIdParamsSchema),
  asyncHandler(groupController.removeMemberFromGroup),
);
router.patch(
  "/:groupId/members/:userId/role",
  validateParams(groupIdUserIdParamsSchema),
  validateBody(updateMemberRoleSchema),
  asyncHandler(groupController.updateMemberRole),
);

router.post(
  "/:groupId/join",
  validateParams(groupIdParamsSchema),
  asyncHandler(groupController.joinGroup),
);
router.post(
  "/:groupId/leave",
  validateParams(groupIdParamsSchema),
  asyncHandler(groupController.leaveGroup),
);

router.get(
  "/:groupId/join-requests",
  validateParams(groupIdParamsSchema),
  validateQuery(paginationQuerySchema),
  asyncHandler(groupController.getJoinRequests),
);
router.post(
  "/:groupId/join-requests/:userId/approve",
  validateParams(groupIdUserIdParamsSchema),
  asyncHandler(groupController.approveJoinRequest),
);
router.delete(
  "/:groupId/join-requests/:userId",
  validateParams(groupIdUserIdParamsSchema),
  asyncHandler(groupController.rejectJoinRequest),
);

router.post(
  "/:groupId/posts",
  validateParams(groupIdParamsSchema),
  validateBody(createGroupPostSchema),
  asyncHandler(groupController.createGroupPost),
);
router.get(
  "/:groupId/posts",
  validateParams(groupIdParamsSchema),
  validateQuery(groupPostListQuerySchema),
  asyncHandler(groupController.getGroupPosts),
);
router.get(
  "/:groupId/posts/pending-review",
  validateParams(groupIdParamsSchema),
  validateQuery(paginationQuerySchema),
  asyncHandler(groupController.getPendingGroupPosts),
);
router.post(
  "/:groupId/posts/:postId/approve",
  validateParams(groupIdPostIdParamsSchema),
  asyncHandler(groupController.approveGroupPost),
);
router.delete(
  "/:groupId/posts/:postId/reject",
  validateParams(groupIdPostIdParamsSchema),
  asyncHandler(groupController.rejectGroupPost),
);
router.get(
  "/:groupId/posts/:postId",
  validateParams(groupIdPostIdParamsSchema),
  asyncHandler(groupController.getGroupPostDetail),
);

router.get(
  "/:groupId/settings",
  validateParams(groupIdParamsSchema),
  asyncHandler(groupController.getGroupSetting),
);
router.patch(
  "/:groupId/settings",
  validateParams(groupIdParamsSchema),
  validateBody(updateGroupSettingSchema),
  asyncHandler(groupController.updateGroupSetting),
);

router.get(
  "/:groupId/media",
  validateParams(groupIdParamsSchema),
  validateQuery(groupMediaQuerySchema),
  asyncHandler(groupController.getGroupMedia),
);
router.get(
  "/:groupId/files",
  validateParams(groupIdParamsSchema),
  validateQuery(groupFilesQuerySchema),
  asyncHandler(groupController.getGroupFiles),
);

export default router;
