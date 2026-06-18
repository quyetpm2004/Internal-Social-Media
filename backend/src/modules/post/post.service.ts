import {
  EventAttendanceStatus,
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
import { PostContentFormat } from "@/shared/constants/post-content-format";
import type { PostContentFormat as PostContentFormatType } from "@/shared/constants/post-content-format";

import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";
import { processPostContent } from "@/shared/utils/sanitize-html";
import {
  assertGroupAllowsAnonymousContent,
  maskGroupPostAuthors,
} from "@/shared/utils/group-anonymous";
import {
  notifyPostPinned,
  notifyPostReaction,
} from "@/modules/notification/notification.service";
import type { PollInput } from "@/modules/poll/poll.schema";
import {
  attachPollSummaryToPosts,
  createPollInTransaction,
} from "@/modules/poll/poll.service";
import { getPollInclude } from "@/modules/poll/poll.types";

type EventInput = {
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date;
  location?: string;
};

type EventForSummary = {
  id: number;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  attendees?: Array<{
    userId: number;
    status: EventAttendanceStatus;
  }>;
};

const attachEventSummaryToPosts = async <
  T extends { event?: EventForSummary | null } & Record<
    string,
    unknown
  >,
>(
  posts: T[],
  userId: number,
) => {
  return posts.map((post) => ({
    ...post,
    event: post.event
      ? (() => {
          const { attendees, ...eventBase } = post.event;
          return {
            ...eventBase,
            startAt: eventBase.startAt.toISOString(),
            endAt: eventBase.endAt ? eventBase.endAt.toISOString() : null,
          attendeeSummary: {
            going:
              attendees?.filter(
                (attendee) => attendee.status === EventAttendanceStatus.GOING,
              ).length ?? 0,
            maybe:
              attendees?.filter(
                (attendee) => attendee.status === EventAttendanceStatus.MAYBE,
              ).length ?? 0,
            declined:
              attendees?.filter(
                (attendee) => attendee.status === EventAttendanceStatus.DECLINED,
              ).length ?? 0,
          },
          myResponse:
            attendees?.find((attendee) => attendee.userId === userId)
              ?.status ?? null,
          };
        })()
      : null,
  }));
};

const attachPostEnhancements = async <
  T extends {
    poll?: unknown;
    event?: EventForSummary | null;
    savedBy?: Array<{ id: number }>;
  } & Record<
    string,
    unknown
  >,
>(
  posts: T[],
  userId: number,
) => {
  const withPoll = await attachPollSummaryToPosts(posts as any, userId);
  const withEvent = (await attachEventSummaryToPosts(
    withPoll as any,
    userId,
  )) as Array<Record<string, any>>;
  return withEvent.map((post) => ({
    ...post,
    isSaved: (post.savedBy?.length ?? 0) > 0,
  }));
};

type GetPostListParams = {
  page?: number;
  limit?: number;
  sort?: "latest" | "trending";
  groupId?: number;
};

const buildPostInclude = (userId: number) => ({
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
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
      userId,
    },
    select: {
      reactionType: true,
    },
  },
  attachments: true,
  poll: getPollInclude(userId),
  event: {
    include: {
      attendees: {
        select: {
          userId: true,
          status: true,
        },
      },
    },
  },
  savedBy: {
    where: { userId },
    select: { id: true },
  },
  _count: {
    select: {
      comments: true,
      reactions: true,
    },
  },
});

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
    postStatusFilter = PostStatus.ACTIVE;
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
      include: buildPostInclude(userId),
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
    include: buildPostInclude(userId),
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

  if (groupId) {
    const maskedPinned = await maskGroupPostAuthors(
      groupId,
      userId,
      pinnedPostsWithUrlAttachments,
    );
    const maskedPosts = await maskGroupPostAuthors(
      groupId,
      userId,
      normalizePostsWithUrlAttachments,
    );

    return {
      page,
      limit,
      sort,
      hasMore,
      pinnedPosts: await attachPostEnhancements(maskedPinned, userId),
      posts: await attachPostEnhancements(maskedPosts, userId),
    };
  }

  return {
    page,
    limit,
    sort,
    hasMore,
    pinnedPosts: await attachPostEnhancements(
      pinnedPostsWithUrlAttachments,
      userId,
    ),
    posts: await attachPostEnhancements(normalizePostsWithUrlAttachments, userId),
  };
};

