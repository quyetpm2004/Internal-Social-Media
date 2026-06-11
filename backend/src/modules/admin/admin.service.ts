import { GroupStatus, PostStatus, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";
import type {
  AdminGroupListQuery,
  AdminPostListQuery,
  AdminUserListQuery,
  UpdateUserStatusInput,
} from "@/modules/admin/admin.schema";

const paginate = (page: number, limit: number) => {
  const take = Math.max(limit, 1);
  const skip = (Math.max(page, 1) - 1) * take;
  return { take, skip };
};

export const getDashboardStats = async () => {
  const [totalUsers, totalPosts, totalGroups, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { status: { not: PostStatus.DELETED } } }),
    prisma.group.count({ where: { status: { not: GroupStatus.ARCHIVED } } }),
    prisma.user.count({ where: { status: Status.ACTIVE } }),
  ]);

  return { totalUsers, totalPosts, totalGroups, activeUsers };
};

export const listUsers = async (query: AdminUserListQuery) => {
  const { search, status, page, limit } = query;
  const { take, skip } = paginate(page, limit);

  const where = {
    ...(status ? { status } : {}),
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
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where }),
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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: data.status },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updated;
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
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        status: true,
        visibility: true,
        isPinned: true,
        isAnonymous: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true } },
        group: { select: { id: true, groupName: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    }),
    prisma.post.count({ where }),
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
  const post = await prisma.post.findUnique({
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
      group: { select: { id: true, groupName: true } },
      attachments: true,
      _count: { select: { comments: true, reactions: true } },
    },
  });

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
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new AppError(404, "Bài viết không tồn tại");
  }

  if (post.status === PostStatus.DELETED) {
    throw new AppError(400, "Bài viết đã bị xóa");
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.DELETED },
  });

  return true;
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
    prisma.group.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        groupName: true,
        description: true,
        groupType: true,
        status: true,
        createdAt: true,
        creator: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true } },
      },
    }),
    prisma.group.count({ where }),
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
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { members: true, posts: true } },
    },
  });

  if (!group) {
    throw new AppError(404, "Nhóm không tồn tại");
  }

  let coverUrl: string | null = null;
  if (group.coverKey) {
    coverUrl = await getFileUrl(group.coverKey, 7 * 24 * 60 * 60);
  }

  return { ...group, coverUrl };
};

export const deleteGroup = async (groupId: number) => {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new AppError(404, "Nhóm không tồn tại");
  }

  if (group.status === GroupStatus.ARCHIVED) {
    throw new AppError(400, "Nhóm đã bị xóa");
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { status: GroupStatus.ARCHIVED },
  });

  return true;
};
