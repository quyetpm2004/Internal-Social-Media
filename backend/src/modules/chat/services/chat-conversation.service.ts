import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  ConversationMemberRole,
  ConversationType,
  Prisma,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { s3 } from "@/shared/lib/s3";
import * as chatRepo from "@/modules/chat/chat.repository";
import {
  assertConversationMember,
  assertGroupConversationAdmin,
  buildConversationDisplay,
  countUnreadMessages,
  findConversationOrThrow,
  formatAddedMembersMessage,
  getUserDisplayNames,
  invalidateConversationCaches,
  mapMemberUser,
  promoteNextAdminIfNeeded,
  type ConversationDetailData,
} from "@/modules/chat/services/chat-access.service";
import {
  getCachedConversationDetail,
  getCachedConversations,
  invalidateUserConversations,
  setCachedConversationDetail,
  setCachedConversations,
} from "@/modules/chat/services/chat-cache.service";
import { createSystemMessageService } from "@/modules/chat/services/chat-message.service";

export const listConversationsService = async ({
  userId,
  filter,
  page,
  limit,
}: {
  userId: number;
  filter?: "ALL" | "UNREAD" | "GROUPS";
  page: number;
  limit: number;
}) => {
  const normalizedFilter = filter ?? "ALL";
  const cached = await getCachedConversations<{
    items: Awaited<ReturnType<typeof buildConversationDisplay>>[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(userId, normalizedFilter, page, limit);

  if (cached) {
    return cached;
  }

  const skip = (page - 1) * limit;

  const whereCondition: Prisma.ConversationWhereInput = {
    members: {
      some: {
        userId,
        leftAt: null,
      },
    },
    ...(filter === "GROUPS" ? { type: ConversationType.GROUP } : {}),
  };

  const [total, conversations] = await Promise.all([
    chatRepo.countConversations(whereCondition),
    chatRepo.listConversations(whereCondition, skip, limit),
  ]);

  const items = await Promise.all(
    conversations.map(async (conversation) => {
      const me = conversation.members.find((m) => m.userId === userId);
      const unreadCount = me
        ? await countUnreadMessages(conversation.id, userId, me.lastReadAt)
        : 0;

      return buildConversationDisplay(
        conversation,
        conversation.members,
        userId,
        conversation.messages[0] ?? null,
        unreadCount,
      );
    }),
  );

  const filteredItems =
    filter === "UNREAD" ? items.filter((c) => c.unreadCount > 0) : items;

  const result = {
    items: filteredItems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };

  await setCachedConversations(userId, normalizedFilter, page, limit, result);

  return result;
};

export const getConversationDetailService = async ({
  conversationId,
  userId,
}: {
  conversationId: number;
  userId: number;
}): Promise<ConversationDetailData> => {
  await assertConversationMember(conversationId, userId);

  const cached = await getCachedConversationDetail<ConversationDetailData>(
    conversationId,
    userId,
  );
  if (cached) {
    return cached;
  }

  const conversation = await chatRepo.loadConversation(conversationId);

  if (!conversation) {
    throw new AppError(404, "Không tìm thấy cuộc trò chuyện");
  }

  const me = conversation.members.find((m) => m.userId === userId);
  const unreadCount = me
    ? await countUnreadMessages(conversation.id, userId, me.lastReadAt)
    : 0;

  const display = await buildConversationDisplay(
    conversation,
    conversation.members,
    userId,
    conversation.messages[0] ?? null,
    unreadCount,
  );

  const activeMembers = conversation.members.filter((m) => !m.leftAt);
  const members = await Promise.all(activeMembers.map(mapMemberUser));

  const result = { ...display, members, memberCount: activeMembers.length };
  await setCachedConversationDetail(conversationId, userId, result);
  return result;
};

export const getOrCreateDirectConversationService = async ({
  userId,
  otherUserId,
}: {
  userId: number;
  otherUserId: number;
}) => {
  if (userId === otherUserId) {
    throw new AppError(400, "Không thể bắt đầu trò chuyện với chính bạn");
  }

  const otherUser = await chatRepo.findUserId(otherUserId);

  if (!otherUser) {
    throw new AppError(404, "Không tìm thấy người dùng");
  }

  const existing = await chatRepo.findDirectConversation(userId, otherUserId);

  let conversationId = existing?.id;

  if (!conversationId) {
    const created = await chatRepo.insertDirectConversation(
      userId,
      otherUserId,
    );
    conversationId = created.id;
    await invalidateUserConversations(userId);
    await invalidateUserConversations(otherUserId);
  }

  return getConversationDetailService({ conversationId, userId });
};

export const createGroupConversationService = async ({
  userId,
  name,
  memberIds,
}: {
  userId: number;
  name: string;
  memberIds: number[];
}) => {
  const uniqueMemberIds = Array.from(new Set(memberIds)).filter(
    (id) => id !== userId,
  );

  if (uniqueMemberIds.length === 0) {
    throw new AppError(400, "Vui lòng chọn ít nhất một thành viên");
  }

  const users = await chatRepo.listUserIds(uniqueMemberIds);

  if (users.length !== uniqueMemberIds.length) {
    throw new AppError(400, "Một số người dùng được chọn không tồn tại");
  }

  const conversation = await chatRepo.insertGroupConversation(
    userId,
    name.trim(),
    uniqueMemberIds,
  );

  const memberUserIds = [userId, ...uniqueMemberIds];
  await Promise.all(memberUserIds.map((id) => invalidateUserConversations(id)));

  return getConversationDetailService({
    conversationId: conversation.id,
    userId,
  });
};

export const updateGroupConversationAvatarService = async ({
  conversationId,
  userId,
  avatarKey,
}: {
  conversationId: number;
  userId: number;
  avatarKey: string;
}) => {
  await assertGroupConversationAdmin(conversationId, userId);

  await chatRepo.saveConversationAvatar(conversationId, avatarKey);

  await invalidateConversationCaches(conversationId);

  return getConversationDetailService({ conversationId, userId });
};

export const addGroupConversationMembersService = async ({
  conversationId,
  userId,
  memberIds,
}: {
  conversationId: number;
  userId: number;
  memberIds: number[];
}) => {
  await assertConversationMember(conversationId, userId);

  const conversation = await findConversationOrThrow(conversationId);

  if (conversation.type !== ConversationType.GROUP) {
    throw new AppError(400, "Chỉ áp dụng cho nhóm chat");
  }

  const uniqueMemberIds = Array.from(new Set(memberIds)).filter(
    (id) => id !== userId,
  );

  if (uniqueMemberIds.length === 0) {
    throw new AppError(400, "Vui lòng chọn ít nhất một người");
  }

  const users = await chatRepo.listUserIds(uniqueMemberIds);

  if (users.length !== uniqueMemberIds.length) {
    throw new AppError(400, "Một số người dùng được chọn không tồn tại");
  }

  const existingMembers = await chatRepo.listMembersByUserIds(
    conversationId,
    uniqueMemberIds,
  );

  const existingByUserId = new Map(existingMembers.map((m) => [m.userId, m]));

  const toCreate: number[] = [];
  const toRejoin: number[] = [];

  for (const targetId of uniqueMemberIds) {
    const existing = existingByUserId.get(targetId);
    if (!existing) {
      toCreate.push(targetId);
    } else if (existing.leftAt) {
      toRejoin.push(targetId);
    }
  }

  if (toCreate.length === 0 && toRejoin.length === 0) {
    throw new AppError(400, "Tất cả người được chọn đã là thành viên nhóm");
  }

  await chatRepo.applyMemberAdds(conversationId, toCreate, toRejoin);

  const allAffected = [...toCreate, ...toRejoin, userId];
  await Promise.all(
    Array.from(new Set(allAffected)).map((id) =>
      invalidateUserConversations(id),
    ),
  );
  await invalidateConversationCaches(conversationId);

  const addedUserIds = [...toCreate, ...toRejoin];
  const [actorName, addedNames] = await Promise.all([
    getUserDisplayNames([userId]).then((n) => n[0]),
    getUserDisplayNames(addedUserIds),
  ]);

  const systemMessage = await createSystemMessageService({
    conversationId,
    actorUserId: userId,
    content: formatAddedMembersMessage(actorName, addedNames),
  });

  return {
    detail: await getConversationDetailService({ conversationId, userId }),
    addedUserIds,
    systemMessage,
  };
};

export const leaveGroupConversationService = async ({
  conversationId,
  userId,
}: {
  conversationId: number;
  userId: number;
}) => {
  await assertConversationMember(conversationId, userId);

  const conversation = await findConversationOrThrow(conversationId);

  if (conversation.type !== ConversationType.GROUP) {
    throw new AppError(400, "Chỉ áp dụng cho nhóm chat");
  }

  const me = await chatRepo.findMember(conversationId, userId);

  if (!me || me.leftAt) {
    throw new AppError(403, "Bạn không phải thành viên cuộc trò chuyện này");
  }

  if (me.role === ConversationMemberRole.ADMIN) {
    await promoteNextAdminIfNeeded(conversationId, userId);
  }

  const [actorName] = await getUserDisplayNames([userId]);

  const systemMessage = await createSystemMessageService({
    conversationId,
    actorUserId: userId,
    content: `${actorName} đã rời nhóm`,
  });

  await chatRepo.saveMemberLeft(conversationId, userId);

  await invalidateUserConversations(userId);
  await invalidateConversationCaches(conversationId);

  return { success: true, systemMessage };
};

export const removeGroupConversationMemberService = async ({
  conversationId,
  userId,
  targetUserId,
}: {
  conversationId: number;
  userId: number;
  targetUserId: number;
}) => {
  await assertGroupConversationAdmin(conversationId, userId);

  if (targetUserId === userId) {
    throw new AppError(400, "Vui lòng dùng chức năng rời nhóm");
  }

  const conversation = await findConversationOrThrow(conversationId);

  if (conversation.type !== ConversationType.GROUP) {
    throw new AppError(400, "Chỉ áp dụng cho nhóm chat");
  }

  const target = await chatRepo.findMember(conversationId, targetUserId);

  if (!target || target.leftAt) {
    throw new AppError(404, "Không tìm thấy thành viên trong nhóm");
  }

  if (target.role === ConversationMemberRole.ADMIN) {
    const adminCount = await chatRepo.countAdmins(conversationId);

    if (adminCount <= 1) {
      throw new AppError(400, "Không thể xóa quản trị viên duy nhất");
    }
  }

  const [actorName, targetName] = await getUserDisplayNames([
    userId,
    targetUserId,
  ]);

  const systemMessage = await createSystemMessageService({
    conversationId,
    actorUserId: userId,
    content: `${actorName} đã xóa ${targetName} khỏi nhóm`,
  });

  await chatRepo.saveMemberLeft(conversationId, targetUserId);

  await invalidateUserConversations(targetUserId);
  await invalidateConversationCaches(conversationId);

  const detail = await getConversationDetailService({ conversationId, userId });

  return { detail, systemMessage };
};

export const deleteGroupConversationAvatarService = async ({
  conversationId,
  userId,
}: {
  conversationId: number;
  userId: number;
}) => {
  const conversation = await assertGroupConversationAdmin(
    conversationId,
    userId,
  );

  if (conversation.avatarKey) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: conversation.avatarKey,
        }),
      );
    } catch {
      /* ignore S3 errors */
    }
  }

  await chatRepo.clearConversationAvatar(conversationId);

  await invalidateConversationCaches(conversationId);

  return getConversationDetailService({ conversationId, userId });
};
