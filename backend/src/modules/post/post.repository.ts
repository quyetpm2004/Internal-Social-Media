import {
  GroupMemberStatus,
  PostContentFormat,
  PostStatus,
  PostVisibility,
  Prisma,
  ReactionType,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";
import { getPollInclude } from "@/modules/poll/poll.types";

type Tx = Prisma.TransactionClient;

// include dùng chung lúc lấy post
export function buildPostInclude(userId: number) {
  return {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profile: { select: { avatarKey: true } },
      },
    },
    group: {
      select: { id: true, groupName: true },
    },
    reactions: {
      where: { userId },
      select: { reactionType: true },
    },
    attachments: true,
    poll: getPollInclude(userId),
    event: {
      include: {
        attendees: {
          select: { userId: true, status: true },
        },
      },
    },
    savedBy: {
      where: { userId },
      select: { id: true },
    },
    _count: {
      select: { comments: true, reactions: true },
    },
  };
}

export async function getReactionSummaryForPosts(postIds: number[]) {
  if (postIds.length === 0) return [];

  return prisma.reaction.groupBy({
    by: ["postId", "reactionType"],
    where: { postId: { in: postIds } },
    _count: { reactionType: true },
  });
}

// đếm + group theo loại
export async function getPostReactionStats(postId: number) {
  const [reactionCount, rows] = await Promise.all([
    prisma.reaction.count({ where: { postId } }),
    prisma.reaction.groupBy({
      by: ["reactionType"],
      where: { postId },
      _count: { reactionType: true },
    }),
  ]);

  const reactionSummary: Record<string, number> = {};
  for (const row of rows) {
    reactionSummary[row.reactionType] = row._count.reactionType;
  }

  return { reactionCount, reactionSummary, rows };
}

export function getPinnedPosts(where: Prisma.PostWhereInput, userId: number) {
  return prisma.post.findMany({
    where: { ...where, isPinned: true },
    orderBy: { createdAt: "desc" },
    include: buildPostInclude(userId),
  });
}

export function getNormalPosts(
  where: Prisma.PostWhereInput,
  userId: number,
  skip: number,
  take: number,
  orderBy: Prisma.PostOrderByWithRelationInput[],
) {
  return prisma.post.findMany({
    where: { ...where, isPinned: false },
    skip,
    take,
    orderBy,
    include: buildPostInclude(userId),
  });
}

export function getPostDetail(postId: number, userId: number) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: buildPostInclude(userId),
  });
}

export function getPostRaw(postId: number) {
  return prisma.post.findUnique({ where: { id: postId } });
}

export function getPostBasic(postId: number) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      status: true,
      groupId: true,
      visibility: true,
    },
  });
}

export function getPostForEdit(postId: number) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      status: true,
      groupId: true,
      poll: {
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: { select: { votes: true } },
            },
          },
        },
      },
      event: { select: { id: true } },
    },
  });
}

export function updatePinStatus(postId: number, isPinned: boolean) {
  return prisma.post.update({
    where: { id: postId },
    data: { isPinned },
  });
}

export function removePost(postId: number) {
  return prisma.post.delete({ where: { id: postId } });
}

export function getGroupForCreatePost(groupId: number) {
  return prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      status: true,
      postPermission: true,
      postApprovalRequired: true,
      allowAnonymousJoin: true,
    },
  });
}

export function getMembership(groupId: number, userId: number) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function getReadyAttachments(attachmentIds: number[], userId: number) {
  return prisma.postAttachment.findMany({
    where: {
      id: { in: attachmentIds },
      uploadedById: userId,
      status: "READY",
    },
    select: { id: true },
  });
}

export function getUser(userId: number) {
  return prisma.user.findUnique({ where: { id: userId } });
}

type CreatePostInput = {
  userId: number;
  groupId: number | null;
  content: string;
  contentFormat: PostContentFormat;
  visibility: PostVisibility;
  status: PostStatus;
  isAnonymous: boolean;
};

export async function createPostWithRelations(opts: {
  data: CreatePostInput;
  attachmentIds: number[];
  // poll / event / mention gắn trong tx
  afterCreate?: (tx: Tx, postId: number) => Promise<void>;
}) {
  const { data, attachmentIds, afterCreate } = opts;

  return prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        userId: data.userId,
        groupId: data.groupId,
        content: data.content,
        contentFormat: data.contentFormat,
        visibility: data.visibility,
        isPinned: false,
        status: data.status,
        viewCount: 0,
        isAnonymous: data.isAnonymous,
      },
    });

    // gắn ảnh đã upload sẵn vào post
    if (attachmentIds.length > 0) {
      await tx.postAttachment.updateMany({
        where: {
          id: { in: attachmentIds },
          uploadedById: data.userId,
          status: "READY",
        },
        data: {
          postId: created.id,
          status: "ACTIVE",
        },
      });
    }

    if (afterCreate) {
      await afterCreate(tx, created.id);
    }

    return tx.post.findUnique({
      where: { id: created.id },
      include: buildPostInclude(data.userId),
    });
  });
}

export async function updatePostWithRelations(opts: {
  postId: number;
  content: string;
  contentFormat: PostContentFormat;
  afterUpdate?: (tx: Tx) => Promise<void>;
}) {
  const { postId, content, contentFormat, afterUpdate } = opts;

  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: { content, contentFormat },
    });

    if (afterUpdate) {
      await afterUpdate(tx);
    }
  });
}

export function getUserPostReaction(userId: number, postId: number) {
  return prisma.reaction.findUnique({
    where: { userId_postId: { userId, postId } },
  });
}

export function addReaction(
  userId: number,
  postId: number,
  reactionType: ReactionType,
) {
  return prisma.reaction.create({
    data: {
      userId,
      postId,
      commentId: null,
      reactionType,
    },
  });
}

export function removeReaction(userId: number, postId: number) {
  return prisma.reaction.delete({
    where: { userId_postId: { userId, postId } },
  });
}

export function changeReaction(
  userId: number,
  postId: number,
  reactionType: ReactionType,
) {
  return prisma.reaction.update({
    where: { userId_postId: { userId, postId } },
    data: { reactionType },
  });
}

export function listReactions(
  where: Prisma.ReactionWhereInput,
  skip: number,
  take: number,
) {
  return prisma.reaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profile: { select: { avatarKey: true } },
        },
      },
    },
  });
}

export function countReactions(where: Prisma.ReactionWhereInput) {
  return prisma.reaction.count({ where });
}

export function getSavedPost(userId: number, postId: number) {
  return prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
}

export function unsavePost(userId: number, postId: number) {
  return prisma.savedPost.delete({
    where: { userId_postId: { userId, postId } },
  });
}

export function savePost(userId: number, postId: number) {
  return prisma.savedPost.create({
    data: { userId, postId },
  });
}

export function getSavedPostList(userId: number, skip: number, take: number) {
  return prisma.savedPost.findMany({
    where: {
      userId,
      post: {
        status: PostStatus.ACTIVE,
        OR: [
          { groupId: null, visibility: PostVisibility.PUBLIC },
          {
            group: {
              members: {
                some: {
                  userId,
                  status: GroupMemberStatus.ACTIVE,
                },
              },
            },
          },
        ],
      },
    },
    orderBy: { savedAt: "desc" },
    skip,
    take,
    include: {
      post: {
        include: buildPostInclude(userId),
      },
    },
  });
}
