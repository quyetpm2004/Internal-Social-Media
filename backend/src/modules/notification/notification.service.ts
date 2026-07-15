import {
  GroupMemberRole,
  GroupMemberStatus,
  NotificationType,
  Prisma,
  ReactionType,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
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
import * as notificationRepo from "@/modules/notification/notification.repository";
import type { NotificationWithInclude } from "@/modules/notification/notification.repository";

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

  const notification = await notificationRepo.createNotificationRecord(input);

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
  const post = await notificationRepo.getPostOwnerContent(postId);
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
  const post = await notificationRepo.getPostOwnerContent(postId);
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
  const post = await notificationRepo.getPostOwnerContent(postId);
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
  const post = await notificationRepo.getPostOwnerContent(postId);
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
  const comment = await notificationRepo.getCommentOwnerContent(commentId);
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
  const [post, comment] = await Promise.all([
    notificationRepo.getPostOwnerContent(postId),
    notificationRepo.getCommentSnippet(commentId),
  ]);

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

export const notifyPostMentions = async (
  postId: number,
  actorId: number,
  mentionedUserIds: number[],
): Promise<void> => {
  if (mentionedUserIds.length === 0) {
    return;
  }

  const post = await notificationRepo.getPostOwnerContent(postId);

  if (!post || post.status !== "ACTIVE") {
    return;
  }

  for (const recipientId of mentionedUserIds) {
    await createNotification({
      recipientId,
      actorId,
      type: NotificationType.POST_MENTION,
      postId,
      groupId: post.groupId,
      metadata: {
        postSnippet: truncateContent(post.content),
      },
    });
  }
};

export const notifyCommentMentions = async (
  postId: number,
  commentId: number,
  actorId: number,
  mentionedUserIds: number[],
): Promise<void> => {
  if (mentionedUserIds.length === 0) {
    return;
  }

  const [post, comment] = await Promise.all([
    notificationRepo.getPostGroupId(postId),
    notificationRepo.getCommentSnippet(commentId),
  ]);

  if (!post || !comment) {
    return;
  }

  for (const recipientId of mentionedUserIds) {
    await createNotification({
      recipientId,
      actorId,
      type: NotificationType.COMMENT_MENTION,
      postId,
      commentId,
      groupId: post.groupId,
      metadata: {
        commentSnippet: truncateContent(comment.content),
      },
    });
  }
};

export const notifyMessageMentions = async (
  conversationId: number,
  messageId: number,
  actorId: number,
  mentionedUserIds: number[],
  content: string,
): Promise<void> => {
  if (mentionedUserIds.length === 0) {
    return;
  }

  for (const recipientId of mentionedUserIds) {
    await createNotification({
      recipientId,
      actorId,
      type: NotificationType.MESSAGE_MENTION,
      metadata: {
        conversationId,
        messageId,
        messageSnippet: truncateContent(content),
      },
    });
  }
};

export const notifyCommentReply = async (
  postId: number,
  commentId: number,
  parentCommentId: number,
  actorId: number,
): Promise<void> => {
  const [post, parentComment, reply] = await Promise.all([
    notificationRepo.getPostOwnerContent(postId),
    notificationRepo.getCommentAuthor(parentCommentId),
    notificationRepo.getCommentSnippet(commentId),
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
  const member = await notificationRepo.getMemberWithGroup(groupId, memberId);
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
  const group = await notificationRepo.getGroupName(groupId);

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
  const member = await notificationRepo.getMemberWithGroup(groupId, memberId);
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
  const member = await notificationRepo.getMemberWithGroup(groupId, memberId);
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
  const member = await notificationRepo.getMemberWithGroup(groupId, memberId);
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
  notification: NotificationWithInclude,
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
  notification: NotificationWithInclude,
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
  return notificationRepo.countUnread(userId);
};

export const listNotifications = async (
  userId: number,
  page = 1,
  limit = 20,
) => {
  const skip = (page - 1) * limit;

  const [items, total, unreadCount] = await Promise.all([
    notificationRepo.listByUser(userId, skip, limit),
    notificationRepo.countByUser(userId),
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
  const existing = await notificationRepo.getOwnedNotification(
    notificationId,
    userId,
  );

  if (!existing) {
    throw new AppError(404, "Không tìm thấy thông báo");
  }

  if (existing.readAt) {
    return { unreadCount: await getUnreadCount(userId) };
  }

  await notificationRepo.markRead(notificationId);

  const unreadCount = await getUnreadCount(userId);
  emitNotificationUnreadCount(userId, unreadCount);

  return { unreadCount };
};

export const markAllNotificationsRead = async (userId: number) => {
  await notificationRepo.markAllRead(userId);

  emitNotificationUnreadCount(userId, 0);
  return { unreadCount: 0 };
};
