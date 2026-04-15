import { PrismaClient, ReactionType } from "@prisma/client";

import prisma from "../utils/prisma";

type GetPostCommentsParams = {
  postId: number;
  page?: number;
  limit?: number;
};

type GetCommentRepliesParams = {
  commentId: number;
  page?: number;
  limit?: number;
};

type CreateCommentParams = {
  userId: number;
  postId: number;
  content: string;
  mentionedUserIds?: number[];
};

type ReplyCommentParams = {
  userId: number;
  parentCommentId: number;
  content: string;
  mentionedUserIds?: number[];
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

const formatCommentResponse = (comment: any) => ({
  id: comment.id,
  postId: comment.postId,
  userId: comment.userId,
  parentCommentId: comment.parentCommentId,
  content: comment.content,
  status: comment.status,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  user: comment.user,
  mentions: comment.mentions,
  replyCount: comment._count?.replies ?? 0,
  reactionCount: comment._count?.reactions ?? 0,
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

  return {
    page,
    limit,
    hasMore,
    comments: normalizedComments.map(formatCommentResponse),
  };
};

export const getCommentRepliesService = async ({
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

  const hasMore = replies.length > limit;
  const normalizedReplies = hasMore ? replies.slice(0, limit) : replies;

  return {
    page,
    limit,
    hasMore,
    replies: normalizedReplies.map(formatCommentResponse),
  };
};

export const createCommentService = async ({
  userId,
  postId,
  content,
  mentionedUserIds = [],
}: CreateCommentParams) => {
  const [existingUser, existingPost] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
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

  return formatCommentResponse(comment);
};

export const replyCommentService = async ({
  userId,
  parentCommentId,
  content,
  mentionedUserIds = [],
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

  return formatCommentResponse(reply);
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

  return formatCommentResponse(updatedComment);
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
