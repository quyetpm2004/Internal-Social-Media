import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  AttachmentType,
  ConversationMemberRole,
  ConversationType,
  MediaStatus,
  MessageContentType,
  MessageStatus,
  Prisma,
} from "@prisma/client";
import { s3 } from "../lib/s3";
import prisma from "../utils/prisma";
import { getFileUrl } from "./file.service";
import {
  getCachedConversationDetail,
  getCachedConversations,
  getCachedMessages,
  getConversationMemberUserIds,
  invalidateConversationDetail,
  invalidateConversationForMembers,
  invalidateUserConversations,
  setCachedConversationDetail,
  setCachedConversations,
  setCachedMessages,
} from "./redis/chat-cache.service";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_PER_PAGE = 100;
const DEFAULT_MESSAGES_PER_PAGE = 30;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const invalidateConversationCaches = async (conversationId: number) => {
  const memberUserIds = await getConversationMemberUserIds(conversationId);
  await invalidateConversationForMembers(conversationId, memberUserIds);
};

// Include cho member
const memberInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: {
        select: {
          avatarKey: true,
        },
      },
    },
  },
} satisfies Prisma.ConversationMemberInclude;

// Include cho message
const messageInclude = {
  sender: {
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: {
        select: {
          avatarKey: true,
        },
      },
    },
  },
  attachments: true,
} satisfies Prisma.MessageInclude;

type MessageWithIncludes = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

type MemberWithUser = Prisma.ConversationMemberGetPayload<{
  include: typeof memberInclude;
}>;

// Resolve avatar url
const resolveAvatarUrl = async (avatarKey?: string | null) => {
  if (!avatarKey) return null;
  try {
    return await getFileUrl(avatarKey, SIGNED_URL_TTL_SECONDS);
  } catch {
    return null;
  }
};

// Map member user cho display
const mapMemberUser = async (member: MemberWithUser) => ({
  id: member.id,
  role: member.role,
  joinedAt: member.joinedAt,
  lastReadAt: member.lastReadAt,
  isMuted: member.isMuted,
  user: {
    id: member.user.id,
    fullName: member.user.fullName,
    email: member.user.email,
    avatarUrl: await resolveAvatarUrl(member.user.profile?.avatarKey),
  },
});

// Map attachment cho display
const mapAttachment = async (attachment: {
  id: number;
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  attachmentType: AttachmentType;
}) => ({
  id: attachment.id,
  fileName: attachment.fileName,
  mimeType: attachment.mimeType,
  fileSize: attachment.fileSize,
  attachmentType: attachment.attachmentType,
  fileUrl: await resolveAvatarUrl(attachment.fileKey),
});

// Map message cho display
const mapMessage = async (message: MessageWithIncludes) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  contentType: message.contentType,
  content: message.status === MessageStatus.DELETED ? "" : message.content,
  status: message.status,
  editedAt: message.editedAt,
  createdAt: message.createdAt,
  sender: {
    id: message.sender.id,
    fullName: message.sender.fullName,
    avatarUrl: await resolveAvatarUrl(message.sender.profile?.avatarKey),
  },
  attachments: await Promise.all(message.attachments.map(mapAttachment)),
});

// Check xem user có phải là thành viên của cuộc trò chuyện không
const assertConversationMember = async (
  conversationId: number,
  userId: number,
) => {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!member || member.leftAt) {
    throw new Error("Bạn không phải thành viên cuộc trò chuyện này");
  }

  return member;
};

// Tìm cuộc trò chuyện theo id
const findConversationOrThrow = async (conversationId: number) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
  }

  return conversation;
};

const assertGroupConversationAdmin = async (
  conversationId: number,
  userId: number,
) => {
  const conversation = await findConversationOrThrow(conversationId);

  if (conversation.type !== ConversationType.GROUP) {
    throw new Error("Chỉ áp dụng cho nhóm chat");
  }

  const member = await assertConversationMember(conversationId, userId);

  if (member.role !== ConversationMemberRole.ADMIN) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }

  return conversation;
};

