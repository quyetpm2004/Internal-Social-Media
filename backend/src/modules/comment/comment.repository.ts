import { CommentStatus, ReactionType } from "@prisma/client";
import prisma from "@/shared/utils/prisma";

export function commentInclude(userId: number) {
  return {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        profile: { select: { avatarKey: true } },
      },
    },
    reactions: {
      where: { userId },
      select: { reactionType: true },
    },
    mentions: {
      include: {
        mentionedUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    },
    _count: {
      select: {
        replies: {
          where: { status: CommentStatus.ACTIVE },
        },
        reactions: true,
      },
    },
  };
}

// lúc create/update chưa cần reaction của user
const commentWriteInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: { select: { avatarKey: true } },
    },
  },
  mentions: {
    include: {
      mentionedUser: {
        select: { id: true, fullName: true, email: true },
      },
    },
  },
  _count: {
    select: {
      replies: { where: { status: CommentStatus.ACTIVE } },
      reactions: true,
    },
  },
};

export function getPostBasic(postId: number) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      status: true,
      groupId: true,
    },
  });
}

export function getMembershipRole(groupId: number, userId: number) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { memberRole: true, status: true },
  });
}

export function getUserRole(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
}

export function getUserId(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
}

export async function getCommentReactionStats(commentId: number) {
  const [reactionCount, rows] = await Promise.all([
    prisma.reaction.count({ where: { commentId } }),
    prisma.reaction.groupBy({
      by: ["reactionType"],
      where: { commentId },
      _count: { reactionType: true },
    }),
  ]);

  const reactionSummary: Record<string, number> = {
    LIKE: 0,
    LOVE: 0,
    HAHA: 0,
    WOW: 0,
    SAD: 0,
    ANGRY: 0,
  };

  for (const row of rows) {
    reactionSummary[row.reactionType] = row._count.reactionType;
  }

  return { reactionCount, reactionSummary };
}

export function getRootComments(
  postId: number,
  userId: number,
  skip: number,
  take: number,
) {
  return prisma.comment.findMany({
    where: {
      postId,
      parentCommentId: null,
      status: "ACTIVE",
    },
    skip,
    take,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: commentInclude(userId),
  });
}

export function getCommentForReplies(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      status: true,
      postId: true,
      post: { select: { groupId: true } },
    },
  });
}

export function getReplies(
  parentCommentId: number,
  userId: number,
  skip: number,
  take: number,
) {
  return prisma.comment.findMany({
    where: {
      parentCommentId,
      status: "ACTIVE",
    },
    skip,
    take,
    orderBy: { createdAt: "asc" },
    include: commentInclude(userId),
  });
}

export function createComment(data: {
  postId: number;
  userId: number;
  content: string;
  isAnonymous: boolean;
  mentionedUserIds: number[];
  parentCommentId?: number | null;
}) {
  return prisma.comment.create({
    data: {
      postId: data.postId,
      userId: data.userId,
      parentCommentId: data.parentCommentId ?? null,
      content: data.content,
      status: "ACTIVE",
      isAnonymous: data.isAnonymous,
      mentions: data.mentionedUserIds.length
        ? {
            create: data.mentionedUserIds.map((mentionedUserId) => ({
              mentionedUserId,
            })),
          }
        : undefined,
    },
    include: commentWriteInclude,
  });
}

export function getParentComment(parentCommentId: number) {
  return prisma.comment.findUnique({
    where: { id: parentCommentId },
    select: {
      id: true,
      postId: true,
      status: true,
      post: { select: { groupId: true } },
    },
  });
}

export function getCommentStatus(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true },
  });
}

export function getCommentForEdit(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      postId: true,
      status: true,
      post: { select: { groupId: true } },
    },
  });
}

export function getCommentOwner(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });
}

export function getCommentForPin(commentId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      postId: true,
      parentCommentId: true,
      status: true,
      post: { select: { groupId: true } },
    },
  });
}

export function getUserCommentReaction(userId: number, commentId: number) {
  return prisma.reaction.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
}

export function addCommentReaction(
  userId: number,
  commentId: number,
  reactionType: ReactionType,
) {
  return prisma.reaction.create({
    data: {
      userId,
      postId: null,
      commentId,
      reactionType,
    },
  });
}

export function removeCommentReaction(userId: number, commentId: number) {
  return prisma.reaction.delete({
    where: { userId_commentId: { userId, commentId } },
  });
}

export function changeCommentReaction(
  userId: number,
  commentId: number,
  reactionType: ReactionType,
) {
  return prisma.reaction.update({
    where: { userId_commentId: { userId, commentId } },
    data: { reactionType },
  });
}

export function updateCommentContent(
  commentId: number,
  content: string,
  mentionedUserIds: number[],
) {
  return prisma.comment.update({
    where: { id: commentId },
    data: {
      content,
      mentions: {
        deleteMany: {},
        ...(mentionedUserIds.length
          ? {
              create: mentionedUserIds.map((mentionedUserId) => ({
                mentionedUserId,
              })),
            }
          : {}),
      },
    },
    include: commentWriteInclude,
  });
}

export function deleteCommentWithReplies(commentId: number) {
  return prisma.$transaction([
    prisma.comment.deleteMany({
      where: { parentCommentId: commentId },
    }),
    prisma.comment.delete({
      where: { id: commentId },
    }),
  ]);
}

export async function setCommentPinned(
  postId: number,
  commentId: number,
  isPinned: boolean,
) {
  await prisma.$transaction(async (tx) => {
    // mỗi post chỉ ghim 1 comment cấp 1
    if (isPinned) {
      await tx.comment.updateMany({
        where: {
          postId,
          parentCommentId: null,
          isPinned: true,
          id: { not: commentId },
        },
        data: { isPinned: false },
      });
    }

    await tx.comment.update({
      where: { id: commentId },
      data: { isPinned },
    });
  });
}

export function getCommentDetail(commentId: number, userId: number) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: commentInclude(userId),
  });
}
