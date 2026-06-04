import { PrismaClient, ReactionType } from "@prisma/client";

import prisma from "../utils/prisma";
import { getFileUrl } from "./file.service";
import {
  assertGroupAllowsAnonymousContent,
  maskGroupCommentAuthors,
} from "../utils/group-anonymous";
import * as notificationService from "./notification.service";

type GetPostCommentsParams = {
  userId: number;
  postId: number;
  page?: number;
  limit?: number;
};

type GetCommentRepliesParams = {
  userId: number;
  commentId: number;
  page?: number;
  limit?: number;
};

type CreateCommentParams = {
  userId: number;
  postId: number;
  content: string;
  mentionedUserIds?: number[];
  isAnonymous?: boolean;
};

type ReplyCommentParams = {
  userId: number;
  parentCommentId: number;
  content: string;
  mentionedUserIds?: number[];
  isAnonymous?: boolean;
};

type ReactCommentParams = {
  userId: number;
  commentId: number;
  reactionType: ReactionType;
};

type UpdateCommentParams = {
  userId: number;
  commentId: number;
  content: string;
  mentionedUserIds?: number[];
};

type DeleteCommentParams = {
  userId: number;
  commentId: number;
};

const formatCommentResponse = async (comment: any) => ({
  id: comment.id,
  postId: comment.postId,
  userId: comment.userId,
  parentCommentId: comment.parentCommentId,
  content: comment.content,
  status: comment.status,
  isAnonymous: comment.isAnonymous ?? false,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  user: {
    ...comment.user,
    profile: comment.user?.profile
      ? {
          ...comment.user.profile,
          avatarUrl: comment.user.profile.avatarKey
            ? await getFileUrl(comment.user.profile.avatarKey, 24 * 60 * 60)
            : null,
        }
      : null,
  },
  mentions: comment.mentions,
  replyCount: comment._count?.replies ?? 0,
  reactionCount: comment._count?.reactions ?? 0,
  currentReaction: comment.reactions?.[0]?.reactionType ?? null,
});

const getCommentReactionStats = async (commentId: number) => {
  const reactionCount = await prisma.reaction.count({
    where: {
      commentId,
    },
  });

  const reactionSummaryRaw = await prisma.reaction.groupBy({
    by: ["reactionType"],
    where: {
      commentId,
    },
    _count: {
      reactionType: true,
    },
  });

  const defaultSummary = {
    LIKE: 0,
    LOVE: 0,
    HAHA: 0,
    WOW: 0,
    SAD: 0,
    ANGRY: 0,
  };

  const reactionSummary = {
    ...defaultSummary,
    ...reactionSummaryRaw.reduce(
      (acc, item) => {
        acc[item.reactionType] = item._count.reactionType;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  return {
    reactionCount,
    reactionSummary,
  };
};

export const getPostCommentsService = async ({
  userId,
  postId,
  page = 1,
  limit = 10,
}: GetPostCommentsParams) => {
  const skip = (page - 1) * limit;

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      status: true,
      groupId: true,
    },
  });

  if (!existingPost) {
    throw new Error("Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new Error("Bài viết không khả dụng");
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentCommentId: null,
      status: "ACTIVE",
    },
    skip,
    take: limit + 1,
    orderBy: {
      createdAt: "desc",
    },
    include: {
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
      reactions: {
        where: {
          userId: userId,
        },
        select: {
          reactionType: true,
        },
      },
      mentions: {
        include: {
          mentionedUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              status: "ACTIVE",
            },
          },
          reactions: true,
        },
      },
    },
  });

  const hasMore = comments.length > limit;
  const normalizedComments = hasMore ? comments.slice(0, limit) : comments;

  let formattedComments = await Promise.all(
    normalizedComments.map(formatCommentResponse),
  );

  if (existingPost.groupId) {
    formattedComments = await maskGroupCommentAuthors(
      existingPost.groupId,
      userId,
      formattedComments,
    );
  }

  return {
    page,
    limit,
    hasMore,
    comments,
  };
};