// Build display cho cuộc trò chuyện
const buildConversationDisplay = async (
  conversation: {
    id: number;
    type: ConversationType;
    name: string | null;
    avatarKey: string | null;
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  members: MemberWithUser[],
  currentUserId: number,
  lastMessage: MessageWithIncludes | null,
  unreadCount: number,
) => {
  const otherMembers = members.filter((m) => m.user.id !== currentUserId);
  const isDirect = conversation.type === ConversationType.DIRECT;
  const counterpart = isDirect ? otherMembers[0] : null;

  const name = isDirect
    ? (counterpart?.user.fullName ?? "Cuộc trò chuyện")
    : (conversation.name ?? "Nhóm chat");

  const avatarUrl = isDirect
    ? await resolveAvatarUrl(counterpart?.user.profile?.avatarKey)
    : await resolveAvatarUrl(conversation.avatarKey);

  return {
    id: conversation.id,
    type: conversation.type,
    name,
    avatarUrl,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    unreadCount,
    isMuted: members.find((m) => m.user.id === currentUserId)?.isMuted ?? false,
    counterpart: counterpart
      ? {
          id: counterpart.user.id,
          fullName: counterpart.user.fullName,
          avatarUrl: await resolveAvatarUrl(
            counterpart.user.profile?.avatarKey,
          ),
        }
      : null,
    lastMessage: lastMessage ? await mapMessage(lastMessage) : null,
    memberCount: members.length,
  };
};

type ConversationDetailData = Awaited<
  ReturnType<typeof buildConversationDisplay>
> & {
  members: Awaited<ReturnType<typeof mapMemberUser>>[];
};

// Đếm số tin nhắn chưa đọc
const countUnreadMessages = async (
  conversationId: number,
  userId: number,
  lastReadAt: Date | null,
) => {
  return prisma.message.count({
    where: {
      conversationId,
      status: { not: MessageStatus.DELETED },
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  });
};

// Lấy danh sách cuộc trò chuyện
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
    prisma.conversation.count({ where: whereCondition }),
    prisma.conversation.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: [
        { lastMessageAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        members: { include: memberInclude },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          where: { status: { not: MessageStatus.DELETED } },
          include: messageInclude,
        },
      },
    }),
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

// Lấy chi tiết cuộc trò chuyện
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

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: { include: memberInclude },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        where: { status: { not: MessageStatus.DELETED } },
        include: messageInclude,
      },
    },
  });

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
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

// Lấy hoặc tạo cuộc trò chuyện trực tiếp
export const getOrCreateDirectConversationService = async ({
  userId,
  otherUserId,
}: {
  userId: number;
  otherUserId: number;
}) => {
  if (userId === otherUserId) {
    throw new Error("Không thể bắt đầu trò chuyện với chính bạn");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });

  if (!otherUser) {
    throw new Error("Không tìm thấy người dùng");
  }

  // Check xem cuộc trò chuyện đã tồn tại hay chưa
  const existing = await prisma.conversation.findFirst({
    where: {
      type: ConversationType.DIRECT,
      AND: [
        { members: { some: { userId, leftAt: null } } },
        { members: { some: { userId: otherUserId, leftAt: null } } },
      ],
    },
    select: { id: true },
  });

  let conversationId = existing?.id;

  if (!conversationId) {
    const created = await prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        createdById: userId,
        members: {
          create: [
            { userId, role: ConversationMemberRole.MEMBER },
            { userId: otherUserId, role: ConversationMemberRole.MEMBER },
          ],
        },
      },
      select: { id: true },
    });
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
    throw new Error("Vui lòng chọn ít nhất một thành viên");
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true },
  });

  if (users.length !== uniqueMemberIds.length) {
    throw new Error("Một số người dùng được chọn không tồn tại");
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.GROUP,
      name: name.trim(),
      createdById: userId,
      members: {
        create: [
          { userId, role: ConversationMemberRole.ADMIN },
          ...uniqueMemberIds.map((id) => ({
            userId: id,
            role: ConversationMemberRole.MEMBER,
          })),
        ],
      },
    },
    select: { id: true },
  });

  const memberUserIds = [userId, ...uniqueMemberIds];
  await Promise.all(memberUserIds.map((id) => invalidateUserConversations(id)));

  return getConversationDetailService({
    conversationId: conversation.id,
    userId,
  });
};

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

  const take = Math.min(Math.max(limit, 1), MAX_MESSAGES_PER_PAGE);

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

  const items = await Promise.all(sliced.map(mapMessage));

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
}: {
  conversationId: number;
  userId: number;
  content: string;
  contentType: MessageContentType;
  attachmentIds: number[];
}) => {
  await assertConversationMember(conversationId, userId);

  const trimmed = content.trim();

  if (contentType === MessageContentType.TEXT && !trimmed) {
    throw new Error("Nội dung tin nhắn không được để trống");
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Tin nhắn vượt quá ${MAX_MESSAGE_LENGTH} ký tự`);
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
      throw new Error("Một số tệp đính kèm không hợp lệ");
    }
  }

  const now = new Date();

  const message = await prisma.$transaction(async (tx) => {
    // Tạo tin nhắn
    const created = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        contentType,
        content: trimmed,
      },
      include: messageInclude,
    });

    // Cập nhật đính kèm
    if (attachmentIds.length > 0) {
      await tx.messageAttachment.updateMany({
        where: { id: { in: attachmentIds }, uploadedById: userId },
        data: { messageId: created.id, status: MediaStatus.ACTIVE },
      });
    }

    // Cập nhật cuộc trò chuyện
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });

    // Cập nhật thành viên cuộc trò chuyện
    await tx.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: now },
    });

    // Lấy tin nhắn vừa tạo
    return tx.message.findUniqueOrThrow({
      where: { id: created.id },
      include: messageInclude,
    });
  });

  const mapped = await mapMessage(message);
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
    throw new Error("Không tìm thấy tin nhắn");
  }

  if (message.senderId !== userId) {
    throw new Error("Bạn không có quyền chỉnh sửa tin nhắn này");
  }

  if (message.contentType !== MessageContentType.TEXT) {
    throw new Error("Chỉ có thể chỉnh sửa tin nhắn dạng văn bản");
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Nội dung tin nhắn không được để trống");
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Tin nhắn vượt quá ${MAX_MESSAGE_LENGTH} ký tự`);
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
  return mapMessage(updated);
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
    throw new Error("Không tìm thấy tin nhắn");
  }

  if (message.senderId !== userId) {
    throw new Error("Bạn không có quyền xóa tin nhắn này");
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

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { avatarKey },
  });

  await invalidateConversationCaches(conversationId);

  return getConversationDetailService({ conversationId, userId });
};

