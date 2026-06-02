import {
  GroupMemberRole,
  GroupMemberStatus,
  GroupPermission,
  GroupStatus,
  PostStatus,
  PostVisibility,
  Prisma,
  ReactionType,
  Role,
} from "@prisma/client";
import { PostContentFormat } from "../constants/post-content-format";
import type { PostContentFormat as PostContentFormatType } from "../constants/post-content-format";

import prisma from "../utils/prisma";
import { getFileUrl } from "./file.service";
import { processPostContent } from "../utils/sanitize-html";

type GetPostListParams = {
  page?: number;
  limit?: number;
  sort?: "latest" | "trending";
  groupId?: number;
};

export const getPostListService = async ({
  page = 1,
  limit = 10,
  sort = "latest",
  groupId,
  userId,
}: GetPostListParams & { userId: number }) => {
  const skip = (page - 1) * limit;

  let postStatusFilter: PostStatus | { in: PostStatus[] } = PostStatus.ACTIVE;

  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
      select: { memberRole: true, status: true },
    });

    const isGroupAdmin =
      membership?.status === GroupMemberStatus.ACTIVE &&
      membership.memberRole === GroupMemberRole.ADMIN;

    postStatusFilter = isGroupAdmin
      ? { in: [PostStatus.ACTIVE, PostStatus.PENDING_REVIEW] }
      : PostStatus.ACTIVE;
  }

  const where: Prisma.PostWhereInput = {
    status: postStatusFilter,
  };

  if (groupId) {
    where.groupId = groupId;
    where.visibility = "GROUP";
  } else {
    where.groupId = null;
    where.visibility = "PUBLIC";
  }
  /**
   * pinnedPosts:
   * - chỉ lấy ở page=1 để tránh lặp lại khi infinite scroll
   * - tách riêng khỏi posts
   */
  let pinnedPosts: any[] = [];

  if (page === 1) {
    pinnedPosts = await prisma.post.findMany({
      where: {
        ...where,
        isPinned: true,
      },
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
        group: {
          select: {
            id: true,
            groupName: true,
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
        attachments: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });
  }

  /**
   * posts thường:
   * - loại pinned ra khỏi danh sách thường để không trùng
   * - latest: mới nhất trước
   * - trending: ví dụ order theo viewCount desc, rồi createdAt desc
   */
  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    sort === "trending"
      ? [{ viewCount: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const posts = await prisma.post.findMany({
    where: {
      ...where,
      isPinned: false,
    },
    skip,
    take: limit + 1, // lấy dư 1 bản ghi để biết còn dữ liệu không
    orderBy,
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
      group: {
        select: {
          id: true,
          groupName: true,
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
      attachments: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });

  const hasMore = posts.length > limit;

  const normalizedPosts = hasMore ? posts.slice(0, limit) : posts;

  const normalizePostsWithUrlAttachments = await Promise.all(
    normalizedPosts.map(async (post) => {
      const attachmentsWithUrl = await Promise.all(
        post.attachments.map(async (attachment) => {
          const url = await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60); // 7 ngày
          return {
            ...attachment,
            fileUrl: url,
          };
        }),
      );
      return {
        ...post,
        attachments: attachmentsWithUrl,
      };
    }),
  );

  const pinnedPostsWithUrlAttachments = await Promise.all(
    pinnedPosts.map(async (post) => {
      const attachmentsWithUrl = await Promise.all(
        post.attachments.map(async (attachment: any) => {
          const url = await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60); // 7 ngày
          return {
            ...attachment,
            fileUrl: url,
          };
        }),
      );
      return {
        ...post,
        attachments: attachmentsWithUrl,
      };
    }),
  );

  return {
    page,
    limit,
    sort,
    hasMore,
    pinnedPosts: pinnedPostsWithUrlAttachments,
    posts: normalizePostsWithUrlAttachments,
  };
};

type CreatePostParams = {
  userId: number;
  content: string;
  contentFormat?: PostContentFormatType;
  visibility?: PostVisibility;
  groupId?: number;
  attachmentIds?: number[];
};

export const createPostService = async ({
  userId,
  content,
  contentFormat = PostContentFormat.HTML,
  visibility = "PUBLIC",
  groupId,
  attachmentIds = [],
}: CreatePostParams) => {
  const processed = processPostContent(content, contentFormat);
  let groupPostStatus: PostStatus = PostStatus.ACTIVE;

  if (groupId) {
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        status: true,
        postPermission: true,
        postApprovalRequired: true,
      },
    });

    if (!existingGroup) {
      throw new Error("GROUP_NOT_FOUND");
    }

    if (existingGroup.status !== GroupStatus.ACTIVE) {
      throw new Error("Nhóm không hoạt động");
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership || membership.status !== GroupMemberStatus.ACTIVE) {
      throw new Error("Bạn phải là thành viên nhóm");
    }

    if (
      existingGroup.postPermission === GroupPermission.ADMIN_ONLY &&
      membership.memberRole !== GroupMemberRole.ADMIN
    ) {
      throw new Error("Chỉ quản trị viên mới có thể đăng bài trong nhóm này");
    }

    groupPostStatus = existingGroup.postApprovalRequired
      ? PostStatus.PENDING_REVIEW
      : PostStatus.ACTIVE;
  }

  /**
   * Validate attachments
   */
  if (attachmentIds.length > 0) {
    const attachments = await prisma.postAttachment.findMany({
      where: {
        id: {
          in: attachmentIds,
        },

        uploadedById: userId,

        status: "READY",
      },

      select: {
        id: true,
      },
    });

    if (attachments.length !== attachmentIds.length) {
      throw new Error("INVALID_ATTACHMENTS");
    }
  }

  /**
   * Transaction
   */
  const post = await prisma.$transaction(async (tx) => {
    /**
     * Create post
     */
    const createdPost = await tx.post.create({
      data: {
        userId,

        groupId: groupId || null,

        content: processed.content,
        contentFormat: processed.contentFormat,

        visibility,

        isPinned: false,

        status: groupId ? groupPostStatus : PostStatus.ACTIVE,

        viewCount: 0,
      },
    });

    /**
     * Activate attachments
     */
    if (attachmentIds.length > 0) {
      await tx.postAttachment.updateMany({
        where: {
          id: {
            in: attachmentIds,
          },

          uploadedById: userId,

          status: "READY",
        },

        data: {
          postId: createdPost.id,

          status: "ACTIVE",
        },
      });
    }

    /**
     * Return full post
     */
    return tx.post.findUnique({
      where: {
        id: createdPost.id,
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

        group: {
          select: {
            id: true,

            groupName: true,
          },
        },

        attachments: true,

        _count: {
          select: {
            comments: true,

            reactions: true,
          },
        },
      },
    });
  });

  return post;
};

