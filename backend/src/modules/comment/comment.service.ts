import {
  ReactionType,
  GroupMemberRole,
  GroupMemberStatus,
  Role,
  CommentStatus,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";
import {
  assertGroupAllowsAnonymousContent,
  maskGroupCommentAuthors,
} from "@/shared/utils/group-anonymous";
import {
  notifyCommentMentions,
  notifyCommentReaction,
  notifyCommentReply,
  notifyPostComment,
} from "@/modules/notification/notification.service";
import {
  assertMentionedUsersExist,
  assertMentionedUsersInGroup,
  resolveMentionTargets,
} from "@/shared/utils/mentions";

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
  mentionAll?: boolean;
  isAnonymous?: boolean;
};

type ReplyCommentParams = {
  userId: number;
  parentCommentId: number;
  content: string;
  mentionedUserIds?: number[];
  mentionAll?: boolean;
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
  mentionAll?: boolean;
};

type DeleteCommentParams = {
  userId: number;
  commentId: number;
};

type PinCommentParams = {
  userId: number;
  commentId: number;
  isPinned: boolean;
};

const commentInclude = (userId: number) => ({
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
      userId,
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
          status: CommentStatus.ACTIVE,
        },
      },
      reactions: true,
    },
  },
});

const assertCanPinComment = async (postId: number, userId: number) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      groupId: true,
    },
  });

  if (!post) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (post.userId === userId) {
    return;
  }

  if (post.groupId) {
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: post.groupId,
          userId,
        },
      },
      select: {
        memberRole: true,
        status: true,
      },
    });

    if (
      member?.status === GroupMemberStatus.ACTIVE &&
      (member.memberRole === GroupMemberRole.ADMIN ||
        member.memberRole === GroupMemberRole.MODERATOR)
    ) {
      return;
    }
  } else {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === Role.ADMIN) {
      return;
    }
  }

  throw new AppError(403, "Bạn không có quyền ghim bình luận");
};

const formatCommentResponse = async (comment: any) => ({
  id: comment.id,
  postId: comment.postId,
  userId: comment.userId,
  parentCommentId: comment.parentCommentId,
  content: comment.content,
  status: comment.status,
  isAnonymous: comment.isAnonymous ?? false,
  isPinned: comment.isPinned ?? false,
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
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new AppError(400, "Bài viết không khả dụng");
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentCommentId: null,
      status: "ACTIVE",
    },
    skip,
    take: limit + 1,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: commentInclude(userId),
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
    comments: formattedComments,
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
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment không khả dụng");
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
  mentionAll = false,
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
    throw new AppError(404, "Người dùng không tồn tại");
  }

  if (!existingPost) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new AppError(400, "Bài viết không khả dụng");
  }

  const isAnonymous = wantsAnonymous === true;
  if (existingPost.groupId) {
    await assertGroupAllowsAnonymousContent(existingPost.groupId, isAnonymous);
  } else if (isAnonymous) {
    throw new AppError(400, "Chỉ có thể bình luận ẩn danh trong nhóm");
  }

  const uniqueMentionedUserIds = await resolveMentionTargets({
    mentionAll,
    mentionedUserIds,
    actorId: userId,
    groupId: existingPost.groupId,
  });
  await assertMentionedUsersExist(uniqueMentionedUserIds);
  if (existingPost.groupId) {
    await assertMentionedUsersInGroup(
      existingPost.groupId,
      uniqueMentionedUserIds,
    );
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

  await notifyPostComment(postId, comment.id, userId);
  await notifyCommentMentions(
    postId,
    comment.id,
    userId,
    uniqueMentionedUserIds,
  );

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
  mentionAll = false,
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
    throw new AppError(404, "Người dùng không tồn tại");
  }

  if (!parentComment) {
    throw new AppError(404, "Comment cha không tồn tại");
  }

  if (parentComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment cha không khả dụng");
  }

  const isAnonymous = wantsAnonymous === true;
  const groupId = parentComment.post?.groupId;
  if (groupId) {
    await assertGroupAllowsAnonymousContent(groupId, isAnonymous);
  } else if (isAnonymous) {
    throw new AppError(400, "Chỉ có thể bình luận ẩn danh trong nhóm");
  }

  const uniqueMentionedUserIds = await resolveMentionTargets({
    mentionAll,
    mentionedUserIds,
    actorId: userId,
    groupId: groupId ?? null,
  });
  await assertMentionedUsersExist(uniqueMentionedUserIds);
  if (groupId) {
    await assertMentionedUsersInGroup(groupId, uniqueMentionedUserIds);
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

  await notifyCommentReply(
    parentComment.postId,
    reply.id,
    parentCommentId,
    userId,
  );
  await notifyCommentMentions(
    parentComment.postId,
    reply.id,
    userId,
    uniqueMentionedUserIds,
  );

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
    throw new AppError(404, "Người dùng không tồn tại");
  }

  if (!existingComment) {
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment không khả dụng để tương tác");
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

    await notifyCommentReaction(commentId, userId, reactionType);

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
  mentionAll = false,
}: UpdateCommentParams) => {
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      postId: true,
      status: true,
      post: {
        select: { groupId: true },
      },
    },
  });

  if (!existingComment) {
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment không khả dụng để chỉnh sửa");
  }

  if (existingComment.userId !== userId) {
    throw new AppError(403, "Bạn không có quyền sửa comment này");
  }

  const uniqueMentionedUserIds = await resolveMentionTargets({
    mentionAll,
    mentionedUserIds,
    actorId: userId,
    groupId: existingComment.post?.groupId ?? null,
  });
  await assertMentionedUsersExist(uniqueMentionedUserIds);
  if (existingComment.post?.groupId) {
    await assertMentionedUsersInGroup(
      existingComment.post.groupId,
      uniqueMentionedUserIds,
    );
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

  await notifyCommentMentions(
    existingComment.postId,
    commentId,
    userId,
    uniqueMentionedUserIds,
  );

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
    throw new AppError(404, "Comment không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Comment đã bị xóa hoặc không khả dụng");
  }

  if (existingComment.userId !== userId) {
    throw new AppError(403, "Bạn không có quyền xóa comment này");
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

export const pinCommentService = async ({
  userId,
  commentId,
  isPinned,
}: PinCommentParams) => {
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      postId: true,
      parentCommentId: true,
      status: true,
      post: {
        select: {
          groupId: true,
        },
      },
    },
  });

  if (!existingComment) {
    throw new AppError(404, "Bình luận không tồn tại");
  }

  if (existingComment.status !== "ACTIVE") {
    throw new AppError(400, "Bình luận không khả dụng");
  }

  if (existingComment.parentCommentId !== null) {
    throw new AppError(400, "Chỉ có thể ghim bình luận cấp 1");
  }

  await assertCanPinComment(existingComment.postId, userId);

  await prisma.$transaction(async (tx) => {
    if (isPinned) {
      await tx.comment.updateMany({
        where: {
          postId: existingComment.postId,
          parentCommentId: null,
          isPinned: true,
          id: {
            not: commentId,
          },
        },
        data: {
          isPinned: false,
        },
      });
    }

    await tx.comment.update({
      where: { id: commentId },
      data: { isPinned },
    });
  });

  const updatedComment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: commentInclude(userId),
  });

  if (!updatedComment) {
    throw new AppError(404, "Bình luận không tồn tại");
  }

  let formatted = await formatCommentResponse(updatedComment);

  if (existingComment.post?.groupId) {
    const [masked] = await maskGroupCommentAuthors(
      existingComment.post.groupId,
      userId,
      [formatted],
    );
    formatted = masked;
  }

  return formatted;
};
