import {
  MediaStatus,
  MessageContentType,
  MessageStatus,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { CHAT_DEFAULTS } from "@/modules/chat/chat.types";
import {
  assertConversationMember,
  invalidateConversationCaches,
  mapMessage,
  messageInclude,
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
import prisma from "@/shared/utils/prisma";

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

  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: take + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: { id: "desc" },
    include: messageInclude,
  });

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
    const attachments = await prisma.messageAttachment.findMany({
      where: {
        id: { in: attachmentIds },
        uploadedById: userId,
        messageId: null,
      },
      select: { id: true },
    });

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

  const message = await prisma.$transaction(async (tx) => {
    const messageContent =
      contentType === MessageContentType.POLL
        ? poll!.question
        : trimmed;

    const created = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        contentType,
        content: messageContent,
      },
      include: messageInclude,
    });

    if (attachmentIds.length > 0) {
      await tx.messageAttachment.updateMany({
        where: { id: { in: attachmentIds }, uploadedById: userId },
        data: { messageId: created.id, status: MediaStatus.ACTIVE },
      });
    }

    if (contentType === MessageContentType.POLL && poll) {
      await createPollInTransaction(tx, {
        ...poll,
        messageId: created.id,
      });
    }

    if (uniqueMentionedUserIds.length > 0) {
      await tx.messageMention.createMany({
        data: uniqueMentionedUserIds.map((mentionedUserId) => ({
          messageId: created.id,
          mentionedUserId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });

    await tx.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: now },
    });

    return tx.message.findUniqueOrThrow({
      where: { id: created.id },
      include: messageInclude,
    });
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

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: now },
  });

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

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { isMuted: muted },
  });

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
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

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

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: trimmed,
      status: MessageStatus.EDITED,
      editedAt: new Date(),
    },
    include: messageInclude,
  });

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
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message || message.status === MessageStatus.DELETED) {
    throw new AppError(404, "Không tìm thấy tin nhắn");
  }

  if (message.senderId !== userId) {
    throw new AppError(403, "Bạn không có quyền xóa tin nhắn này");
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      content: "",
      status: MessageStatus.DELETED,
    },
  });

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

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        senderId: actorUserId,
        contentType: MessageContentType.SYSTEM,
        content: trimmed,
      },
      include: messageInclude,
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });

    return created;
  });

  const mapped = await mapMessage(message, actorUserId);
  await invalidateConversationCaches(conversationId);
  return mapped;
};
