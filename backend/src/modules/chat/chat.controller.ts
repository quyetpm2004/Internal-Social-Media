import { Request, Response } from "express";
import type {
  AddChatSearchHistoryInput,
  AddGroupMembersInput,
  ChatSearchHistoryQuery,
  ChatSearchQuery,
  CreateDirectConversationInput,
  CreateGroupConversationInput,
  EditMessageInput,
  HistoryIdParams,
  ListConversationsQuery,
  ListMessagesQuery,
  MuteInput,
  PresenceQuery,
  SendMessageInput,
  SharedQuery,
} from "@/modules/chat/chat.schema";
import * as chatService from "@/modules/chat/chat.service";
import * as chatSearchService from "@/modules/chat/services/chat-search.service";
import * as presenceService from "@/socket/presence.service";
import {
  emitMembersUpdated,
  emitMessageDeleted,
  emitMessageEdited,
  emitMessageNew,
  emitReadUpdate,
  joinUsersToConversationRoom,
  leaveUsersFromConversationRoom,
} from "@/socket";

export async function listConversations(req: Request, res: Response) {
  const query = req.validated as ListConversationsQuery;

  const result = await chatService.listConversationsService({
    userId: req.user!.id,
    filter: query.filter,
    page: query.page,
    limit: query.limit,
  });

  res.status(200).json({
    message: "Lấy danh sách cuộc trò chuyện thành công",
    data: result,
  });
}

export async function getConversationDetail(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);

  const result = await chatService.getConversationDetailService({
    conversationId,
    userId: req.user!.id,
  });

  res.status(200).json({
    message: "Lấy chi tiết cuộc trò chuyện thành công",
    data: result,
  });
}

export async function createDirectConversation(req: Request, res: Response) {
  const body = req.validated as CreateDirectConversationInput;

  const result = await chatService.getOrCreateDirectConversationService({
    userId: req.user!.id,
    otherUserId: body.userId,
  });

  joinUsersToConversationRoom(
    result.members.map((m) => m.user.id),
    result.id,
  );

  res.status(200).json({
    message: "Tạo hoặc lấy cuộc trò chuyện thành công",
    data: result,
  });
}

export async function createGroupConversation(req: Request, res: Response) {
  const body = req.validated as CreateGroupConversationInput;

  const result = await chatService.createGroupConversationService({
    userId: req.user!.id,
    name: body.name,
    memberIds: body.memberIds,
  });

  joinUsersToConversationRoom(
    result.members.map((m) => m.user.id),
    result.id,
  );

  res.status(201).json({
    message: "Tạo nhóm chat thành công",
    data: result,
  });
}

export async function listMessages(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);
  const query = req.validated as ListMessagesQuery;

  const result = await chatService.getMessagesService({
    conversationId,
    userId: req.user!.id,
    cursor: query.cursor,
    limit: query.limit,
  });

  res.status(200).json({
    message: "Lấy tin nhắn thành công",
    data: result,
  });
}

export async function sendMessage(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);
  const body = req.validated as SendMessageInput;

  const result = await chatService.sendMessageService({
    conversationId,
    userId: req.user!.id,
    content: body.content ?? "",
    contentType: body.contentType,
    attachmentIds: body.attachmentIds ?? [],
    poll: body.poll,
  });

  emitMessageNew(conversationId, result);

  res.status(201).json({
    message: "Gửi tin nhắn thành công",
    data: result,
  });
}

export async function markConversationRead(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);

  const result = await chatService.markConversationReadService({
    conversationId,
    userId: req.user!.id,
  });

  emitReadUpdate(conversationId, req.user!.id, result.lastReadAt);

  res.status(200).json({
    message: "Đã đánh dấu đã đọc",
    data: result,
  });
}

export async function setConversationMuted(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);
  const body = req.validated as MuteInput;

  const result = await chatService.setConversationMutedService({
    conversationId,
    userId: req.user!.id,
    muted: body.muted,
  });

  res.status(200).json({
    message: result.isMuted ? "Đã tắt thông báo" : "Đã bật thông báo",
    data: result,
  });
}

export async function editMessage(req: Request, res: Response) {
  const messageId = Number(req.params.messageId);
  const body = req.validated as EditMessageInput;

  const result = await chatService.editMessageService({
    messageId,
    userId: req.user!.id,
    content: body.content,
  });

  emitMessageEdited(result.conversationId, result);

  res.status(200).json({
    message: "Cập nhật tin nhắn thành công",
    data: result,
  });
}

export async function deleteMessage(req: Request, res: Response) {
  const messageId = Number(req.params.messageId);

  const result = await chatService.deleteMessageService({
    messageId,
    userId: req.user!.id,
  });

  emitMessageDeleted(result.conversationId, result.messageId);

  res.status(200).json({
    message: "Xóa tin nhắn thành công",
    data: result,
  });
}