export const getCommentRepliesService = async ({
  userId,
  commentId,
  page = 1,
  limit = 10,
}: GetCommentRepliesParams) => {
  const skip = (page - 1) * limit;

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      status: true,
      postId: true,
      post: {
        select: {
          groupId: true,
        },
      },
    },
  });

  if (!existingComment) {
    throw new Error("Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new Error("Comment không khả dụng");
  }

  const replies = await prisma.comment.findMany({
    where: {
      parentCommentId: commentId,
      status: "ACTIVE",
    },
    skip,
    take: limit + 1,
    orderBy: {
      createdAt: "asc",
    },
    include: {
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
      mentions: {
        include: {
          mentionedUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      reactions: {
        where: {
          userId: userId,
        },
        select: {
          reactionType: true,
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              status: "ACTIVE",
            },
          },
          reactions: true,
        },
      },
    },
  });

  const hasMore = replies.length > limit;
  const normalizedReplies = hasMore ? replies.slice(0, limit) : replies;

  let formattedReplies = await Promise.all(
    normalizedReplies.map(formatCommentResponse),
  );

  const groupId = existingComment.post?.groupId;
  if (groupId) {
    formattedReplies = await maskGroupCommentAuthors(
      groupId,
      userId,
      formattedReplies,
    );
  }

  return {
    page,
    limit,
    hasMore,
    replies: formattedReplies,
  };
};

export const createCommentService = async ({
  userId,
  postId,
  content,
  mentionedUserIds = [],
  isAnonymous: wantsAnonymous = false,
}: CreateCommentParams) => {
  const [existingUser, existingPost] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, groupId: true },
    }),
  ]);

  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  if (!existingPost) {
    throw new Error("Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new Error("Bài viết không khả dụng");
  }

  const isAnonymous = wantsAnonymous === true;
  if (existingPost.groupId) {
    await assertGroupAllowsAnonymousContent(existingPost.groupId, isAnonymous);
  } else if (isAnonymous) {
    throw new Error("Chỉ có thể bình luận ẩn danh trong nhóm");
  }

  const uniqueMentionedUserIds = [
    ...new Set(mentionedUserIds.map(Number)),
  ].filter((id) => Number.isInteger(id) && id > 0);

  if (uniqueMentionedUserIds.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueMentionedUserIds,
        },
      },
      select: { id: true },
    });

    if (mentionedUsers.length !== uniqueMentionedUserIds.length) {
      throw new Error("Có người dùng được mention không tồn tại");
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      parentCommentId: null,
      content,
      status: "ACTIVE",
      isAnonymous,
      mentions: uniqueMentionedUserIds.length
        ? {
            create: uniqueMentionedUserIds.map((mentionedUserId) => ({
              mentionedUserId,
            })),
          }
        : undefined,
    },
    include: {
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
      mentions: {
        include: {
          mentionedUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              status: "ACTIVE",
            },
          },
          reactions: true,
        },
      },
    },
  });

  await notificationService
    .notifyPostComment(postId, comment.id, userId)
    .catch((error: unknown) => {
      console.error("notifyPostComment failed:", error);
    });

  const formatted = await formatCommentResponse(comment);
  if (!existingPost.groupId) {
    return formatted;
  }

  const [masked] = await maskGroupCommentAuthors(existingPost.groupId, userId, [
    formatted,
  ]);
  return masked;
};

export const replyCommentService = async ({
  userId,
  parentCommentId,
  content,
  mentionedUserIds = [],
  isAnonymous: wantsAnonymous = false,
}: ReplyCommentParams) => {
  const [existingUser, parentComment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: {
        id: true,
        postId: true,
        status: true,
        post: {
          select: {
            groupId: true,
          },
        },
      },
    }),
  ]);

  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  if (!parentComment) {
    throw new Error("Comment cha không tồn tại");
  }

  if (parentComment.status !== "ACTIVE") {
    throw new Error("Comment cha không khả dụng");
  }

  const isAnonymous = wantsAnonymous === true;
  const groupId = parentComment.post?.groupId;
  if (groupId) {
    await assertGroupAllowsAnonymousContent(groupId, isAnonymous);
  } else if (isAnonymous) {
    throw new Error("Chỉ có thể bình luận ẩn danh trong nhóm");
  }

  const uniqueMentionedUserIds = [
    ...new Set(mentionedUserIds.map(Number)),
  ].filter((id) => Number.isInteger(id) && id > 0);

  if (uniqueMentionedUserIds.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueMentionedUserIds,
        },
      },
      select: { id: true },
    });

    if (mentionedUsers.length !== uniqueMentionedUserIds.length) {
      throw new Error("Có người dùng được mention không tồn tại");
    }
  }

  const reply = await prisma.comment.create({
    data: {
      postId: parentComment.postId,
      userId,
      parentCommentId,
      content,
      status: "ACTIVE",
      isAnonymous,
      mentions: uniqueMentionedUserIds.length
        ? {
            create: uniqueMentionedUserIds.map((mentionedUserId) => ({
              mentionedUserId,
            })),
          }
        : undefined,
    },
    include: {
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
      mentions: {
        include: {
          mentionedUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              status: "ACTIVE",
            },
          },
          reactions: true,
        },
      },
    },
  });

  await notificationService
    .notifyCommentReply(parentComment.postId, reply.id, parentCommentId, userId)
    .catch((error: unknown) => {
      console.error("notifyCommentReply failed:", error);
    });

  const formatted = await formatCommentResponse(reply);
  if (!groupId) {
    return formatted;
  }

  const [masked] = await maskGroupCommentAuthors(groupId, userId, [formatted]);
  return masked;
};

