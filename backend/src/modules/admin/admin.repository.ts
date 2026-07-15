import {
  CommentStatus,
  GroupStatus,
  PostStatus,
  PostVisibility,
  Prisma,
  Role,
  Status,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";

export const recentPostSelect = {
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
} as const;

export const recentUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
} as const;

export const adminCommentSelect = {
  id: true,
  content: true,
  status: true,
  isAnonymous: true,
  isPinned: true,
  createdAt: true,
  parentCommentId: true,
  user: { select: { id: true, fullName: true, email: true } },
  post: {
    select: {
      id: true,
      content: true,
      group: { select: { id: true, groupName: true } },
    },
  },
  _count: { select: { replies: true, reactions: true } },
} as const;

const adminUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
} as const;

const adminUserUpdateSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
} as const;

const adminGroupListSelect = {
  id: true,
  groupName: true,
  description: true,
  groupType: true,
  status: true,
  createdAt: true,
  creator: { select: { id: true, fullName: true, email: true } },
  department: { select: { id: true, name: true } },
  _count: { select: { members: true, posts: true } },
} as const;

const adminGroupMemberSelect = {
  id: true,
  memberRole: true,
  joinedAt: true,
  status: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} as const;

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const countUsers = (where?: Prisma.UserWhereInput) =>
  prisma.user.count({ where });

export const countPosts = (where?: Prisma.PostWhereInput) =>
  prisma.post.count({ where });

export const countGroups = (where?: Prisma.GroupWhereInput) =>
  prisma.group.count({ where });

export const countComments = (where?: Prisma.CommentWhereInput) =>
  prisma.comment.count({ where });

export const findRecentPosts = (take: number) =>
  prisma.post.findMany({
    where: { status: { not: PostStatus.DELETED } },
    take,
    orderBy: { createdAt: "desc" },
    select: recentPostSelect,
  });

export const findRecentUsers = (take: number) =>
  prisma.user.findMany({
    take,
    orderBy: { createdAt: "desc" },
    select: recentUserSelect,
  });

export const findUserCreatedAtSince = (since: Date) =>
  prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

export const findPostCreatedAtSince = (since: Date) =>
  prisma.post.findMany({
    where: {
      createdAt: { gte: since },
      status: { not: PostStatus.DELETED },
    },
    select: { createdAt: true },
  });

export const findCommentCreatedAtSince = (since: Date) =>
  prisma.comment.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

export const countPublicPosts = () =>
  prisma.post.count({
    where: {
      status: { not: PostStatus.DELETED },
      OR: [{ groupId: null }, { visibility: PostVisibility.PUBLIC }],
    },
  });

export const countGroupVisibilityPosts = () =>
  prisma.post.count({
    where: {
      status: { not: PostStatus.DELETED },
      groupId: { not: null },
      visibility: PostVisibility.GROUP,
    },
  });

export const findTopGroupsByPostCount = (take: number) =>
  prisma.group.findMany({
    where: { status: { not: GroupStatus.ARCHIVED } },
    take,
    orderBy: { posts: { _count: "desc" } },
    select: {
      id: true,
      groupName: true,
      _count: { select: { posts: true } },
    },
  });

// ─── Users ───────────────────────────────────────────────────────────────────

export const findUsers = (
  where: Prisma.UserWhereInput,
  skip: number,
  take: number,
) =>
  prisma.user.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: adminUserSelect,
  });

export const findUserById = (userId: number) =>
  prisma.user.findUnique({ where: { id: userId } });

export const updateUserStatus = (userId: number, status: Status) =>
  prisma.user.update({
    where: { id: userId },
    data: { status },
    select: adminUserUpdateSelect,
  });

export const updateUserRole = (userId: number, role: Role) =>
  prisma.user.update({
    where: { id: userId },
    data: { role },
    select: adminUserUpdateSelect,
  });

// ─── Posts ───────────────────────────────────────────────────────────────────

export const findPosts = (
  where: Prisma.PostWhereInput,
  skip: number,
  take: number,
) =>
  prisma.post.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: recentPostSelect,
  });

export const findPostById = (postId: number) =>
  prisma.post.findUnique({ where: { id: postId } });

export const findPostForReview = (postId: number) =>
  prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      status: true,
      groupId: true,
    },
  });

export const findPostDetail = (postId: number) =>
  prisma.post.findUnique({
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

export const updatePostStatus = (postId: number, status: PostStatus) =>
  prisma.post.update({
    where: { id: postId },
    data: { status },
  });

export const updatePostStatusWithSelect = (
  postId: number,
  status: PostStatus,
) =>
  prisma.post.update({
    where: { id: postId },
    data: { status },
    select: recentPostSelect,
  });

// ─── Comments ────────────────────────────────────────────────────────────────

export const findComments = (
  where: Prisma.CommentWhereInput,
  skip: number,
  take: number,
) =>
  prisma.comment.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: adminCommentSelect,
  });

export const findCommentById = (commentId: number) =>
  prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true },
  });

export const updateCommentStatus = (
  commentId: number,
  status: CommentStatus,
) =>
  prisma.comment.update({
    where: { id: commentId },
    data: { status },
    select: adminCommentSelect,
  });

// ─── Groups ──────────────────────────────────────────────────────────────────

export const findGroups = (
  where: Prisma.GroupWhereInput,
  skip: number,
  take: number,
) =>
  prisma.group.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: adminGroupListSelect,
  });

export const findGroupById = (groupId: number) =>
  prisma.group.findUnique({ where: { id: groupId } });

export const findGroupDetail = (groupId: number) =>
  prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: { select: { id: true, fullName: true, email: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { members: true, posts: true } },
    },
  });

export const updateGroupStatus = (groupId: number, status: GroupStatus) =>
  prisma.group.update({
    where: { id: groupId },
    data: { status },
  });

export const findGroupMembers = (
  groupId: number,
  skip: number,
  take: number,
) =>
  prisma.groupMember.findMany({
    where: { groupId },
    skip,
    take,
    orderBy: { joinedAt: "asc" },
    select: adminGroupMemberSelect,
  });

export const countGroupMembers = (groupId: number) =>
  prisma.groupMember.count({ where: { groupId } });
