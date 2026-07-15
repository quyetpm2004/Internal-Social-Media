import { GroupStatus, PostStatus, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getFileUrl } from "@/modules/file/file.service";
import {
  notifyPostApproved,
  notifyPostRejected,
} from "@/modules/notification/notification.service";
import type {
  AdminCommentListQuery,
  AdminGroupListQuery,
  AdminGroupMembersQuery,
  AdminPostListQuery,
  AdminUserListQuery,
  ReviewPostInput,
  UpdateCommentStatusInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from "@/modules/admin/admin.schema";
import * as adminRepo from "@/modules/admin/admin.repository";

const paginate = (page: number, limit: number) => {
  const take = Math.max(limit, 1);
  const skip = (Math.max(page, 1) - 1) * take;
  return { take, skip };
};

const RECENT_ACTIVITY_LIMIT = 5;
const CHART_DAYS = 14;
const TOP_GROUPS_LIMIT = 5;

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatChartLabel = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

const buildDailySeries = (
  items: { createdAt: Date }[],
  days: number,
) => {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return {
      date: formatChartLabel(date),
      count: 0,
    };
  });

  const bucketStarts = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return startOfDay(date).getTime();
  });

  for (const item of items) {
    const dayStart = startOfDay(item.createdAt).getTime();
    const bucketIndex = bucketStarts.indexOf(dayStart);
    if (bucketIndex >= 0) {
      buckets[bucketIndex].count += 1;
    }
  }

  return buckets;
};

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalPosts,
    totalGroups,
    activeUsers,
    pendingReviewPosts,
    pendingUsers,
    inactiveUsers,
    inactiveGroups,
    recentPosts,
    recentUsers,
  ] = await Promise.all([
    adminRepo.countUsers(),
    adminRepo.countPosts({ status: { not: PostStatus.DELETED } }),
    adminRepo.countGroups({ status: { not: GroupStatus.ARCHIVED } }),
    adminRepo.countUsers({ status: Status.ACTIVE }),
    adminRepo.countPosts({ status: PostStatus.PENDING_REVIEW }),
    adminRepo.countUsers({ status: Status.PENDING }),
    adminRepo.countUsers({ status: Status.INACTIVE }),
    adminRepo.countGroups({ status: GroupStatus.INACTIVE }),
    adminRepo.findRecentPosts(RECENT_ACTIVITY_LIMIT),
    adminRepo.findRecentUsers(RECENT_ACTIVITY_LIMIT),
  ]);

  return {
    stats: { totalUsers, totalPosts, totalGroups, activeUsers },
    alerts: { pendingReviewPosts, pendingUsers, inactiveUsers, inactiveGroups },
    recentPosts,
    recentUsers,
    charts: await getDashboardCharts(),
  };
};

