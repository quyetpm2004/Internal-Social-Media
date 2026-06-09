import {
  GroupMemberRole,
  GroupMemberStatus,
  GroupPermission,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import type { GroupSettingPayload } from "@/modules/group/group.types";

const ROLE_RANK: Record<GroupMemberRole, number> = {
  [GroupMemberRole.MEMBER]: 1,
  [GroupMemberRole.MODERATOR]: 2,
  [GroupMemberRole.ADMIN]: 3,
};

const getRoleRank = (role: GroupMemberRole) => ROLE_RANK[role] ?? 0;

export const assertCanManageTargetRole = (
  actorRole: GroupMemberRole,
  targetRole: GroupMemberRole,
) => {
  if (getRoleRank(actorRole) < getRoleRank(targetRole)) {
    throw new AppError(403, "Bạn không có quyền thao tác với thành viên này");
  }
};

export const countGroupAdmins = async (groupId: number) => {
  return prisma.groupMember.count({
    where: {
      groupId,
      memberRole: GroupMemberRole.ADMIN,
      status: GroupMemberStatus.ACTIVE,
    },
  });
};

export const assertNotLastAdmin = async (
  groupId: number,
  memberRole: GroupMemberRole,
) => {
  if (memberRole !== GroupMemberRole.ADMIN) return;

  const adminCount = await countGroupAdmins(groupId);
  if (adminCount <= 1) {
    throw new AppError(400, "Nhóm phải có ít nhất một quản trị viên");
  }
};

export const checkGroupExists = async (groupId: number) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new AppError(404, "Không tìm thấy nhóm");
  }

  return group;
};

export const findGroupMember = async (groupId: number, userId: number) => {
  return prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });
};

export const countActiveMembers = async (groupId: number) => {
  return prisma.groupMember.count({
    where: {
      groupId,
      status: GroupMemberStatus.ACTIVE,
    },
  });
};

export const checkIsGroupAdmin = async (groupId: number, userId: number) => {
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "Bạn không phải thành viên của nhóm");
  }

  if (member.memberRole !== GroupMemberRole.ADMIN) {
    throw new AppError(403, "Bạn không có quyền thực hiện hành động này");
  }

  return member;
};

export const checkCanManageMember = async (groupId: number, userId: number) => {
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "Bạn không phải thành viên của nhóm");
  }

  if (
    member.memberRole !== GroupMemberRole.ADMIN &&
    member.memberRole !== GroupMemberRole.MODERATOR
  ) {
    throw new AppError(403, "Bạn không có quyền quản lý thành viên");
  }

  return member;
};

export const checkCanApproveJoinRequest = async (
  groupId: number,
  userId: number,
) => {
  const group = await checkGroupExists(groupId);
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "Bạn không phải thành viên của nhóm");
  }

  if (group.joinApprovalPolicy === GroupPermission.ANY_MEMBER) {
    return member;
  }

  if (
    member.memberRole !== GroupMemberRole.ADMIN &&
    member.memberRole !== GroupMemberRole.MODERATOR
  ) {
    throw new AppError(403, "Bạn không có quyền phê duyệt yêu cầu tham gia");
  }

  return member;
};

export const checkIsGroupMember = async (groupId: number, userId: number) => {
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "Bạn phải là thành viên nhóm");
  }

  return member;
};

export const checkCanPostInGroup = async (groupId: number, userId: number) => {
  const group = await checkGroupExists(groupId);
  const member = await checkIsGroupMember(groupId, userId);

  if (group.postPermission === GroupPermission.ANY_MEMBER) {
    return { group, member };
  }

  if (member.memberRole !== GroupMemberRole.ADMIN) {
    throw new AppError(
      400,
      "Chỉ quản trị viên mới có thể đăng bài trong nhóm này",
    );
  }

  return { group, member };
};

export const mapGroupToSettings = (group: {
  groupName: string;
  description: string | null;
  isHidden: boolean;
  joinApprovalPolicy: GroupPermission;
  allowAnonymousJoin: boolean;
  postPermission: GroupPermission;
  postApprovalRequired: boolean;
}): GroupSettingPayload => ({
  groupName: group.groupName,
  description: group.description,
  isHidden: group.isHidden,
  joinApprovalPolicy: group.joinApprovalPolicy,
  allowAnonymousJoin: group.allowAnonymousJoin,
  postPermission: group.postPermission,
  postApprovalRequired: group.postApprovalRequired,
});
