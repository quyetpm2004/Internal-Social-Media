import { Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getFileUrl } from "@/modules/file/file.service";
import prisma from "@/shared/utils/prisma";

const MAX_HISTORY = 20;
const DEFAULT_LIMIT = 20;

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

const mapUserWithAvatar = async (user: {
  id: number;
  fullName: string;
  profile: { avatarKey: string | null } | null;
}) => {
  const avatarUrl = user.profile?.avatarKey
    ? await getFileUrl(user.profile.avatarKey, 24 * 60 * 60)
    : null;

  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl,
  };
};

export const searchChatUsers = async (
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
        profile: { select: { avatarKey: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.count({ where }),
  ]);

  const items = await Promise.all(users.map(mapUserWithAvatar));

  return {
    users: items,
    pagination: buildPagination(total, currentPage, take),
  };
};

export const getChatSearchHistory = async (userId: number, limit = 10) => {
  const take = Math.min(Math.max(Number(limit) || 10, 1), MAX_HISTORY);

  const histories = await prisma.chatSearchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "desc" },
    take,
    select: {
      id: true,
      searchedAt: true,
      targetUser: {
        select: {
          id: true,
          fullName: true,
          profile: { select: { avatarKey: true } },
        },
      },
    },
  });

  return Promise.all(
    histories.map(async (item) => ({
      id: item.id,
      searchedAt: item.searchedAt,
      user: await mapUserWithAvatar(item.targetUser),
    })),
  );
};

export const addChatSearchHistory = async (
  userId: number,
  targetUserId: number,
) => {
  if (targetUserId === userId) {
    throw new AppError(400, "Không thể lưu lịch sử với chính bạn");
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, status: Status.ACTIVE },
    select: { id: true },
  });

  if (!targetUser) {
    throw new AppError(404, "Không tìm thấy người dùng");
  }

  await prisma.chatSearchHistory.upsert({
    where: {
      userId_targetUserId: { userId, targetUserId },
    },
    create: { userId, targetUserId },
    update: { searchedAt: new Date() },
  });

  const count = await prisma.chatSearchHistory.count({ where: { userId } });

  if (count > MAX_HISTORY) {
    const oldest = await prisma.chatSearchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: "asc" },
      take: count - MAX_HISTORY,
      select: { id: true },
    });

    await prisma.chatSearchHistory.deleteMany({
      where: { id: { in: oldest.map((h) => h.id) } },
    });
  }

  return getChatSearchHistory(userId);
};

export const deleteChatSearchHistoryItem = async (
  userId: number,
  historyId: number,
) => {
  const deleted = await prisma.chatSearchHistory.deleteMany({
    where: { id: historyId, userId },
  });

  if (deleted.count === 0) {
    throw new AppError(404, "Không tìm thấy lịch sử tìm kiếm");
  }
};
