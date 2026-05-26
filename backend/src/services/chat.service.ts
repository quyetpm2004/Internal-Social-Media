import {
  AttachmentType,
  ConversationMemberRole,
  ConversationType,
  MediaStatus,
  MessageContentType,
  MessageStatus,
  Prisma,
} from "@prisma/client";
import prisma from "../utils/prisma";
import { getFileUrl } from "./file.service";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_PER_PAGE = 100;
const DEFAULT_MESSAGES_PER_PAGE = 30;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

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

  return {
    items: filteredItems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// Lấy chi tiết cuộc trò chuyện
export const getConversationDetailService = async ({
  conversationId,
  userId,
}: {
  conversationId: number;
  userId: number;
}) => {
  await assertConversationMember(conversationId, userId);

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

  const members = await Promise.all(conversation.members.map(mapMemberUser));

  return { ...display, members };
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

  return {
    items: items.reverse(),
    pagination: {
      limit: take,
      hasMore,
      nextCursor,
    },
  };
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

  return mapMessage(message);
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

  return { messageId };
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

export const CHAT_DEFAULTS = {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_PER_PAGE,
  DEFAULT_MESSAGES_PER_PAGE,
};

export const _internal = {
  findConversationOrThrow,
};
