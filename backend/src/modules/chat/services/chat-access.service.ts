import {
  AttachmentType,
  ConversationMemberRole,
  ConversationType,
  MessageStatus,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getFileUrl } from "@/modules/file/file.service";
import {
  CHAT_DEFAULTS,
  memberInclude,
  messageInclude,
  type MemberWithUser,
  type MessageWithIncludes,
} from "@/modules/chat/chat.types";
import {
  getConversationMemberUserIds,
  invalidateConversationForMembers,
} from "@/modules/chat/services/chat-cache.service";
import prisma from "@/shared/utils/prisma";

export const resolveAvatarUrl = async (avatarKey?: string | null) => {
  if (!avatarKey) return null;
  try {
    return await getFileUrl(avatarKey, CHAT_DEFAULTS.SIGNED_URL_TTL_SECONDS);
  } catch {
    return null;
  }
};

export const mapMemberUser = async (member: MemberWithUser) => ({
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

export const mapAttachment = async (attachment: {
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

export const mapMessage = async (message: MessageWithIncludes) => ({
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

export const assertConversationMember = async (
  conversationId: number,
  userId: number,
) => {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!member || member.leftAt) {
    throw new AppError(
      403,
      "Bạn không phải thành viên cuộc trò chuyện này",
    );
  }

  return member;
};

export const findConversationOrThrow = async (conversationId: number) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError(404, "Không tìm thấy cuộc trò chuyện");
  }

  return conversation;
};

export const assertGroupConversationAdmin = async (
  conversationId: number,
  userId: number,
) => {
  const conversation = await findConversationOrThrow(conversationId);

  if (conversation.type !== ConversationType.GROUP) {
    throw new AppError(400, "Chỉ áp dụng cho nhóm chat");
  }

  const member = await assertConversationMember(conversationId, userId);

  if (member.role !== ConversationMemberRole.ADMIN) {
    throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
  }

  return conversation;
};

export const buildConversationDisplay = async (
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

export type ConversationDetailData = Awaited<
  ReturnType<typeof buildConversationDisplay>
> & {
  members: Awaited<ReturnType<typeof mapMemberUser>>[];
};

export const countUnreadMessages = async (
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

export const invalidateConversationCaches = async (conversationId: number) => {
  const memberUserIds = await getConversationMemberUserIds(conversationId);
  await invalidateConversationForMembers(conversationId, memberUserIds);
};

export const getUserDisplayNames = async (userIds: number[]) => {
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true },
  });

  const nameById = new Map(users.map((u) => [u.id, u.fullName]));
  return userIds.map((id) => nameById.get(id) ?? "Người dùng");
};

export const formatAddedMembersMessage = (
  actorName: string,
  names: string[],
) => {
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

export const promoteNextAdminIfNeeded = async (
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

export { memberInclude, messageInclude };
