import {
  assertConversationMember,
  mapAttachment,
} from "@/modules/chat/services/chat-access.service";
import * as chatRepo from "@/modules/chat/chat.repository";

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

  const [total, attachments] = await Promise.all([
    chatRepo.countSharedMedia(conversationId),
    chatRepo.listSharedMedia(conversationId, skip, limit),
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

  const [total, attachments] = await Promise.all([
    chatRepo.countSharedFiles(conversationId),
    chatRepo.listSharedFiles(conversationId, skip, limit),
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
