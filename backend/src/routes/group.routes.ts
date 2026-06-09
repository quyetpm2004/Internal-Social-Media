import express from "express";
import * as groupController from "@/controllers/group.controller";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

// Group CRUD
router.post("/", groupController.createGroup);
router.get("/", groupController.getGroups);
router.get("/:groupId", groupController.getGroupById);
router.put("/:groupId", groupController.updateGroup);
router.delete("/:groupId", groupController.deleteGroup);

// Group members
router.post("/:groupId/members", groupController.addMemberToGroup);
router.get("/:groupId/members", groupController.getGroupMembers);
router.delete(
  "/:groupId/members/:userId",
  groupController.removeMemberFromGroup,
);
router.patch(
  "/:groupId/members/:userId/role",
  groupController.updateMemberRole,
);

// Join / Leave
router.post("/:groupId/join", groupController.joinGroup);
router.post("/:groupId/leave", groupController.leaveGroup);

// Join requests (private groups)
router.get("/:groupId/join-requests", groupController.getJoinRequests);
router.post(
  "/:groupId/join-requests/:userId/approve",
  groupController.approveJoinRequest,
);
router.delete(
  "/:groupId/join-requests/:userId",
  groupController.rejectJoinRequest,
);

// Group posts
router.post("/:groupId/posts", groupController.createGroupPost);
router.get("/:groupId/posts", groupController.getGroupPosts);
router.get(
  "/:groupId/posts/pending-review",
  groupController.getPendingGroupPosts,
);
router.post(
  "/:groupId/posts/:postId/approve",
  groupController.approveGroupPost,
);
router.delete(
  "/:groupId/posts/:postId/reject",
  groupController.rejectGroupPost,
);

// Group post detail
router.get("/:groupId/posts/:postId", groupController.getGroupPostDetail);

// Group setting
router.get("/:groupId/settings", groupController.getGroupSetting);
router.patch("/:groupId/settings", groupController.updateGroupSetting);

// Group attachments
router.get("/:groupId/media", groupController.getGroupMedia);
router.get("/:groupId/files", groupController.getGroupFiles);

export default router;
