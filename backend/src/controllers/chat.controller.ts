import { Request, Response, NextFunction } from "express";
import z from "zod";
import { MessageContentType } from "@prisma/client";
import * as chatService from "@/services/chat.service";
import * as chatSearchService from "@/services/chat-search.service";
import * as presenceService from "@/services/redis/presence.service";
import {
  emitMessageDeleted,
  emitMessageEdited,
  emitMessageNew,
  emitMembersUpdated,
  emitReadUpdate,
  joinUsersToConversationRoom,
  leaveUsersFromConversationRoom,
} from "@/socket";

const parseConversationId = (raw: unknown) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

const parseMessageId = (raw: unknown) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

const listConversationsQuerySchema = z.object({
  filter: z.enum(["ALL", "UNREAD", "GROUPS"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createDirectConversationSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const createGroupConversationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  memberIds: z.array(z.coerce.number().int().positive()).min(1),
});

const listMessagesQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(chatService.CHAT_DEFAULTS.MAX_MESSAGES_PER_PAGE)
    .default(chatService.CHAT_DEFAULTS.DEFAULT_MESSAGES_PER_PAGE),
});

const sendMessageSchema = z.object({
  content: z.string().max(chatService.CHAT_DEFAULTS.MAX_MESSAGE_LENGTH),
  contentType: z
    .enum([
      MessageContentType.TEXT,
      MessageContentType.IMAGE,
      MessageContentType.FILE,
    ])
    .default(MessageContentType.TEXT),
  attachmentIds: z.array(z.coerce.number().int().positive()).optional(),
});

const editMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .max(chatService.CHAT_DEFAULTS.MAX_MESSAGE_LENGTH),
});

const muteSchema = z.object({
  muted: z.boolean(),
});

const sharedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

const presenceQuerySchema = z.object({
  userIds: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id) && id > 0),
    )
    .pipe(z.array(z.number().int().positive()).max(100)),
});

const handleError = (error: unknown, res: Response) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      issues: error.issues,
    });
  }

  const message =
    error instanceof Error ? error.message : "Có lỗi xảy ra. Vui lòng thử lại.";

  if (message.includes("không phải thành viên")) {
    return res.status(403).json({ message });
  }

  if (message.includes("Không tìm thấy")) {
    return res.status(404).json({ message });
  }

  if (message.includes("không có quyền")) {
    return res.status(403).json({ message });
  }

  return res.status(400).json({ message });
};