export async function getSharedMedia(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);
  const query = req.validated as SharedQuery;

  const result = await chatService.getSharedMediaService({
    conversationId,
    userId: req.user!.id,
    page: query.page,
    limit: query.limit,
  });

  res.status(200).json({
    message: "Lấy media của cuộc trò chuyện thành công",
    data: result,
  });
}

export async function getSharedFiles(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);
  const query = req.validated as SharedQuery;

  const result = await chatService.getSharedFilesService({
    conversationId,
    userId: req.user!.id,
    page: query.page,
    limit: query.limit,
  });

  res.status(200).json({
    message: "Lấy file của cuộc trò chuyện thành công",
    data: result,
  });
}

export async function getPresence(req: Request, res: Response) {
  const query = req.validated as PresenceQuery;
  const onlineUserIds = await presenceService.filterOnlineUserIds(
    query.userIds,
  );

  res.status(200).json({
    message: "Lấy trạng thái online thành công",
    data: { onlineUserIds },
  });
}

export async function searchChatUsers(req: Request, res: Response) {
  const query = req.validated as ChatSearchQuery;

  const data = await chatSearchService.searchChatUsers(
    req.user!.id,
    query.q,
    query.page,
    query.limit,
  );

  res.status(200).json({
    message: "Tìm kiếm thành công",
    data,
  });
}

export async function getChatSearchHistory(req: Request, res: Response) {
  const query = req.validated as ChatSearchHistoryQuery;

  const histories = await chatSearchService.getChatSearchHistory(
    req.user!.id,
    query.limit,
  );

  res.status(200).json({
    message: "Lấy lịch sử tìm kiếm thành công",
    data: histories,
  });
}

export async function addChatSearchHistory(req: Request, res: Response) {
  const body = req.validated as AddChatSearchHistoryInput;

  const histories = await chatSearchService.addChatSearchHistory(
    req.user!.id,
    body.targetUserId,
  );

  res.status(200).json({
    message: "Lưu lịch sử tìm kiếm thành công",
    data: histories,
  });
}

export async function deleteChatSearchHistoryItem(req: Request, res: Response) {
  const { historyId } = req.validated as HistoryIdParams;

  await chatSearchService.deleteChatSearchHistoryItem(req.user!.id, historyId);

  res.status(200).json({
    message: "Xóa lịch sử tìm kiếm thành công",
  });
}

export async function addGroupConversationMembers(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);
  const body = req.validated as AddGroupMembersInput;

  const result = await chatService.addGroupConversationMembersService({
    conversationId,
    userId: req.user!.id,
    memberIds: body.userIds,
  });

  joinUsersToConversationRoom(result.addedUserIds, conversationId);

  emitMessageNew(conversationId, result.systemMessage);
  emitMembersUpdated({
    conversationId,
    action: "added",
    affectedUserIds: result.addedUserIds,
    actorUserId: req.user!.id,
  });

  res.status(200).json({
    message: "Thêm thành viên thành công",
    data: result.detail,
  });
}

export async function leaveGroupConversation(req: Request, res: Response) {
  const conversationId = Number(req.params.conversationId);

  const result = await chatService.leaveGroupConversationService({
    conversationId,
    userId: req.user!.id,
  });

  emitMessageNew(conversationId, result.systemMessage);
  emitMembersUpdated({
    conversationId,
    action: "left",
    affectedUserIds: [req.user!.id],
    actorUserId: req.user!.id,
  });
  leaveUsersFromConversationRoom([req.user!.id], conversationId);

  res.status(200).json({
    message: "Rời nhóm thành công",
    data: { success: true },
  });
}

export async function removeGroupConversationMember(
  req: Request,
  res: Response,
) {
  const conversationId = Number(req.params.conversationId);
  const targetUserId = Number(req.params.userId);

  const result = await chatService.removeGroupConversationMemberService({
    conversationId,
    userId: req.user!.id,
    targetUserId,
  });

  emitMessageNew(conversationId, result.systemMessage);
  emitMembersUpdated({
    conversationId,
    action: "removed",
    affectedUserIds: [targetUserId],
    actorUserId: req.user!.id,
  });
  leaveUsersFromConversationRoom([targetUserId], conversationId);

  res.status(200).json({
    message: "Xóa thành viên khỏi nhóm thành công",
    data: result.detail,
  });
}

export async function deleteGroupConversationAvatar(
  req: Request,
  res: Response,
) {
  const conversationId = Number(req.params.conversationId);

  const result = await chatService.deleteGroupConversationAvatarService({
    conversationId,
    userId: req.user!.id,
  });

  res.status(200).json({
    message: "Xóa ảnh nhóm thành công",
    data: result,
  });
}
