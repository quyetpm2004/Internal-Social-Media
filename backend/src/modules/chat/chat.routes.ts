import { Router } from "express";
import * as chatController from "@/modules/chat/chat.controller";
import {
  addChatSearchHistorySchema,
  addGroupMembersSchema,
  chatSearchHistoryQuerySchema,
  chatSearchQuerySchema,
  conversationIdParamsSchema,
  conversationUserIdParamsSchema,
  createDirectConversationSchema,
  createGroupConversationSchema,
  editMessageSchema,
  historyIdParamsSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  messageIdParamsSchema,
  muteSchema,
  presenceQuerySchema,
  sendMessageSchema,
  sharedQuerySchema,
} from "@/modules/chat/chat.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get(
  "/search",
  validateQuery(chatSearchQuerySchema),
  asyncHandler(chatController.searchChatUsers),
);
router.get(
  "/search/history",
  validateQuery(chatSearchHistoryQuerySchema),
  asyncHandler(chatController.getChatSearchHistory),
);
router.post(
  "/search/history",
  validateBody(addChatSearchHistorySchema),
  asyncHandler(chatController.addChatSearchHistory),
);
router.delete(
  "/search/history/:historyId",
  validateParams(historyIdParamsSchema),
  asyncHandler(chatController.deleteChatSearchHistoryItem),
);

router.get(
  "/conversations",
  validateQuery(listConversationsQuerySchema),
  asyncHandler(chatController.listConversations),
);
router.post(
  "/conversations/direct",
  validateBody(createDirectConversationSchema),
  asyncHandler(chatController.createDirectConversation),
);
router.post(
  "/conversations/group",
  validateBody(createGroupConversationSchema),
  asyncHandler(chatController.createGroupConversation),
);
router.get(
  "/conversations/:conversationId",
  validateParams(conversationIdParamsSchema),
  asyncHandler(chatController.getConversationDetail),
);
router.delete(
  "/conversations/:conversationId/avatar",
  validateParams(conversationIdParamsSchema),
  asyncHandler(chatController.deleteGroupConversationAvatar),
);
router.post(
  "/conversations/:conversationId/members",
  validateParams(conversationIdParamsSchema),
  validateBody(addGroupMembersSchema),
  asyncHandler(chatController.addGroupConversationMembers),
);
router.post(
  "/conversations/:conversationId/leave",
  validateParams(conversationIdParamsSchema),
  asyncHandler(chatController.leaveGroupConversation),
);
router.delete(
  "/conversations/:conversationId/members/:userId",
  validateParams(conversationUserIdParamsSchema),
  asyncHandler(chatController.removeGroupConversationMember),
);

router.get(
  "/conversations/:conversationId/messages",
  validateParams(conversationIdParamsSchema),
  validateQuery(listMessagesQuerySchema),
  asyncHandler(chatController.listMessages),
);
router.post(
  "/conversations/:conversationId/messages",
  validateParams(conversationIdParamsSchema),
  validateBody(sendMessageSchema),
  asyncHandler(chatController.sendMessage),
);

router.post(
  "/conversations/:conversationId/read",
  validateParams(conversationIdParamsSchema),
  asyncHandler(chatController.markConversationRead),
);
router.patch(
  "/conversations/:conversationId/mute",
  validateParams(conversationIdParamsSchema),
  validateBody(muteSchema),
  asyncHandler(chatController.setConversationMuted),
);

router.get(
  "/conversations/:conversationId/media",
  validateParams(conversationIdParamsSchema),
  validateQuery(sharedQuerySchema),
  asyncHandler(chatController.getSharedMedia),
);
router.get(
  "/conversations/:conversationId/files",
  validateParams(conversationIdParamsSchema),
  validateQuery(sharedQuerySchema),
  asyncHandler(chatController.getSharedFiles),
);

router.patch(
  "/messages/:messageId",
  validateParams(messageIdParamsSchema),
  validateBody(editMessageSchema),
  asyncHandler(chatController.editMessage),
);
router.delete(
  "/messages/:messageId",
  validateParams(messageIdParamsSchema),
  asyncHandler(chatController.deleteMessage),
);

router.get(
  "/presence",
  validateQuery(presenceQuerySchema),
  asyncHandler(chatController.getPresence),
);

export default router;
