import {
  GroupMemberRole,
  GroupMemberStatus,
  NotificationType,
  Prisma,
  ReactionType,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";
import {
  getGroupViewerContext,
  maskUserForGroupDisplay,
  shouldHideAnonymousAuthor,
} from "@/shared/utils/group-anonymous";
import {
  emitNotificationNew,
  emitNotificationUnreadCount,
} from "@/socket/notification.socket";
import { htmlToText } from "html-to-text";

const NOTIFICATION_INCLUDE = {
  actor: {
    select: {
      id: true,
      fullName: true,
      profile: {
        select: {
          avatarKey: true,
        },
      },
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

type CreateNotificationInput = {
  recipientId: number;
  actorId?: number | null;
  type: NotificationType;
  postId?: number | null;
  commentId?: number | null;
  groupId?: number | null;
  metadata?: Prisma.InputJsonValue;
};

const truncateContent = (html: string, maxLength = 120): string => {
  const text = htmlToText(html, {
    wordwrap: false,
  })
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "[Bài viết không có nội dung văn bản]";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const shouldSkipSelfNotify = (
  recipientId: number,
  actorId?: number | null,
): boolean => {
  return actorId != null && recipientId === actorId;
};

export const createNotification = async (
  input: CreateNotificationInput,
): Promise<void> => {
  if (shouldSkipSelfNotify(input.recipientId, input.actorId)) {
    return;
  }

  const notification = await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      type: input.type,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      groupId: input.groupId ?? null,
      metadata: input.metadata ?? undefined,
    },
    include: NOTIFICATION_INCLUDE,
  });

  const formatted = await formatNotification(notification, input.recipientId);
  const unreadCount = await getUnreadCount(input.recipientId);

  emitNotificationNew(input.recipientId, formatted);
  emitNotificationUnreadCount(input.recipientId, unreadCount);
};

const notifyRecipients = async (
  recipientIds: number[],
  input: Omit<CreateNotificationInput, "recipientId">,
): Promise<void> => {
  const uniqueRecipientIds = [...new Set(recipientIds)].filter(
    (id) => !shouldSkipSelfNotify(id, input.actorId),
  );

  await Promise.all(
    uniqueRecipientIds.map((recipientId) =>
      createNotification({ ...input, recipientId }),
    ),
  );
};

export const notifyPostApproved = async (
  postId: number,
  groupId: number,
  actorId: number,
): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      content: true,
      group: { select: { groupName: true } },
    },
  });

  if (!post) return;

  await createNotification({
    recipientId: post.userId,
    actorId,
    type: NotificationType.POST_APPROVED,
    postId,
    groupId,
    metadata: {
      postSnippet: truncateContent(post.content),
      groupName: post.group?.groupName ?? null,
    },
  });
};

export const notifyPostRejected = async (
  postId: number,
  groupId: number,
  actorId: number,
): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      content: true,
      group: { select: { groupName: true } },
    },
  });

  if (!post) return;

  await createNotification({
    recipientId: post.userId,
    actorId,
    type: NotificationType.POST_REJECTED,
    postId,
    groupId,
    metadata: {
      postSnippet: truncateContent(post.content),
      groupName: post.group?.groupName ?? null,
    },
  });
};

export const notifyPostPinned = async (
  postId: number,
  actorId: number,
  isPinned: boolean,
): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      content: true,
      groupId: true,
      group: { select: { groupName: true } },
    },
  });

  if (!post) return;

  await createNotification({
    recipientId: post.userId,
    actorId,
    type: isPinned
      ? NotificationType.POST_PINNED
      : NotificationType.POST_UNPINNED,
    postId,
    groupId: post.groupId,
    metadata: {
      postSnippet: truncateContent(post.content),
      groupName: post.group?.groupName ?? null,
      isPinned,
    },
  });
};

