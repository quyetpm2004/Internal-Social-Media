import {
  MessageContentType,
  MessageStatus,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { CHAT_DEFAULTS } from "@/modules/chat/chat.types";
import * as chatRepo from "@/modules/chat/chat.repository";
import {
  assertConversationMember,
  invalidateConversationCaches,
  mapMessage,
} from "@/modules/chat/services/chat-access.service";
import {
  getCachedMessages,
  invalidateConversationDetail,
  invalidateUserConversations,
  setCachedMessages,
} from "@/modules/chat/services/chat-cache.service";
import type { PollInput } from "@/modules/poll/poll.schema";
import { createPollInTransaction } from "@/modules/poll/poll.service";
import { notifyMessageMentions } from "@/modules/notification/notification.service";
import {
  assertMentionedUsersExist,
  assertMentionedUsersInConversation,
  resolveMentionTargets,
} from "@/shared/utils/mentions";

export const getMessagesService = async ({
  conversationId,
  userId,
  cursor,
  limit,
}: {
  conversationId: number;
  userId: number;
  cursor?: number;
  limit: number;
}) => {
  await assertConversationMember(conversationId, userId);

  const take = Math.min(
    Math.max(limit, 1),
    CHAT_DEFAULTS.MAX_MESSAGES_PER_PAGE,
  );

  const cached = await getCachedMessages<{
    items: Awaited<ReturnType<typeof mapMessage>>[];
    pagination: {
      limit: number;
      hasMore: boolean;
      nextCursor: number | null;
    };
  }>(conversationId, cursor, take);
  if (cached) {
    return cached;
  }

  const messages = await chatRepo.listMessages(
    conversationId,
    take + 1,
    cursor,
  );

  const hasMore = messages.length > take;
  const sliced = hasMore ? messages.slice(0, take) : messages;
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  const items = await Promise.all(sliced.map((m) => mapMessage(m, userId)));

  const result = {
    items: items.reverse(),
    pagination: {
      limit: take,
      hasMore,
      nextCursor,
    },
  };

  await setCachedMessages(conversationId, cursor, take, result);
  return result;
};

export const sendMessageService = async ({
  conversationId,
  userId,
  content,
  contentType,
  attachmentIds,
  mentionedUserIds = [],
  mentionAll = false,
  poll,
}: {
  conversationId: number;
  userId: number;
  content: string;
  contentType: MessageContentType;
  attachmentIds: number[];
  mentionedUserIds?: number[];
  mentionAll?: boolean;
  poll?: PollInput;
}) => {
  await assertConversationMember(conversationId, userId);

  const trimmed = content.trim();

  if (contentType === MessageContentType.POLL) {
    if (!poll) {
      throw new AppError(400, "Thiếu thông tin bình chọn");
    }
  } else if (contentType === MessageContentType.TEXT && !trimmed) {
    throw new AppError(400, "Nội dung tin nhắn không được để trống");
  }

  if (trimmed.length > CHAT_DEFAULTS.MAX_MESSAGE_LENGTH) {
    throw new AppError(
      400,
      `Tin nhắn vượt quá ${CHAT_DEFAULTS.MAX_MESSAGE_LENGTH} ký tự`,
    );
  }

  if (attachmentIds.length > 0) {
    const attachments = await chatRepo.listPendingAttachments(
      attachmentIds,
      userId,
    );

    if (attachments.length !== attachmentIds.length) {
      throw new AppError(400, "Một số tệp đính kèm không hợp lệ");
    }
  }

  const uniqueMentionedUserIds = await resolveMentionTargets({
    mentionAll,
    mentionedUserIds,
    actorId: userId,
    conversationId,
  });
  await assertMentionedUsersExist(uniqueMentionedUserIds);
  await assertMentionedUsersInConversation(
    conversationId,
    uniqueMentionedUserIds,
  );

  const now = new Date();

  const message = await chatRepo.runInTx(async (tx) => {
    const messageContent =
      contentType === MessageContentType.POLL
        ? poll!.question
        : trimmed;

    const created = await chatRepo.insertMessage(tx, {
      conversationId,
      senderId: userId,
      contentType,
      content: messageContent,
    });

    if (attachmentIds.length > 0) {
      await chatRepo.linkAttachmentsToMessage(
        tx,
        attachmentIds,
        userId,
        created.id,
      );
    }

    if (contentType === MessageContentType.POLL && poll) {
      await createPollInTransaction(tx, {
        ...poll,
        messageId: created.id,
      });
    }

    if (uniqueMentionedUserIds.length > 0) {
      await chatRepo.insertMentions(tx, created.id, uniqueMentionedUserIds);
    }

    await chatRepo.saveLastMessageAt(conversationId, now, tx);
    await chatRepo.saveMemberLastRead(conversationId, userId, now, tx);

    return chatRepo.loadMessage(tx, created.id);
  });

  const mapped = await mapMessage(message, userId);
  if (uniqueMentionedUserIds.length > 0) {
    await notifyMessageMentions(
      conversationId,
      message.id,
      userId,
      uniqueMentionedUserIds,
      message.content,
    );
  }
  await invalidateConversationCaches(conversationId);
  return mapped;
};

export const markConversationReadService = async ({
  conversationId,
  userId,
}: {
  conversationId: number;
  userId: number;
}) => {
  await assertConversationMember(conversationId, userId);

  const now = new Date();

  await chatRepo.saveMemberLastRead(conversationId, userId, now);

  await invalidateUserConversations(userId);

  return { conversationId, lastReadAt: now };
};

export const setConversationMutedService = async ({
  conversationId,
  userId,
  muted,
}: {
  conversationId: number;
  userId: number;
  muted: boolean;
}) => {
  await assertConversationMember(conversationId, userId);

  await chatRepo.saveMemberMuted(conversationId, userId, muted);

  await invalidateUserConversations(userId);
  await invalidateConversationDetail(conversationId);

  return { conversationId, isMuted: muted };
};

export const editMessageService = async ({
  messageId,
  userId,
  content,
}: {
  messageId: number;
  userId: number;
  content: string;
}) => {
  const message = await chatRepo.findMessage(messageId);

  if (!message || message.status === MessageStatus.DELETED) {
    throw new AppError(404, "Không tìm thấy tin nhắn");
  }

  if (message.senderId !== userId) {
    throw new AppError(403, "Bạn không có quyền chỉnh sửa tin nhắn này");
  }

  if (message.contentType !== MessageContentType.TEXT) {
    throw new AppError(400, "Chỉ có thể chỉnh sửa tin nhắn dạng văn bản");
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new AppError(400, "Nội dung tin nhắn không được để trống");
  }

  if (trimmed.length > CHAT_DEFAULTS.MAX_MESSAGE_LENGTH) {
    throw new AppError(
      400,
      `Tin nhắn vượt quá ${CHAT_DEFAULTS.MAX_MESSAGE_LENGTH} ký tự`,
    );
  }

  const updated = await chatRepo.saveMessageEdit(messageId, trimmed);

  await invalidateConversationCaches(message.conversationId);
  return mapMessage(updated, userId);
};

export const deleteMessageService = async ({
  messageId,
  userId,
}: {
  messageId: number;
  userId: number;
}) => {
  const message = await chatRepo.findMessage(messageId);

  if (!message || message.status === MessageStatus.DELETED) {
    throw new AppError(404, "Không tìm thấy tin nhắn");
  }

  if (message.senderId !== userId) {
    throw new AppError(403, "Bạn không có quyền xóa tin nhắn này");
  }

  await chatRepo.saveMessageDeleted(messageId);

  await invalidateConversationCaches(message.conversationId);
  return { messageId, conversationId: message.conversationId };
};

export const createSystemMessageService = async ({
  conversationId,
  actorUserId,
  content,
}: {
  conversationId: number;
  actorUserId: number;
  content: string;
}) => {
  await assertConversationMember(conversationId, actorUserId);

  const trimmed = content.trim();
  if (!trimmed) {
    throw new AppError(400, "Nội dung thông báo không hợp lệ");
  }

  const now = new Date();

  const message = await chatRepo.runInTx(async (tx) => {
    const created = await chatRepo.insertMessage(tx, {
      conversationId,
      senderId: actorUserId,
      contentType: MessageContentType.SYSTEM,
      content: trimmed,
    });

    await chatRepo.saveLastMessageAt(conversationId, now, tx);

    return created;
  });

  const mapped = await mapMessage(message, actorUserId);
  await invalidateConversationCaches(conversationId);
  return mapped;
};
