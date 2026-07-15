import { Prisma } from "@prisma/client";
import prisma from "@/shared/utils/prisma";

export const notificationInclude = {
  actor: {
    select: {
      id: true,
      fullName: true,
      profile: { select: { avatarKey: true } },
    },
  },
  post: {
    select: {
      id: true,
      content: true,
      groupId: true,
      isAnonymous: true,
      userId: true,
    },
  },
  comment: {
    select: {
      id: true,
      content: true,
      isAnonymous: true,
      userId: true,
    },
  },
  group: {
    select: {
      id: true,
      groupName: true,
    },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationWithInclude = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

export function createNotificationRecord(data: {
  recipientId: number;
  actorId?: number | null;
  type: Prisma.NotificationCreateInput["type"];
  postId?: number | null;
  commentId?: number | null;
  groupId?: number | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      actorId: data.actorId ?? null,
      type: data.type,
      postId: data.postId ?? null,
      commentId: data.commentId ?? null,
      groupId: data.groupId ?? null,
      metadata: data.metadata ?? undefined,
    },
    include: notificationInclude,
  });
}

export function getPostOwnerContent(postId: number) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      content: true,
      groupId: true,
      isAnonymous: true,
      status: true,
      group: { select: { groupName: true } },
    },
  });
}

export function getCommentOwnerContent(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      userId: true,
      content: true,
      isAnonymous: true,
    },
  });
}

export function getCommentSnippet(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: { content: true, isAnonymous: true },
  });
}

export function getCommentAuthor(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
}

export function getPostGroupId(postId: number) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: { groupId: true },
  });
}

export function getGroupName(groupId: number) {
  return prisma.group.findUnique({
    where: { id: groupId },
    select: { groupName: true },
  });
}

export function getMemberWithGroup(groupId: number, userId: number) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: {
      userId: true,
      group: { select: { groupName: true } },
    },
  });
}

export function countUnread(userId: number) {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      readAt: null,
    },
  });
}

export function listByUser(userId: number, skip: number, take: number) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: notificationInclude,
  });
}

export function countByUser(userId: number) {
  return prisma.notification.count({
    where: { recipientId: userId },
  });
}

export function getOwnedNotification(notificationId: number, userId: number) {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientId: userId,
    },
  });
}

export function markRead(notificationId: number) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

export function markAllRead(userId: number) {
  return prisma.notification.updateMany({
    where: {
      recipientId: userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}
