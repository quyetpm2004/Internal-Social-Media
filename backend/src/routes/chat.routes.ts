import express from "express";
import * as chatController from "../controllers/chat.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

// Conversations
router.get("/conversations", chatController.listConversations);
router.post("/conversations/direct", chatController.createDirectConversation);
router.post("/conversations/group", chatController.createGroupConversation);
router.get(
  "/conversations/:conversationId",
  chatController.getConversationDetail,
);

// Messages within a conversation
router.get(
  "/conversations/:conversationId/messages",
  chatController.listMessages,
);
router.post(
  "/conversations/:conversationId/messages",
  chatController.sendMessage,
);

// Read / mute
router.post(
  "/conversations/:conversationId/read",
  chatController.markConversationRead,
);
router.patch(
  "/conversations/:conversationId/mute",
  chatController.setConversationMuted,
);

// Shared media / files
router.get(
  "/conversations/:conversationId/media",
  chatController.getSharedMedia,
);
router.get(
  "/conversations/:conversationId/files",
  chatController.getSharedFiles,
);

// Individual message actions
router.patch("/messages/:messageId", chatController.editMessage);
router.delete("/messages/:messageId", chatController.deleteMessage);

export default router;