export const reactCommentService = async ({
  userId,
  commentId,
  reactionType,
}: ReactCommentParams) => {
  const [existingUser, existingComment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  if (!existingComment) {
    throw new Error("Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new Error("Comment không khả dụng để tương tác");
  }

  const existingReaction = await prisma.reaction.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  if (!existingReaction) {
    const createdReaction = await prisma.reaction.create({
      data: {
        userId,
        postId: null,
        commentId,
        reactionType,
      },
    });

    const stats = await getCommentReactionStats(commentId);

    return {
      message: "Thả cảm xúc cho comment thành công",
      data: {
        action: "CREATED",
        currentReaction: createdReaction.reactionType,
        ...stats,
        reaction: createdReaction,
      },
    };
  }

  if (existingReaction.reactionType === reactionType) {
    await prisma.reaction.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    const stats = await getCommentReactionStats(commentId);

    return {
      message: "Bỏ cảm xúc khỏi comment thành công",
      data: {
        action: "REMOVED",
        currentReaction: null,
        ...stats,
        reaction: null,
      },
    };
  }

  const updatedReaction = await prisma.reaction.update({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
    data: {
      reactionType,
    },
  });

  const stats = await getCommentReactionStats(commentId);

  return {
    message: "Cập nhật cảm xúc comment thành công",
    data: {
      action: "UPDATED",
      currentReaction: updatedReaction.reactionType,
      ...stats,
      reaction: updatedReaction,
    },
  };
};

export const updateCommentService = async ({
  userId,
  commentId,
  content,
  mentionedUserIds = [],
}: UpdateCommentParams) => {
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!existingComment) {
    throw new Error("Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new Error("Comment không khả dụng để chỉnh sửa");
  }

  if (existingComment.userId !== userId) {
    throw new Error("Bạn không có quyền sửa comment này");
  }

  const uniqueMentionedUserIds = [
    ...new Set(mentionedUserIds.map(Number)),
  ].filter((id) => Number.isInteger(id) && id > 0);

  if (uniqueMentionedUserIds.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueMentionedUserIds,
        },
      },
      select: { id: true },
    });

    if (mentionedUsers.length !== uniqueMentionedUserIds.length) {
      throw new Error("Có người dùng được mention không tồn tại");
    }
  }

  const updatedComment = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content,
      mentions: {
        deleteMany: {},
        ...(uniqueMentionedUserIds.length
          ? {
              create: uniqueMentionedUserIds.map((mentionedUserId) => ({
                mentionedUserId,
              })),
            }
          : {}),
      },
    },
    include: {
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
      mentions: {
        include: {
          mentionedUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              status: "ACTIVE",
            },
          },
          reactions: true,
        },
      },
    },
  });

  return await formatCommentResponse(updatedComment);
};

export const deleteCommentService = async ({
  userId,
  commentId,
}: DeleteCommentParams) => {
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!existingComment) {
    throw new Error("Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new Error("Comment đã bị xóa hoặc không khả dụng");
  }

  if (existingComment.userId !== userId) {
    throw new Error("Bạn không có quyền xóa comment này");
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({
      where: {
        parentCommentId: commentId,
      },
    }),
    prisma.comment.delete({
      where: {
        id: commentId,
      },
    }),
  ]);

  return {
    message: "Xóa comment thành công",
    data: {
      id: commentId,
      deleted: true,
    },
  };
};
