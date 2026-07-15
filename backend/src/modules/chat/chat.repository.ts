import {
  AttachmentType,
  ConversationMemberRole,
  ConversationType,
  MediaStatus,
  MessageContentType,
  MessageStatus,
  Prisma,
  Status,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";
import {
  memberInclude,
  messageInclude,
} from "@/modules/chat/chat.types";

type Db = Prisma.TransactionClient | typeof prisma;

export function runInTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(fn);
}

export function findMember(conversationId: number, userId: number) {
  return prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
}

export function findConversation(conversationId: number) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
  });
}

export function loadConversation(conversationId: number) {
  return prisma.conversation.findUnique({
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
}

export function listConversations(
  where: Prisma.ConversationWhereInput,
  skip: number,
  take: number,
) {
  return prisma.conversation.findMany({
    where,
    skip,
    take,
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
  });
}

export function countConversations(where: Prisma.ConversationWhereInput) {
  return prisma.conversation.count({ where });
}

export function findDirectConversation(userId: number, otherUserId: number) {
  return prisma.conversation.findFirst({
    where: {
      type: ConversationType.DIRECT,
      AND: [
        { members: { some: { userId, leftAt: null } } },
        { members: { some: { userId: otherUserId, leftAt: null } } },
      ],
    },
    select: { id: true },
  });
}

export function insertDirectConversation(userId: number, otherUserId: number) {
  return prisma.conversation.create({
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
}

export function insertGroupConversation(
  userId: number,
  name: string,
  memberIds: number[],
) {
  return prisma.conversation.create({
    data: {
      type: ConversationType.GROUP,
      name,
      createdById: userId,
      members: {
        create: [
          { userId, role: ConversationMemberRole.ADMIN },
          ...memberIds.map((id) => ({
            userId: id,
            role: ConversationMemberRole.MEMBER,
          })),
        ],
      },
    },
    select: { id: true },
  });
}

export function saveConversationAvatar(
  conversationId: number,
  avatarKey: string,
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { avatarKey },
  });
}

export function clearConversationAvatar(conversationId: number) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { avatarKey: null },
  });
}

export function saveLastMessageAt(
  conversationId: number,
  at: Date,
  db: Db = prisma,
) {
  return db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: at },
  });
}

export function listMembersByUserIds(
  conversationId: number,
  userIds: number[],
) {
  return prisma.conversationMember.findMany({
    where: {
      conversationId,
      userId: { in: userIds },
    },
  });
}

export function listMemberUserIds(conversationId: number) {
  return prisma.conversationMember.findMany({
    where: { conversationId, leftAt: null },
    select: { userId: true },
  });
}

export function insertMember(conversationId: number, userId: number) {
  return prisma.conversationMember.create({
    data: {
      conversationId,
      userId,
      role: ConversationMemberRole.MEMBER,
    },
  });
}

export function saveMemberRejoin(conversationId: number, userId: number) {
  return prisma.conversationMember.update({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    data: { leftAt: null, joinedAt: new Date() },
  });
}

// thêm / cho vào lại thành viên trong một transaction
export function applyMemberAdds(
  conversationId: number,
  toCreate: number[],
  toRejoin: number[],
) {
  return prisma.$transaction([
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
}

export function saveMemberLeft(conversationId: number, userId: number) {
  return prisma.conversationMember.update({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    data: { leftAt: new Date() },
  });
}

export function saveMemberRole(
  memberId: number,
  role: ConversationMemberRole,
) {
  return prisma.conversationMember.update({
    where: { id: memberId },
    data: { role },
  });
}

export function saveMemberLastRead(
  conversationId: number,
  userId: number,
  at: Date,
  db: Db = prisma,
) {
  return db.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: at },
  });
}

export function saveMemberMuted(
  conversationId: number,
  userId: number,
  muted: boolean,
) {
  return prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { isMuted: muted },
  });
}

export function countAdmins(
  conversationId: number,
  opts?: { excludingUserId?: number },
) {
  return prisma.conversationMember.count({
    where: {
      conversationId,
      leftAt: null,
      role: ConversationMemberRole.ADMIN,
      ...(opts?.excludingUserId
        ? { userId: { not: opts.excludingUserId } }
        : {}),
    },
  });
}

// thành viên cũ nhất còn lại (để phong admin khi admin cuối rời nhóm)
export function findOldestMember(
  conversationId: number,
  excludingUserId: number,
) {
  return prisma.conversationMember.findFirst({
    where: {
      conversationId,
      leftAt: null,
      userId: { not: excludingUserId },
      role: ConversationMemberRole.MEMBER,
    },
    orderBy: { joinedAt: "asc" },
  });
}

export function listMessages(
  conversationId: number,
  take: number,
  cursor?: number,
) {
  return prisma.message.findMany({
    where: { conversationId },
    take,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: { id: "desc" },
    include: messageInclude,
  });
}

export function findMessage(messageId: number) {
  return prisma.message.findUnique({
    where: { id: messageId },
  });
}