type ReactPostParams = {
  userId: number;
  postId: number;
  reactionType: ReactionType;
};

export const reactPostService = async ({
  userId,
  postId,
  reactionType,
}: ReactPostParams) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

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
    throw new Error("Bài viết không khả dụng để tương tác");
  }

  const existingReaction = await prisma.reaction.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (!existingReaction) {
    const createdReaction = await prisma.reaction.create({
      data: {
        userId,
        postId,
        commentId: null,
        reactionType,
      },
    });

    // Đếm tổng số reactions sau khi tạo mới
    const reactionCount = await prisma.reaction.count({
      where: {
        postId,
      },
    });

    // Đếm theo từng loại reaction
    const reactionSummaryRaw = await prisma.reaction.groupBy({
      by: ["reactionType"],
      where: {
        postId,
      },
      _count: {
        reactionType: true,
      },
    });

    // Chuyển đổi kết quả groupBy thành định dạng { [reactionType]: count }
    const reactionSummary = reactionSummaryRaw.reduce(
      (acc, item) => {
        acc[item.reactionType] = item._count.reactionType;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      message: "Thả cảm xúc thành công",
      data: {
        action: "CREATED",
        currentReaction: createdReaction.reactionType,
        reactionCount,
        reactionSummary,
        reaction: createdReaction,
      },
    };
  }

  if (existingReaction.reactionType === reactionType) {
    await prisma.reaction.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const reactionCount = await prisma.reaction.count({
      where: {
        postId,
      },
    });

    const reactionSummaryRaw = await prisma.reaction.groupBy({
      by: ["reactionType"],
      where: {
        postId,
      },
      _count: {
        reactionType: true,
      },
    });

    const reactionSummary = reactionSummaryRaw.reduce(
      (acc, item) => {
        acc[item.reactionType] = item._count.reactionType;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      message: "Bỏ cảm xúc thành công",
      data: {
        action: "REMOVED",
        currentReaction: null,
        reactionCount,
        reactionSummary,
        reaction: null,
      },
    };
  }

  const updatedReaction = await prisma.reaction.update({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    data: {
      reactionType,
    },
  });

  const reactionCount = await prisma.reaction.count({
    where: {
      postId,
    },
  });

  const reactionSummaryRaw = await prisma.reaction.groupBy({
    by: ["reactionType"],
    where: {
      postId,
    },
    _count: {
      reactionType: true,
    },
  });

  const reactionSummary = reactionSummaryRaw.reduce(
    (acc, item) => {
      acc[item.reactionType] = item._count.reactionType;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    message: "Cập nhật cảm xúc thành công",
    data: {
      action: "UPDATED",
      currentReaction: updatedReaction.reactionType,
      reactionCount,
      reactionSummary,
      reaction: updatedReaction,
    },
  };
};

export const updatePostService = async ({
  userId,
  postId,
  content,
  contentFormat = PostContentFormat.HTML,
}: {
  userId: number;
  postId: number;
  content: string;
  contentFormat?: PostContentFormatType;
}) => {
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!existingPost) {
    throw new Error("Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new Error("Bài viết không khả dụng để chỉnh sửa");
  }

  if (existingPost.userId !== userId) {
    throw new Error("Bạn không có quyền sửa bài viết này");
  }

  const processed = processPostContent(content, contentFormat);

  return prisma.post.update({
    where: { id: postId },
    data: {
      content: processed.content,
      contentFormat: processed.contentFormat,
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
      attachments: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });
};

export const deletePostService = async (userId: number, postId: number) => {
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!existingPost) {
    throw new Error("Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new Error("Bài viết không khả dụng để xóa");
  }

  if (existingPost.userId !== userId) {
    throw new Error("Bạn không có quyền xóa bài viết này");
  }

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });

  return true;
};

export const getPostById = async (postId: number, userId: number) => {
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
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
      group: {
        select: {
          id: true,
          groupName: true,
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
      attachments: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });
  if (!existingPost) {
    throw new Error("Post không tồn tại");
  }

  const attachmentsWithUrl = await Promise.all(
    existingPost.attachments.map(async (attachment) => {
      const url = await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60);
      return {
        ...attachment,
        fileUrl: url,
      };
    }),
  );

  return {
    ...existingPost,
    attachments: attachmentsWithUrl,
  };
};

export const pinPostByUserId = async (
  postId: number,
  userId: number,
  groupId: number | null,
  isPinned: boolean,
) => {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  if (!post || post.groupId !== groupId) {
    throw new Error("Không tìm thấy bài post");
  }

  if (groupId === null) {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!currentUser || currentUser.role !== Role.ADMIN) {
      throw new Error("Bạn không có quyền thực hiện thao tác này");
    }
  } else {
    const member = await prisma.groupMember.findFirst({
      where: {
        userId,
        groupId,
      },
    });

    if (!member || member.memberRole === GroupMemberRole.MEMBER) {
      throw new Error("Bạn không có quyền thực hiện thao tác này");
    }
  }

  return prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      isPinned,
    },
  });
};
