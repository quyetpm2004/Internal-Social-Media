import { GroupMemberStatus, GroupStatus, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getFileUrl } from "@/modules/file/file.service";
import type { SearchQuery } from "@/modules/search/search.schema";
import prisma from "@/shared/utils/prisma";

const findGroupMember = async (groupId: number, userId: number) => {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
};

const countActiveMembers = async (groupId: number) => {
  return prisma.groupMember.count({
    where: { groupId, status: GroupMemberStatus.ACTIVE },
  });
};

const MAX_HISTORY = 20;
const DEFAULT_LIMIT = 10;

const normalizeQuery = (query: unknown) => String(query ?? "").trim();

const parsePagination = (page: unknown, limit: unknown) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const take = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 50);
  const skip = (currentPage - 1) * take;
  return { currentPage, take, skip };
};

const buildPagination = (total: number, currentPage: number, take: number) => {
  const totalPages = Math.max(Math.ceil(total / take), 1);
  return {
    total,
    page: currentPage,
    limit: take,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

export const searchUsers = async (
  userId: number,
  query: string,
  page = 1,
  limit = DEFAULT_LIMIT,
) => {
  const { currentPage, take, skip } = parsePagination(page, limit);

  const where = {
    status: Status.ACTIVE,
    id: { not: userId },
    OR: [{ fullName: { contains: query } }, { email: { contains: query } }],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        fullName: true,
        email: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
        profile: { select: { avatarKey: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.count({ where }),
  ]);

  const usersWithAvatar = await Promise.all(
    users.map(async (user) => {
      const avatarUrl = user.profile?.avatarKey
        ? await getFileUrl(user.profile.avatarKey, 24 * 60 * 60)
        : null;

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl,
        departmentName: user.department?.name ?? null,
        positionName: user.position?.name ?? null,
      };
    }),
  );

  return {
    users: usersWithAvatar,
    pagination: buildPagination(total, currentPage, take),
  };
};

export const searchGroups = async (
  userId: number,
  query: string,
  page = 1,
  limit = DEFAULT_LIMIT,
) => {
  const { currentPage, take, skip } = parsePagination(page, limit);

  const where = {
    status: GroupStatus.ACTIVE,
    OR: [
      { groupName: { contains: query } },
      { description: { contains: query } },
    ],
  };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take,
      include: {
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.group.count({ where }),
  ]);

  const groupsWithMeta = await Promise.all(
    groups.map(async (group) => {
      const membership = await findGroupMember(group.id, userId);
      const activeMemberCount = await countActiveMembers(group.id);

      const coverUrl = group.coverKey
        ? await getFileUrl(group.coverKey, 24 * 60 * 60)
        : null;

      return {
        id: group.id,
        groupName: group.groupName,
        description: group.description,
        groupType: group.groupType,
        coverUrl,
        isMember: membership?.status === GroupMemberStatus.ACTIVE,
        membershipStatus: membership?.status ?? null,
        memberCount: activeMemberCount,
        postCount: group._count.posts,
      };
    }),
  );

  return {
    groups: groupsWithMeta,
    pagination: buildPagination(total, currentPage, take),
  };
};

export const searchAll = async (
  userId: number,
  query: string,
  page = 1,
  limit = DEFAULT_LIMIT,
) => {
  const previewLimit = Math.min(limit, 5);

  const [usersResult, groupsResult] = await Promise.all([
    searchUsers(userId, query, 1, previewLimit),
    searchGroups(userId, query, 1, previewLimit),
  ]);

  return {
    users: usersResult.users,
    groups: groupsResult.groups,
    counts: {
      users: usersResult.pagination.total,
      groups: groupsResult.pagination.total,
    },
    pagination: buildPagination(
      usersResult.pagination.total + groupsResult.pagination.total,
      page,
      limit,
    ),
  };
};

export const performSearch = async (userId: number, params: SearchQuery) => {
  const query = normalizeQuery(params.q);
  const type = params.type ?? "all";
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (!query) {
    return {
      query: "",
      type,
      users: [],
      groups: [],
      counts: null,
      pagination: null,
    };
  }

  if (type === "people") {
    const result = await searchUsers(userId, query, page, limit);
    return { query, type, ...result, groups: [], counts: null };
  }

  if (type === "groups") {
    const result = await searchGroups(userId, query, page, limit);
    return { query, type, users: [], ...result, counts: null };
  }

  const result = await searchAll(userId, query, page, limit);
  return { query, type: "all", ...result };
};

export const getSearchHistory = async (userId: number, limit = 10) => {
  const take = Math.min(Math.max(Number(limit) || 10, 1), MAX_HISTORY);

  return prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "desc" },
    take,
    select: {
      id: true,
      query: true,
      searchedAt: true,
    },
  });
};

export const addSearchHistory = async (userId: number, query: string) => {
  const normalized = normalizeQuery(query);

  if (!normalized || normalized.length > 255) {
    throw new AppError(400, "Từ khóa tìm kiếm không hợp lệ");
  }

  await prisma.searchHistory.upsert({
    where: {
      userId_query: { userId, query: normalized },
    },
    create: { userId, query: normalized },
    update: { searchedAt: new Date() },
  });

  const count = await prisma.searchHistory.count({ where: { userId } });

  if (count > MAX_HISTORY) {
    const oldest = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: "asc" },
      take: count - MAX_HISTORY,
      select: { id: true },
    });

    await prisma.searchHistory.deleteMany({
      where: { id: { in: oldest.map((h) => h.id) } },
    });
  }

  return getSearchHistory(userId);
};

export const deleteSearchHistoryItem = async (
  userId: number,
  historyId: number,
) => {
  const deleted = await prisma.searchHistory.deleteMany({
    where: { id: historyId, userId },
  });

  if (deleted.count === 0) {
    throw new AppError(404, "Không tìm thấy lịch sử tìm kiếm");
  }
};

export const clearSearchHistory = async (userId: number) => {
  await prisma.searchHistory.deleteMany({ where: { userId } });
};
