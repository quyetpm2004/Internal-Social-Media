import { PostVisibility, Prisma, ReactionType } from "@prisma/client";

import prisma from "../utils/prisma";

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
}: GetPostListParams) => {
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {
    status: "ACTIVE",
    ...(groupId ? { groupId } : {}),
    visibility: "PUBLIC",
  };
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

  const hasMore = posts.length > limit;
  const normalizedPosts = hasMore ? posts.slice(0, limit) : posts;

  return {
    page,
    limit,
    sort,
    hasMore,
    pinnedPosts,
    posts: normalizedPosts,
  };
};

type CreatePostParams = {
  userId: number;
  content: string;
  visibility?: PostVisibility;
  groupId?: number;
  files?: Express.Multer.File[];
};

export const createPostService = async ({
  userId,
  content,
  visibility = "PUBLIC",
  groupId,
  files = [],
}: CreatePostParams) => {
  if (groupId) {
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!existingGroup) {
      throw new Error("Nhóm không tồn tại");
    }
  }

  const uploadedImages = files.map((file) => {
    return {
      fileUrl: `/uploads/posts/${file.filename}`,
      fileType: file.mimetype,
      fileName: file.filename,
    };
  });

  const post = await prisma.post.create({
    data: {
      userId,
      groupId: groupId || null,
      content,
      visibility,
      isPinned: false,
      status: "ACTIVE",
      viewCount: 0,
      attachments: {
        create: uploadedImages.map((image) => ({
          fileUrl: image.fileUrl,
          fileType: image.fileType,
          fileName: image.fileName,
        })),
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
