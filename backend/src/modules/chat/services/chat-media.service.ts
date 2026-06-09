import { AttachmentType, MessageStatus, Prisma } from "@prisma/client";
import {
  assertConversationMember,
  mapAttachment,
} from "@/modules/chat/services/chat-access.service";
import prisma from "@/shared/utils/prisma";

export const getSharedMediaService = async ({
  conversationId,
  userId,
  page,
  limit,
}: {
  conversationId: number;
  userId: number;
  page: number;
  limit: number;
}) => {
  await assertConversationMember(conversationId, userId);

  const skip = (page - 1) * limit;

  const where: Prisma.MessageAttachmentWhereInput = {
    attachmentType: { in: [AttachmentType.IMAGE, AttachmentType.VIDEO] },
    message: {
      conversationId,
      status: { not: MessageStatus.DELETED },
    },
  };

  const [total, attachments] = await Promise.all([
    prisma.messageAttachment.count({ where }),
    prisma.messageAttachment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  const items = await Promise.all(attachments.map(mapAttachment));

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const getSharedFilesService = async ({
  conversationId,
  userId,
  page,
  limit,
}: {
  conversationId: number;
  userId: number;
  page: number;
  limit: number;
}) => {
  await assertConversationMember(conversationId, userId);

  const skip = (page - 1) * limit;

  const where: Prisma.MessageAttachmentWhereInput = {
    attachmentType: AttachmentType.FILE,
    message: {
      conversationId,
      status: { not: MessageStatus.DELETED },
    },
  };

  const [total, attachments] = await Promise.all([
    prisma.messageAttachment.count({ where }),
    prisma.messageAttachment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  const items = await Promise.all(attachments.map(mapAttachment));

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};
