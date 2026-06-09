import { GroupMemberRole, GroupMemberStatus } from "@prisma/client";
import prisma from "@/shared/utils/prisma";

export const ANONYMOUS_MEMBER_NAME = "Thành viên ẩn danh";

export type GroupViewerContext = {
  viewerId: number;
  viewerRole: GroupMemberRole | null;
};

// kiểm tra xem tác giả có phải là ẩn danh không
export function shouldHideAnonymousAuthor(
  isAnonymous: boolean,
  authorUserId: number,
  viewer: GroupViewerContext,
): boolean {
  if (!isAnonymous) {
    return false;
  }

  if (authorUserId === viewer.viewerId) {
    return false;
  }

  if (
    viewer.viewerRole === GroupMemberRole.ADMIN ||
    viewer.viewerRole === GroupMemberRole.MODERATOR
  ) {
    return false;
  }

  return true;
}

// lấy thông tin người xem nhóm
export async function getGroupViewerContext(
  groupId: number,
  viewerId: number,
): Promise<GroupViewerContext> {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: viewerId },
    },
    select: {
      memberRole: true,
      status: true,
    },
  });

  const viewerRole =
    membership?.status === GroupMemberStatus.ACTIVE
      ? membership.memberRole
      : null;

  return { viewerId, viewerRole };
}

export async function getGroupMemberRole(
  groupId: number,
  viewerId: number,
): Promise<GroupMemberRole | null> {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: viewerId },
    },
    select: { memberRole: true },
  });
  return membership?.memberRole ?? null;
}

// ẩn danh tác giả
type UserLike = {
  id: number;
  fullName: string;
  email?: string | null;
  profile?: { avatarKey?: string | null; avatarUrl?: string | null } | null;
};

// ẩn danh tác giả
export function maskUserForGroupDisplay<T extends UserLike>(
  user: T,
  hideIdentity: boolean,
): T & { isAnonymous: boolean } {
  if (!hideIdentity) {
    return { ...user, isAnonymous: false };
  }

  return {
    ...user,
    id: 0,
    fullName: ANONYMOUS_MEMBER_NAME,
    email: "",
    profile: user.profile
      ? { ...user.profile, avatarKey: null, avatarUrl: null }
      : null,
    isAnonymous: true,
  };
}

// ẩn danh tác giả bài viết
export async function maskGroupPostAuthors<
  T extends { userId: number; isAnonymous?: boolean; user: UserLike },
>(groupId: number, viewerId: number, items: T[]): Promise<T[]> {
  if (items.length === 0) {
    return items;
  }

  const viewer = await getGroupViewerContext(groupId, viewerId);

  return Promise.all(
    items.map(async (item) => {
      const hide = shouldHideAnonymousAuthor(
        item.isAnonymous ?? false,
        item.userId,
        viewer,
      );
      const role = await getGroupMemberRole(groupId, item.userId);
      return {
        ...item,
        user: maskUserForGroupDisplay(item.user, hide),
        role,
      };
    }),
  );
}

// ẩn danh tác giả bình luận
export async function maskGroupCommentAuthors<
  T extends { userId: number; isAnonymous?: boolean; user: UserLike },
>(groupId: number, viewerId: number, items: T[]): Promise<T[]> {
  return maskGroupPostAuthors(groupId, viewerId, items);
}

// kiểm tra xem nhóm có cho phép đăng hoặc bình luận ẩn danh không
export async function assertGroupAllowsAnonymousContent(
  groupId: number,
  isAnonymous: boolean,
) {
  if (!isAnonymous) {
    return;
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { allowAnonymousJoin: true },
  });

  if (!group?.allowAnonymousJoin) {
    throw new Error("Nhóm này không cho phép đăng hoặc bình luận ẩn danh");
  }
}