const getUserDisplayNames = async (userIds: number[]) => {
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true },
  });

  const nameById = new Map(users.map((u) => [u.id, u.fullName]));
  return userIds.map((id) => nameById.get(id) ?? "Người dùng");
};

const formatAddedMembersMessage = (actorName: string, names: string[]) => {
  if (names.length === 0) return `${actorName} đã thêm thành viên vào nhóm`;
  if (names.length === 1) {
    return `${actorName} đã thêm ${names[0]} vào nhóm`;
  }
  if (names.length === 2) {
    return `${actorName} đã thêm ${names[0]} và ${names[1]} vào nhóm`;
  }
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(", ");
  return `${actorName} đã thêm ${rest} và ${last} vào nhóm`;
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
    throw new Error("Nội dung thông báo không hợp lệ");
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

  const mapped = await mapMessage(message);
  await invalidateConversationCaches(conversationId);
  return mapped;
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
    throw new Error("Chỉ áp dụng cho nhóm chat");
  }

  const uniqueMemberIds = Array.from(new Set(memberIds)).filter(
    (id) => id !== userId,
  );

  if (uniqueMemberIds.length === 0) {
    throw new Error("Vui lòng chọn ít nhất một người");
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true },
  });

  if (users.length !== uniqueMemberIds.length) {
    throw new Error("Một số người dùng được chọn không tồn tại");
  }

  const existingMembers = await prisma.conversationMember.findMany({
    where: {
      conversationId,
      userId: { in: uniqueMemberIds },
    },
  });

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
    throw new Error("Tất cả người được chọn đã là thành viên nhóm");
  }

  await prisma.$transaction([
    ...toRejoin.map((targetId) =>
      prisma.conversationMember.update({
        where: {
          conversationId_userId: { conversationId, userId: targetId },
        },
        data: { leftAt: null, joinedAt: new Date() },
      }),
    ),
    ...toCreate.map((targetId) =>
      prisma.conversationMember.create({
        data: {
          conversationId,
          userId: targetId,
          role: ConversationMemberRole.MEMBER,
        },
      }),
    ),
  ]);

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

const promoteNextAdminIfNeeded = async (
  conversationId: number,
  excludingUserId: number,
) => {
  const remainingAdmins = await prisma.conversationMember.count({
    where: {
      conversationId,
      leftAt: null,
      role: ConversationMemberRole.ADMIN,
      userId: { not: excludingUserId },
    },
  });

  if (remainingAdmins > 0) return;

  const nextAdmin = await prisma.conversationMember.findFirst({
    where: {
      conversationId,
      leftAt: null,
      userId: { not: excludingUserId },
      role: ConversationMemberRole.MEMBER,
    },
    orderBy: { joinedAt: "asc" },
  });

  if (nextAdmin) {
    await prisma.conversationMember.update({
      where: { id: nextAdmin.id },
      data: { role: ConversationMemberRole.ADMIN },
    });
  }
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
    throw new Error("Chỉ áp dụng cho nhóm chat");
  }

  const me = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!me || me.leftAt) {
    throw new Error("Bạn không phải thành viên cuộc trò chuyện này");
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

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    data: { leftAt: new Date() },
  });

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
    throw new Error("Vui lòng dùng chức năng rời nhóm");
  }

  const conversation = await findConversationOrThrow(conversationId);

  if (conversation.type !== ConversationType.GROUP) {
    throw new Error("Chỉ áp dụng cho nhóm chat");
  }

  const target = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: targetUserId },
    },
  });

  if (!target || target.leftAt) {
    throw new Error("Không tìm thấy thành viên trong nhóm");
  }

  if (target.role === ConversationMemberRole.ADMIN) {
    const adminCount = await prisma.conversationMember.count({
      where: {
        conversationId,
        leftAt: null,
        role: ConversationMemberRole.ADMIN,
      },
    });

    if (adminCount <= 1) {
      throw new Error("Không thể xóa quản trị viên duy nhất");
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

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: { conversationId, userId: targetUserId },
    },
    data: { leftAt: new Date() },
  });

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

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { avatarKey: null },
  });

  await invalidateConversationCaches(conversationId);

  return getConversationDetailService({ conversationId, userId });
};

export const CHAT_DEFAULTS = {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_PER_PAGE,
  DEFAULT_MESSAGES_PER_PAGE,
};

export const _internal = {
  findConversationOrThrow,
};
