import { Request, Response, NextFunction } from "express";
import z from "zod";
import { MessageContentType } from "@prisma/client";
import * as chatService from "../services/chat.service";

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
