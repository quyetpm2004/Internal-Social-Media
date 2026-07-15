import { GroupMemberStatus, GroupStatus, Prisma, Status } from "@prisma/client";
import prisma from "@/shared/utils/prisma";

const searchUserSelect = {
  id: true,
  fullName: true,
  email: true,
  department: { select: { name: true } },
  position: { select: { name: true } },
  profile: { select: { avatarKey: true } },
} as const;

const searchHistorySelect = {
  id: true,
  query: true,
  searchedAt: true,
} as const;

export const findUsers = (
  where: Prisma.UserWhereInput,
  skip: number,
  take: number,
) =>
  prisma.user.findMany({
    where,
    skip,
    take,
    select: searchUserSelect,
    orderBy: { fullName: "asc" },
  });

export const countUsers = (where: Prisma.UserWhereInput) =>
  prisma.user.count({ where });

export const buildUserSearchWhere = (userId: number, query: string) => ({
  status: Status.ACTIVE,
  id: { not: userId },
  OR: [{ fullName: { contains: query } }, { email: { contains: query } }],
});

export const findGroups = (
  where: Prisma.GroupWhereInput,
  skip: number,
  take: number,
) =>
  prisma.group.findMany({
    where,
    skip,
    take,
    include: {
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

export const countGroups = (where: Prisma.GroupWhereInput) =>
  prisma.group.count({ where });

export const buildGroupSearchWhere = (query: string) => ({
  status: GroupStatus.ACTIVE,
  OR: [
    { groupName: { contains: query } },
    { description: { contains: query } },
  ],
});

export const findGroupMember = (groupId: number, userId: number) =>
  prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

export const countActiveMembers = (groupId: number) =>
  prisma.groupMember.count({
    where: { groupId, status: GroupMemberStatus.ACTIVE },
  });

export const findSearchHistory = (userId: number, take: number) =>
  prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "desc" },
    take,
    select: searchHistorySelect,
  });

export const upsertSearchHistory = (userId: number, query: string) =>
  prisma.searchHistory.upsert({
    where: {
      userId_query: { userId, query },
    },
    create: { userId, query },
    update: { searchedAt: new Date() },
  });

export const countSearchHistory = (userId: number) =>
  prisma.searchHistory.count({ where: { userId } });

export const findOldestSearchHistoryIds = (userId: number, take: number) =>
  prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { searchedAt: "asc" },
    take,
    select: { id: true },
  });

export const deleteSearchHistoryByIds = (ids: number[]) =>
  prisma.searchHistory.deleteMany({
    where: { id: { in: ids } },
  });

export const deleteSearchHistoryItem = (userId: number, historyId: number) =>
  prisma.searchHistory.deleteMany({
    where: { id: historyId, userId },
  });

export const clearSearchHistory = (userId: number) =>
  prisma.searchHistory.deleteMany({ where: { userId } });