const getDashboardCharts = async () => {
  const since = new Date();
  since.setDate(since.getDate() - (CHART_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [
    usersCreated,
    postsCreated,
    commentsCreated,
    publicPosts,
    groupPosts,
    topGroupsRaw,
  ] = await Promise.all([
    adminRepo.findUserCreatedAtSince(since),
    adminRepo.findPostCreatedAtSince(since),
    adminRepo.findCommentCreatedAtSince(since),
    adminRepo.countPublicPosts(),
    adminRepo.countGroupVisibilityPosts(),
    adminRepo.findTopGroupsByPostCount(TOP_GROUPS_LIMIT),
  ]);

  const userGrowth = buildDailySeries(usersCreated, CHART_DAYS);
  const postGrowth = buildDailySeries(postsCreated, CHART_DAYS);
  const commentGrowth = buildDailySeries(commentsCreated, CHART_DAYS);

  return {
    growth: {
      labels: userGrowth.map((item) => item.date),
      users: userGrowth.map((item) => item.count),
      posts: postGrowth.map((item) => item.count),
      comments: commentGrowth.map((item) => item.count),
    },
    postVisibility: {
      public: publicPosts,
      group: groupPosts,
    },
    topGroups: topGroupsRaw.map((group) => ({
      id: group.id,
      name: group.groupName,
      postCount: group._count.posts,
    })),
  };
};

export const listUsers = async (query: AdminUserListQuery) => {
  const { search, status, role, page, limit } = query;
  const { take, skip } = paginate(page, limit);

  const where = {
    ...(status ? { status } : {}),
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    adminRepo.findUsers(where, skip, take),
    adminRepo.countUsers(where),
  ]);

  return {
    users,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const updateUserStatus = async (
  adminId: number,
  userId: number,
  data: UpdateUserStatusInput,
) => {
  if (adminId === userId) {
    throw new AppError(400, "Không thể thay đổi trạng thái tài khoản của chính bạn");
  }

  const user = await adminRepo.findUserById(userId);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  return adminRepo.updateUserStatus(userId, data.status);
};

export const updateUserRole = async (
  adminId: number,
  userId: number,
  data: UpdateUserRoleInput,
) => {
  if (adminId === userId) {
    throw new AppError(400, "Không thể thay đổi vai trò của chính bạn");
  }

  const user = await adminRepo.findUserById(userId);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  return adminRepo.updateUserRole(userId, data.role);
};

export const listPosts = async (query: AdminPostListQuery) => {
  const { search, status, page, limit } = query;
  const { take, skip } = paginate(page, limit);

  const where = {
    ...(status ? { status } : { status: { not: PostStatus.DELETED } }),
    ...(search
      ? {
          OR: [
            { content: { contains: search } },
            { user: { fullName: { contains: search } } },
            { user: { email: { contains: search } } },
          ],
        }
      : {}),
  };

  const [posts, total] = await Promise.all([
    adminRepo.findPosts(where, skip, take),
    adminRepo.countPosts(where),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getPostDetail = async (postId: number) => {
  const post = await adminRepo.findPostDetail(postId);

  if (!post) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  const attachmentsWithUrl = await Promise.all(
    post.attachments.map(async (attachment) => {
      const fileUrl = await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60);
      return { ...attachment, fileUrl };
    }),
  );

  return { ...post, attachments: attachmentsWithUrl };
};

export const deletePost = async (postId: number) => {
  const post = await adminRepo.findPostById(postId);
  if (!post) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (post.status === PostStatus.DELETED) {
    throw new AppError(400, "Bài viết đã bị xóa");
  }

  await adminRepo.updatePostStatus(postId, PostStatus.DELETED);
  return true;
};

export const reviewPost = async (
  adminId: number,
  postId: number,
  data: ReviewPostInput,
) => {
  const post = await adminRepo.findPostForReview(postId);

  if (!post) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (post.status !== PostStatus.PENDING_REVIEW) {
    throw new AppError(400, "Bài viết không ở trạng thái chờ duyệt");
  }

  if (data.action === "approve") {
    const updated = await adminRepo.updatePostStatusWithSelect(
      postId,
      PostStatus.ACTIVE,
    );

    if (post.groupId) {
      await notifyPostApproved(postId, post.groupId, adminId);
    }

    return updated;
  }

  await adminRepo.updatePostStatus(postId, PostStatus.DELETED);

  if (post.groupId) {
    await notifyPostRejected(postId, post.groupId, adminId);
  }

  return { id: postId, status: PostStatus.DELETED };
};

export const listComments = async (query: AdminCommentListQuery) => {
  const { search, status, page, limit } = query;
  const { take, skip } = paginate(page, limit);

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { content: { contains: search } },
            { user: { fullName: { contains: search } } },
            { user: { email: { contains: search } } },
            { post: { content: { contains: search } } },
          ],
        }
      : {}),
  };

  const [comments, total] = await Promise.all([
    adminRepo.findComments(where, skip, take),
    adminRepo.countComments(where),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const updateCommentStatus = async (
  commentId: number,
  data: UpdateCommentStatusInput,
) => {
  const comment = await adminRepo.findCommentById(commentId);

  if (!comment) {
    throw new AppError(404, "Comment không tồn tại");
  }

  return adminRepo.updateCommentStatus(commentId, data.status);
};

export const listGroups = async (query: AdminGroupListQuery) => {
  const { search, status, page, limit } = query;
  const { take, skip } = paginate(page, limit);

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { groupName: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };

  const [groups, total] = await Promise.all([
    adminRepo.findGroups(where, skip, take),
    adminRepo.countGroups(where),
  ]);

  return {
    groups,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getGroupDetail = async (groupId: number) => {
  const group = await adminRepo.findGroupDetail(groupId);

  if (!group) {
    throw new AppError(404, "Nhóm không tồn tại");
  }

  let coverUrl: string | null = null;
  if (group.coverKey) {
    coverUrl = await getFileUrl(group.coverKey, 7 * 24 * 60 * 60);
  }

  return { ...group, coverUrl };
};

export const listGroupMembers = async (
  groupId: number,
  query: AdminGroupMembersQuery,
) => {
  const group = await adminRepo.findGroupById(groupId);
  if (!group) {
    throw new AppError(404, "Nhóm không tồn tại");
  }

  const { page, limit } = query;
  const { take, skip } = paginate(page, limit);

  const [members, total] = await Promise.all([
    adminRepo.findGroupMembers(groupId, skip, take),
    adminRepo.countGroupMembers(groupId),
  ]);

  return {
    members: members.map((member) => ({
      id: member.id,
      memberRole: member.memberRole,
      joinedAt: member.joinedAt,
      status: member.status,
      user: member.user,
    })),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const deleteGroup = async (groupId: number) => {
  const group = await adminRepo.findGroupById(groupId);
  if (!group) {
    throw new AppError(404, "Nhóm không tồn tại");
  }

  if (group.status === GroupStatus.ARCHIVED) {
    throw new AppError(400, "Nhóm đã bị xóa");
  }

  await adminRepo.updateGroupStatus(groupId, GroupStatus.ARCHIVED);
  return true;
};