export function loadMessage(db: Db, messageId: number) {
  return db.message.findUniqueOrThrow({
    where: { id: messageId },
    include: messageInclude,
  });
}

export function insertMessage(
  db: Db,
  data: {
    conversationId: number;
    senderId: number;
    contentType: MessageContentType;
    content: string;
  },
) {
  return db.message.create({
    data,
    include: messageInclude,
  });
}

export function saveMessageEdit(messageId: number, content: string) {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      content,
      status: MessageStatus.EDITED,
      editedAt: new Date(),
    },
    include: messageInclude,
  });
}

export function saveMessageDeleted(messageId: number) {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      content: "",
      status: MessageStatus.DELETED,
    },
  });
}

export function countUnread(
  conversationId: number,
  userId: number,
  lastReadAt: Date | null,
) {
  return prisma.message.count({
    where: {
      conversationId,
      status: { not: MessageStatus.DELETED },
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  });
}

export function listPendingAttachments(
  attachmentIds: number[],
  userId: number,
) {
  return prisma.messageAttachment.findMany({
    where: {
      id: { in: attachmentIds },
      uploadedById: userId,
      messageId: null,
    },
    select: { id: true },
  });
}

export function linkAttachmentsToMessage(
  db: Db,
  attachmentIds: number[],
  userId: number,
  messageId: number,
) {
  return db.messageAttachment.updateMany({
    where: { id: { in: attachmentIds }, uploadedById: userId },
    data: { messageId, status: MediaStatus.ACTIVE },
  });
}

export function insertMentions(
  db: Db,
  messageId: number,
  mentionedUserIds: number[],
) {
  return db.messageMention.createMany({
    data: mentionedUserIds.map((mentionedUserId) => ({
      messageId,
      mentionedUserId,
    })),
    skipDuplicates: true,
  });
}

export function countSharedMedia(conversationId: number) {
  return prisma.messageAttachment.count({
    where: {
      attachmentType: { in: [AttachmentType.IMAGE, AttachmentType.VIDEO] },
      message: {
        conversationId,
        status: { not: MessageStatus.DELETED },
      },
    },
  });
}

export function listSharedMedia(
  conversationId: number,
  skip: number,
  take: number,
) {
  return prisma.messageAttachment.findMany({
    where: {
      attachmentType: { in: [AttachmentType.IMAGE, AttachmentType.VIDEO] },
      message: {
        conversationId,
        status: { not: MessageStatus.DELETED },
      },
    },
    skip,
    take,
    orderBy: { uploadedAt: "desc" },
  });
}

export function countSharedFiles(conversationId: number) {
  return prisma.messageAttachment.count({
    where: {
      attachmentType: AttachmentType.FILE,
      message: {
        conversationId,
        status: { not: MessageStatus.DELETED },
      },
    },
  });
}

export function listSharedFiles(
  conversationId: number,
  skip: number,
  take: number,
) {
  return prisma.messageAttachment.findMany({
    where: {
      attachmentType: AttachmentType.FILE,
      message: {
        conversationId,
        status: { not: MessageStatus.DELETED },
      },
    },
    skip,
    take,
    orderBy: { uploadedAt: "desc" },
  });
}

export function listUsersForSearch(
  where: Prisma.UserWhereInput,
  skip: number,
  take: number,
) {
  return prisma.user.findMany({
    where,
    skip,
    take,
    select: {
      id: true,
      fullName: true,
      profile: { select: { avatarKey: true } },
    },
    orderBy: { fullName: "asc" },
  });
}

export function countUsersForSearch(where: Prisma.UserWhereInput) {
  return prisma.user.count({ where });
}

export function listSearchHistory(userId: number, take: number) {
  return prisma.chatSearchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "desc" },
    take,
    select: {
      id: true,
      searchedAt: true,
      targetUser: {
        select: {
          id: true,
          fullName: true,
          profile: { select: { avatarKey: true } },
        },
      },
    },
  });
}

export function saveSearchHistory(userId: number, targetUserId: number) {
  return prisma.chatSearchHistory.upsert({
    where: {
      userId_targetUserId: { userId, targetUserId },
    },
    create: { userId, targetUserId },
    update: { searchedAt: new Date() },
  });
}

export function countSearchHistory(userId: number) {
  return prisma.chatSearchHistory.count({ where: { userId } });
}

export function listOldestSearchHistory(userId: number, take: number) {
  return prisma.chatSearchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "asc" },
    take,
    select: { id: true },
  });
}

export function deleteSearchHistoryRows(ids: number[]) {
  return prisma.chatSearchHistory.deleteMany({
    where: { id: { in: ids } },
  });
}

export function deleteSearchHistoryItem(userId: number, historyId: number) {
  return prisma.chatSearchHistory.deleteMany({
    where: { id: historyId, userId },
  });
}

export function findUserId(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
}

export function listUserIds(userIds: number[]) {
  return prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });
}

export function listUserNames(userIds: number[]) {
  return prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true },
  });
}

export function findActiveUserId(userId: number) {
  return prisma.user.findFirst({
    where: { id: userId, status: Status.ACTIVE },
    select: { id: true },
  });
}