export const notifyPostReaction = async (
  postId: number,
  actorId: number,
  reactionType: ReactionType,
): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      content: true,
      groupId: true,
      isAnonymous: true,
      group: { select: { groupName: true } },
    },
  });

  if (!post) return;

  await createNotification({
    recipientId: post.userId,
    actorId,
    type: NotificationType.POST_REACTION,
    postId,
    groupId: post.groupId,
    metadata: {
      reactionType,
      postSnippet: truncateContent(post.content),
      groupName: post.group?.groupName ?? null,
    },
  });
};

export const notifyCommentReaction = async (
  commentId: number,
  actorId: number,
  reactionType: ReactionType,
): Promise<void> => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      userId: true,
      content: true,
    },
  });

  if (!comment) return;

  await createNotification({
    recipientId: comment.userId,
    actorId,
    type: NotificationType.COMMENT_REACTION,
    commentId,
    metadata: {
      reactionType,
      commentSnippet: truncateContent(comment.content),
    },
  });
};

export const notifyPostComment = async (
  postId: number,
  commentId: number,
  actorId: number,
): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      content: true,
      groupId: true,
      group: { select: { groupName: true } },
    },
  });

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      content: true,
      isAnonymous: true,
    },
  });

  if (!post || !comment) return;

  await createNotification({
    recipientId: post.userId,
    actorId,
    type: NotificationType.POST_COMMENT,
    postId,
    commentId,
    groupId: post.groupId,
    metadata: {
      postSnippet: truncateContent(post.content),
      commentSnippet: truncateContent(comment.content),
      groupName: post.group?.groupName ?? null,
      actorIsAnonymous: comment.isAnonymous,
    },
  });
};

export const notifyCommentReply = async (
  postId: number,
  commentId: number,
  parentCommentId: number,
  actorId: number,
): Promise<void> => {
  const [post, parentComment, reply] = await Promise.all([
    prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
        content: true,
        groupId: true,
        group: { select: { groupName: true } },
      },
    }),
    prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: { userId: true },
    }),
    prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        content: true,
        isAnonymous: true,
      },
    }),
  ]);

  if (!post || !parentComment || !reply) return;

  const recipientIds = [post.userId, parentComment.userId];
  const metadata = {
    postSnippet: truncateContent(post.content),
    commentSnippet: truncateContent(reply.content),
    groupName: post.group?.groupName ?? null,
    actorIsAnonymous: reply.isAnonymous,
  };

  await notifyRecipients(recipientIds, {
    actorId,
    type: NotificationType.COMMENT_REPLY,
    postId,
    commentId,
    groupId: post.groupId,
    metadata,
  });
};

export const notifyGroupMemberAdded = async (
  groupId: number,
  actorId: number,
  memberId: number,
): Promise<void> => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: memberId,
      },
    },
    select: {
      userId: true,
      group: { select: { groupName: true } },
    },
  });

  if (!member) return;
  await createNotification({
    recipientId: member.userId,
    actorId,
    type: NotificationType.GROUP_MEMBER_ADDED,
    groupId,
    metadata: {
      groupName: member.group?.groupName ?? null,
    },
  });
};

export const notifyGroupMemberKicked = async (
  groupId: number,
  actorId: number,
  memberId: number,
): Promise<void> => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { groupName: true },
  });

  await createNotification({
    recipientId: memberId,
    actorId,
    type: NotificationType.GROUP_MEMBER_KICKED,
    groupId,
    metadata: {
      groupName: group?.groupName ?? null,
    },
  });
};

export const notifyGroupMemberRoleChanged = async (
  groupId: number,
  actorId: number,
  memberId: number,
  newRole: GroupMemberRole,
): Promise<void> => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: memberId,
      },
    },
    select: {
      userId: true,
      group: { select: { groupName: true } },
    },
  });
  if (!member) return;
  await createNotification({
    recipientId: member.userId,
    actorId,
    type: NotificationType.GROUP_MEMBER_ROLE_CHANGED,
    groupId,
    metadata: {
      groupName: member.group?.groupName ?? null,
      newRole,
    },
  });
};

