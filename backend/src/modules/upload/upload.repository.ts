import prisma from "@/shared/utils/prisma";

type AttachmentKind = "IMAGE" | "VIDEO" | "FILE";

export function createPendingPostAttachment(data: {
  fileName: string;
  fileKey: string;
  attachmentType: AttachmentKind;
  mimeType: string;
  uploadedById: number;
  fileSize: number;
}) {
  return prisma.postAttachment.create({
    data: {
      ...data,
      status: "PENDING",
    },
  });
}

export function createPendingMessageAttachment(data: {
  fileName: string;
  fileKey: string;
  attachmentType: AttachmentKind;
  mimeType: string;
  uploadedById: number;
  fileSize: number;
}) {
  return prisma.messageAttachment.create({
    data: {
      ...data,
      status: "PENDING",
    },
  });
}

export function upsertAvatarKey(userId: number, avatarKey: string) {
  return prisma.profile.upsert({
    where: { userId },
    update: { avatarKey },
    create: { userId, avatarKey },
  });
}

export function getConversationType(conversationId: number) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { type: true },
  });
}

export function getConversationMember(conversationId: number, userId: number) {
  return prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    select: { role: true, leftAt: true },
  });
}

export function updateConversationAvatar(
  conversationId: number,
  avatarKey: string,
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { avatarKey },
  });
}

export function updateGroupCover(groupId: number, coverKey: string) {
  return prisma.group.update({
    where: { id: groupId },
    data: { coverKey },
  });
}

export function getPendingMessageAttachment(attachmentId: number) {
  return prisma.messageAttachment.findFirst({
    where: { id: attachmentId, status: "PENDING" },
  });
}

export function markMessageAttachmentReady(
  attachmentId: number,
  mimeType: string,
  fileSize: number,
) {
  return prisma.messageAttachment.update({
    where: { id: attachmentId },
    data: {
      mimeType,
      fileSize,
      status: "READY",
    },
  });
}

export function getPendingPostAttachment(attachmentId: number) {
  return prisma.postAttachment.findFirst({
    where: { id: attachmentId, status: "PENDING" },
  });
}

export function markPostAttachmentReady(
  attachmentId: number,
  mimeType: string,
  fileSize: number,
) {
  return prisma.postAttachment.update({
    where: { id: attachmentId },
    data: {
      mimeType,
      fileSize,
      status: "READY",
    },
  });
}
