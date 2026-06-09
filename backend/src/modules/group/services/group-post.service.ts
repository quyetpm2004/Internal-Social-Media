import {
  GroupMemberStatus,
  GroupStatus,
  GroupType,
  PostStatus,
  PostVisibility,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";
import {
  assertGroupAllowsAnonymousContent,
  maskGroupPostAuthors,
} from "@/shared/utils/group-anonymous";
import {
  notifyPostApproved,
  notifyPostRejected,
} from "@/modules/notification/notification.service";
import {
  checkCanManageMember,
  checkCanPostInGroup,
  checkGroupExists,
  findGroupMember,
} from "@/modules/group/services/group-access.service";

export const createGroupPost = async (
  groupId: number,
  userId: number,
  data: any,
) => {
  const { content, isAnonymous: wantsAnonymous } = data;

  if (!content) {
    throw new AppError(400, "Nội dung bài viết không được để trống");
  }

  const { group } = await checkCanPostInGroup(groupId, userId);

  if (group.status !== GroupStatus.ACTIVE) {
    throw new AppError(400, "Nhóm không hoạt động");
  }

  const isAnonymous = wantsAnonymous === true;
  await assertGroupAllowsAnonymousContent(groupId, isAnonymous);

  const postStatus = group.postApprovalRequired
    ? PostStatus.PENDING_REVIEW
    : PostStatus.ACTIVE;

  const post = await prisma.post.create({
    data: {
      userId,
      groupId,
      content,
      visibility: PostVisibility.GROUP,
      status: postStatus,
      isAnonymous,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: { select: { avatarKey: true } },
        },
      },
      group: true,
      attachments: true,
      reactions: true,
      comments: true,
      _count: {
        select: { comments: true, reactions: true },
      },
    },
  });

  return post;
};

export const getGroupPosts = async (groupId: number) => {
  await checkGroupExists(groupId);

  const posts = await prisma.post.findMany({
    where: {
      groupId,
      visibility: PostVisibility.GROUP,
      status: PostStatus.ACTIVE,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: { select: { avatarKey: true } },
        },
      },
      attachments: true,
      comments: {
        where: { status: "ACTIVE" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { avatarKey: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: true,
      _count: {
        select: { comments: true, reactions: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return posts;
};

export const getGroupPostDetail = async (
  groupId: number,
  postId: number,
  userId: number,
) => {
  const existingGroup = await checkGroupExists(groupId);
  if (existingGroup.status !== GroupStatus.ACTIVE) {
    throw new AppError(400, "Nhóm không hoạt động");
  }

  const membership = await findGroupMember(groupId, userId);
  const isActiveMember = membership?.status === GroupMemberStatus.ACTIVE;

  if (existingGroup.groupType === GroupType.PRIVATE && !isActiveMember) {
    throw new AppError(400, "Nhóm riêng tư không thể xem chi tiết bài viết");
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
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
      _count: {
        select: { comments: true, reactions: true },
      },
    },
  });

  if (!existingPost) {
    throw new AppError(404, "Post không tồn tại");
  }

  const attachmentsWithUrl = await Promise.all(
    existingPost.attachments.map(async (attachment) => {
      const url = await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60);
      return { ...attachment, fileUrl: url };
    }),
  );

  const [maskedPost] = await maskGroupPostAuthors(groupId, userId, [
    { ...existingPost, userId: existingPost.userId },
  ]);

  return {
    ...maskedPost,
    attachments: attachmentsWithUrl,
  };
};

const mapPendingPostForReview = async (post: {
  id: number;
  content: string;
  createdAt: Date;
  user: {
    id: number;
    fullName: string;
    email: string;
    profile: { avatarKey: string | null } | null;
  };
  _count: { attachments: number };
}) => ({
  id: post.id,
  content: post.content,
  createdAt: post.createdAt,
  attachmentCount: post._count.attachments,
  author: {
    id: post.user.id,
    fullName: post.user.fullName,
    email: post.user.email,
    avatarUrl: post.user.profile?.avatarKey
      ? await getFileUrl(post.user.profile.avatarKey, 24 * 60 * 60)
      : null,
  },
});

export const getPendingGroupPosts = async (
  groupId: number,
  currentUserId: number,
  page: number = 1,
  limit: number = 10,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  if (!group.postApprovalRequired) {
    throw new AppError(400, "Nhóm này không bật phê duyệt bài viết");
  }

  const where = {
    groupId,
    status: PostStatus.PENDING_REVIEW,
    visibility: PostVisibility.GROUP,
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profile: { select: { avatarKey: true } },
          },
        },
        _count: { select: { attachments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: await Promise.all(posts.map(mapPendingPostForReview)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const approveGroupPost = async (
  groupId: number,
  postId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  if (!group.postApprovalRequired) {
    throw new AppError(400, "Nhóm này không bật phê duyệt bài viết");
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      groupId,
      status: PostStatus.PENDING_REVIEW,
      visibility: PostVisibility.GROUP,
    },
  });

  if (!post) {
    throw new AppError(404, "Không tìm thấy bài viết chờ duyệt");
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.ACTIVE },
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  await notifyPostApproved(postId, groupId, currentUserId);
  return updated;
};

export const rejectGroupPost = async (
  groupId: number,
  postId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  if (!group.postApprovalRequired) {
    throw new AppError(400, "Nhóm này không bật phê duyệt bài viết");
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      groupId,
      status: PostStatus.PENDING_REVIEW,
      visibility: PostVisibility.GROUP,
    },
  });

  if (!post) {
    throw new AppError(404, "Không tìm thấy bài viết chờ duyệt");
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.DELETED },
  });

  await notifyPostRejected(postId, groupId, currentUserId);
  return updated;
};