export const listConversations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const query = listConversationsQuerySchema.parse(req.query);

    const result = await chatService.listConversationsService({
      userId,
      filter: query.filter,
      page: query.page,
      limit: query.limit,
    });

    return res.status(200).json({
      message: "Lấy danh sách cuộc trò chuyện thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const getConversationDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId không hợp lệ" });
    }

    const result = await chatService.getConversationDetailService({
      conversationId,
      userId,
    });

    return res.status(200).json({
      message: "Lấy chi tiết cuộc trò chuyện thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const createDirectConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const body = createDirectConversationSchema.parse(req.body);

    const result = await chatService.getOrCreateDirectConversationService({
      userId,
      otherUserId: body.userId,
    });

    // Ensure cả 2 user đang online cùng join room conversation mới
    joinUsersToConversationRoom(
      result.members.map((m) => m.user.id),
      result.id,
    );

    return res.status(200).json({
      message: "Tạo hoặc lấy cuộc trò chuyện thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const createGroupConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const body = createGroupConversationSchema.parse(req.body);

    const result = await chatService.createGroupConversationService({
      userId,
      name: body.name,
      memberIds: body.memberIds,
    });

    joinUsersToConversationRoom(
      result.members.map((m) => m.user.id),
      result.id,
    );

    return res.status(201).json({
      message: "Tạo nhóm chat thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const listMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId không hợp lệ" });
    }

    const query = listMessagesQuerySchema.parse(req.query);

    const result = await chatService.getMessagesService({
      conversationId,
      userId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return res.status(200).json({
      message: "Lấy tin nhắn thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId không hợp lệ" });
    }

    const body = sendMessageSchema.parse(req.body);

    const result = await chatService.sendMessageService({
      conversationId,
      userId,
      content: body.content ?? "",
      contentType: body.contentType,
      attachmentIds: body.attachmentIds ?? [],
    });

    emitMessageNew(conversationId, result);

    return res.status(201).json({
      message: "Gửi tin nhắn thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const markConversationRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId không hợp lệ" });
    }

    const result = await chatService.markConversationReadService({
      conversationId,
      userId,
    });

    emitReadUpdate(conversationId, userId, result.lastReadAt);

    return res.status(200).json({
      message: "Đã đánh dấu đã đọc",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const setConversationMuted = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId không hợp lệ" });
    }

    const body = muteSchema.parse(req.body);

    const result = await chatService.setConversationMutedService({
      conversationId,
      userId,
      muted: body.muted,
    });

    return res.status(200).json({
      message: result.isMuted ? "Đã tắt thông báo" : "Đã bật thông báo",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const messageId = parseMessageId(req.params.messageId);
    if (!messageId) {
      return res.status(400).json({ message: "messageId không hợp lệ" });
    }

    const body = editMessageSchema.parse(req.body);

    const result = await chatService.editMessageService({
      messageId,
      userId,
      content: body.content,
    });

    emitMessageEdited(result.conversationId, result);

    return res.status(200).json({
      message: "Cập nhật tin nhắn thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const messageId = parseMessageId(req.params.messageId);
    if (!messageId) {
      return res.status(400).json({ message: "messageId không hợp lệ" });
    }

    const result = await chatService.deleteMessageService({
      messageId,
      userId,
    });

    emitMessageDeleted(result.conversationId, result.messageId);

    return res.status(200).json({
      message: "Xóa tin nhắn thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const getSharedMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId không hợp lệ" });
    }

    const query = sharedQuerySchema.parse(req.query);

    const result = await chatService.getSharedMediaService({
      conversationId,
      userId,
      page: query.page,
      limit: query.limit,
    });

    return res.status(200).json({
      message: "Lấy media của cuộc trò chuyện thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const getSharedFiles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId không hợp lệ" });
    }

    const query = sharedQuerySchema.parse(req.query);

    const result = await chatService.getSharedFilesService({
      conversationId,
      userId,
      page: query.page,
      limit: query.limit,
    });

    return res.status(200).json({
      message: "Lấy file của cuộc trò chuyện thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const getPresence = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const query = presenceQuerySchema.parse(req.query);
    const onlineUserIds = await presenceService.filterOnlineUserIds(
      query.userIds,
    );

    return res.status(200).json({
      message: "Lấy trạng thái online thành công",
      data: { onlineUserIds },
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

const chatSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(255),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const chatSearchHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const addChatSearchHistorySchema = z.object({
  targetUserId: z.coerce.number().int().positive(),
});

export const searchChatUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const query = chatSearchQuerySchema.parse(req.query);
    const data = await chatSearchService.searchChatUsers(
      userId,
      query.q,
      query.page,
      query.limit,
    );

    return res.status(200).json({
      message: "Tìm kiếm thành công",
      data,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const getChatSearchHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const query = chatSearchHistoryQuerySchema.parse(req.query);
    const histories = await chatSearchService.getChatSearchHistory(
      userId,
      query.limit,
    );

    return res.status(200).json({
      message: "Lấy lịch sử tìm kiếm thành công",
      data: histories,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const addChatSearchHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const body = addChatSearchHistorySchema.parse(req.body);
    const histories = await chatSearchService.addChatSearchHistory(
      userId,
      body.targetUserId,
    );

    return res.status(200).json({
      message: "Lưu lịch sử tìm kiếm thành công",
      data: histories,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

const addGroupMembersSchema = z.object({
  userIds: z.array(z.coerce.number().int().positive()).min(1),
});

export const addGroupConversationMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res
        .status(400)
        .json({ message: "ID cuộc trò chuyện không hợp lệ" });
    }

    const body = addGroupMembersSchema.parse(req.body);

    const result = await chatService.addGroupConversationMembersService({
      conversationId,
      userId,
      memberIds: body.userIds,
    });

    joinUsersToConversationRoom(result.addedUserIds, conversationId);

    emitMessageNew(conversationId, result.systemMessage);
    emitMembersUpdated({
      conversationId,
      action: "added",
      affectedUserIds: result.addedUserIds,
      actorUserId: userId,
    });

    return res.status(200).json({
      message: "Thêm thành viên thành công",
      data: result.detail,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const leaveGroupConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res
        .status(400)
        .json({ message: "ID cuộc trò chuyện không hợp lệ" });
    }

    const result = await chatService.leaveGroupConversationService({
      conversationId,
      userId,
    });

    emitMessageNew(conversationId, result.systemMessage);
    emitMembersUpdated({
      conversationId,
      action: "left",
      affectedUserIds: [userId],
      actorUserId: userId,
    });
    leaveUsersFromConversationRoom([userId], conversationId);

    return res.status(200).json({
      message: "Rời nhóm thành công",
      data: { success: true },
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const removeGroupConversationMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res
        .status(400)
        .json({ message: "ID cuộc trò chuyện không hợp lệ" });
    }

    const targetUserId = Number(req.params.userId);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const result = await chatService.removeGroupConversationMemberService({
      conversationId,
      userId,
      targetUserId,
    });

    emitMessageNew(conversationId, result.systemMessage);
    emitMembersUpdated({
      conversationId,
      action: "removed",
      affectedUserIds: [targetUserId],
      actorUserId: userId,
    });
    leaveUsersFromConversationRoom([targetUserId], conversationId);

    return res.status(200).json({
      message: "Xóa thành viên khỏi nhóm thành công",
      data: result.detail,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const deleteGroupConversationAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const conversationId = parseConversationId(req.params.conversationId);
    if (!conversationId) {
      return res
        .status(400)
        .json({ message: "ID cuộc trò chuyện không hợp lệ" });
    }

    const result = await chatService.deleteGroupConversationAvatarService({
      conversationId,
      userId,
    });

    return res.status(200).json({
      message: "Xóa ảnh nhóm thành công",
      data: result,
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};

export const deleteChatSearchHistoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const historyId = Number(req.params.historyId);
    if (!Number.isInteger(historyId) || historyId <= 0) {
      return res.status(400).json({ message: "ID lịch sử không hợp lệ" });
    }

    await chatSearchService.deleteChatSearchHistoryItem(userId, historyId);

    return res.status(200).json({
      message: "Xóa lịch sử tìm kiếm thành công",
    });
  } catch (error) {
    if (!handleError(error, res)) next(error);
  }
};