type CreatePostParams = {
  userId: number;
  content: string;
  contentFormat?: PostContentFormatType;
  visibility?: PostVisibility;
  groupId?: number;
  attachmentIds?: number[];
  isAnonymous?: boolean;
  poll?: PollInput;
  event?: EventInput;
};

export const createPostService = async ({
  userId,
  content,
  contentFormat = PostContentFormat.HTML,
  visibility = "PUBLIC",
  groupId,
  attachmentIds = [],
  isAnonymous: wantsAnonymous = false,
  poll,
  event,
}: CreatePostParams) => {
  const hasPoll = Boolean(poll);
  const hasEvent = Boolean(event);
  const trimmedContent = content.trim();
  let processed: { content: string; contentFormat: PostContentFormatType };

  if (!trimmedContent && hasPoll) {
    processed = {
      content: poll!.question,
      contentFormat: PostContentFormat.PLAIN,
    };
  } else if (!trimmedContent && hasEvent) {
    processed = {
      content: event!.title,
      contentFormat: PostContentFormat.PLAIN,
    };
  } else {
    processed = processPostContent(content, contentFormat);
  }
  let groupPostStatus: PostStatus = PostStatus.ACTIVE;
  const isAnonymous = wantsAnonymous === true;

  if (groupId) {
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        status: true,
        postPermission: true,
        postApprovalRequired: true,
        allowAnonymousJoin: true,
      },
    });

    if (!existingGroup) {
      throw new AppError(404, "GROUP_NOT_FOUND");
    }

    if (existingGroup.status !== GroupStatus.ACTIVE) {
      throw new AppError(400, "Nhóm không hoạt động");
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!membership || membership.status !== GroupMemberStatus.ACTIVE) {
      throw new AppError(400, "Bạn phải là thành viên nhóm");
    }

    if (
      existingGroup.postPermission === GroupPermission.ADMIN_ONLY &&
      membership.memberRole !== GroupMemberRole.ADMIN
    ) {
      throw new AppError(400, "Chỉ quản trị viên mới có thể đăng bài trong nhóm này");
    }

    await assertGroupAllowsAnonymousContent(groupId, isAnonymous);

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
      throw new AppError(400, "INVALID_ATTACHMENTS");
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
        isAnonymous: groupId ? isAnonymous : false,
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

    if (poll) {
      await createPollInTransaction(tx, {
        ...poll,
        postId: createdPost.id,
      });
    }

    if (event) {
      await tx.event.create({
        data: {
          postId: createdPost.id,
          title: event.title,
          description: event.description?.trim() || null,
          startAt: event.startAt,
          endAt: event.endAt ?? null,
          location: event.location?.trim() || null,
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
      include: buildPostInclude(userId),
    });
  });

  if (!post) {
    throw new AppError(500, "Không thể tạo bài viết");
  }

  const [mappedPost] = await attachPostEnhancements([post], userId);
  return mappedPost;
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
    throw new AppError(404, "Người dùng không tồn tại");
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existingPost) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new AppError(400, "Bài viết không khả dụng để tương tác");
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

    await notifyPostReaction(postId, userId, reactionType);

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
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new AppError(400, "Bài viết không khả dụng để chỉnh sửa");
  }

  if (existingPost.userId !== userId) {
    throw new AppError(403, "Bạn không có quyền sửa bài viết này");
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
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (existingPost.status !== "ACTIVE") {
    throw new AppError(400, "Bài viết không khả dụng để xóa");
  }

  if (existingPost.userId !== userId) {
    throw new AppError(403, "Bạn không có quyền xóa bài viết này");
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
    include: buildPostInclude(userId),
  });
  if (!existingPost) {
    throw new AppError(404, "Post không tồn tại");
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

  const postWithAttachments = {
    ...existingPost,
    attachments: attachmentsWithUrl,
  };

  if (existingPost.groupId) {
    const [maskedPost] = await maskGroupPostAuthors(
      existingPost.groupId,
      userId,
      [postWithAttachments],
    );

    const [mappedPost] = await attachPostEnhancements([maskedPost], userId);
    return mappedPost;
  }

  const [mappedPost] = await attachPostEnhancements(
    [postWithAttachments],
    userId,
  );
  return mappedPost;
};