export const notifyGroupMemberStatusChanged = async (
  groupId: number,
  actorId: number,
  memberId: number,
  newStatus: GroupMemberStatus,
): Promise<void> => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: memberId,
      },
    },
    select: {
      userId: true,
      group: { select: { groupName: true } },
    },
  });

  if (!member) return;
  await createNotification({
    recipientId: member.userId,
    actorId,
    type: NotificationType.GROUP_MEMBER_STATUS_CHANGED,
    groupId,
    metadata: {
      groupName: member.group?.groupName ?? null,
      newStatus,
    },
  });
};

export const notifyGroupMemberRejected = async (
  groupId: number,
  actorId: number,
  memberId: number,
): Promise<void> => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberId } },
    select: {
      userId: true,
      group: { select: { groupName: true } },
    },
  });
  if (!member) return;
  await createNotification({
    recipientId: member.userId,
    actorId,
    type: NotificationType.GROUP_MEMBER_REJECTED,
    groupId,
    metadata: {
      groupName: member.group?.groupName ?? null,
    },
  });
};

const resolveActorDisplay = async (
  notification: Prisma.NotificationGetPayload<{
    include: typeof NOTIFICATION_INCLUDE;
  }>,
  viewerId: number,
) => {
  if (!notification.actor) {
    return null;
  }

  let actor = {
    id: notification.actor.id,
    fullName: notification.actor.fullName,
    avatarUrl: notification.actor.profile?.avatarKey
      ? await getFileUrl(notification.actor.profile.avatarKey)
      : null,
  };

  const groupId = notification.groupId ?? notification.post?.groupId ?? null;
  const actorContentIsAnonymous =
    (notification.type === NotificationType.POST_COMMENT ||
      notification.type === NotificationType.COMMENT_REPLY) &&
    notification.comment?.isAnonymous === true;

  if (groupId && actorContentIsAnonymous) {
    const viewer = await getGroupViewerContext(groupId, viewerId);
    const hideIdentity = shouldHideAnonymousAuthor(
      true,
      notification.actor.id,
      viewer,
    );
    const masked = maskUserForGroupDisplay(
      {
        id: actor.id,
        fullName: actor.fullName,
        profile: { avatarUrl: actor.avatarUrl },
      },
      hideIdentity,
    );
    actor = {
      id: masked.id,
      fullName: masked.fullName,
      avatarUrl: masked.profile?.avatarUrl ?? null,
    };
  }

  return actor;
};

export const formatNotification = async (
  notification: Prisma.NotificationGetPayload<{
    include: typeof NOTIFICATION_INCLUDE;
  }>,
  viewerId: number,
) => {
  const actor = await resolveActorDisplay(notification, viewerId);

  return {
    id: notification.id,
    type: notification.type,
    postId: notification.postId,
    commentId: notification.commentId,
    groupId: notification.groupId,
    metadata: notification.metadata,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    actor,
    group: notification.group
      ? {
          id: notification.group.id,
          groupName: notification.group.groupName,
        }
      : null,
    post: notification.post
      ? {
          id: notification.post.id,
          snippet: truncateContent(notification.post.content),
        }
      : null,
    comment: notification.comment
      ? {
          id: notification.comment.id,
          snippet: truncateContent(notification.comment.content),
        }
      : null,
  };
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      readAt: null,
    },
  });
};

export const listNotifications = async (
  userId: number,
  page = 1,
  limit = 20,
) => {
  const skip = (page - 1) * limit;

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: NOTIFICATION_INCLUDE,
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    getUnreadCount(userId),
  ]);

  const notifications = await Promise.all(
    items.map((item) => formatNotification(item, userId)),
  );

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const markNotificationRead = async (
  userId: number,
  notificationId: number,
) => {
  const existing = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientId: userId,
    },
  });

  if (!existing) {
    throw new AppError(404, "Không tìm thấy thông báo");
  }

  if (existing.readAt) {
    return { unreadCount: await getUnreadCount(userId) };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  const unreadCount = await getUnreadCount(userId);
  emitNotificationUnreadCount(userId, unreadCount);

  return { unreadCount };
};

export const markAllNotificationsRead = async (userId: number) => {
  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  emitNotificationUnreadCount(userId, 0);
  return { unreadCount: 0 };
};