const assertUserCanAccessPost = async (postId: number, userId: number) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      groupId: true,
      status: true,
      visibility: true,
    },
  });

  if (!post) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (post.status !== PostStatus.ACTIVE) {
    throw new AppError(400, "Bài viết không khả dụng");
  }

  if (post.groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: post.groupId, userId } },
      select: { status: true },
    });
    if (!member || member.status !== GroupMemberStatus.ACTIVE) {
      throw new AppError(403, "Bạn không có quyền truy cập bài viết này");
    }
  }

  return post;
};

export const toggleSavePostService = async ({
  postId,
  userId,
}: {
  postId: number;
  userId: number;
}) => {
  await assertUserCanAccessPost(postId, userId);

  const existed = await prisma.savedPost.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existed) {
    await prisma.savedPost.delete({
      where: {
        userId_postId: { userId, postId },
      },
    });
    return { isSaved: false };
  }

  await prisma.savedPost.create({
    data: {
      userId,
      postId,
    },
  });
  return { isSaved: true };
};

export const getSavedPostListService = async ({
  userId,
  page = 1,
  limit = 10,
}: {
  userId: number;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const saved = await prisma.savedPost.findMany({
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
    orderBy: {
      savedAt: "desc",
    },
    skip,
    take: limit + 1,
    include: {
      post: {
        include: buildPostInclude(userId),
      },
    },
  });

  const hasMore = saved.length > limit;
  const sliced = hasMore ? saved.slice(0, limit) : saved;
  const posts = sliced.map((item: any) => item.post);

  const postsWithAttachmentUrls = await Promise.all(
    posts.map(async (post: any) => {
      const attachments = await Promise.all(
        post.attachments.map(async (attachment: any) => ({
          ...attachment,
          fileUrl: await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60),
        })),
      );
      return {
        ...post,
        attachments,
      };
    }),
  );

  const groupIds = [
    ...new Set(
      postsWithAttachmentUrls
        .map((p: any) => p.groupId)
        .filter(Boolean),
    ),
  ] as number[];
  let maskedPosts = postsWithAttachmentUrls;
  for (const groupId of groupIds) {
    const groupPosts = maskedPosts.filter((p: any) => p.groupId === groupId);
    const others = maskedPosts.filter((p: any) => p.groupId !== groupId);
    const masked = await maskGroupPostAuthors(groupId, userId, groupPosts);
    maskedPosts = [...others, ...masked];
  }

  const idOrder = new Map(
    postsWithAttachmentUrls.map((post: any, idx: number) => [post.id, idx]),
  );
  maskedPosts.sort(
    (a: any, b: any) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0),
  );

  return {
    page,
    limit,
    hasMore,
    posts: await attachPostEnhancements(maskedPosts, userId),
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
    throw new AppError(404, "Không tìm thấy bài post");
  }

  if (groupId === null) {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!currentUser || currentUser.role !== Role.ADMIN) {
      throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
    }
  } else {
    const member = await prisma.groupMember.findFirst({
      where: {
        userId,
        groupId,
      },
    });

    if (!member || member.memberRole === GroupMemberRole.MEMBER) {
      throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
    }
  }

  const updated = await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      isPinned,
    },
  });

  await notifyPostPinned(postId, userId, isPinned);

  return updated;
};
