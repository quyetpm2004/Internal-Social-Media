import {
  GroupMemberRole,
  GroupMemberStatus,
  GroupStatus,
  GroupType,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";
import {
  notifyGroupMemberAdded,
  notifyGroupMemberKicked,
  notifyGroupMemberRoleChanged,
  notifyGroupMemberStatusChanged,
} from "@/modules/notification/notification.service";
import {
  assertCanManageTargetRole,
  assertNotLastAdmin,
  checkCanManageMember,
  checkGroupExists,
  checkIsGroupMember,
  findGroupMember,
} from "@/modules/group/services/group-access.service";

export const addMemberToGroup = async (
  groupId: number,
  currentUserId: number,
  data: any,
) => {
  const { userId, email, memberRole } = data;

  if (!userId && !email) {
    throw new AppError(400, "Vui lòng nhập email thành viên");
  }

  await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  const user = userId
    ? await prisma.user.findUnique({ where: { id: Number(userId) } })
    : await prisma.user.findUnique({
        where: { email: String(email).trim() },
      });

  if (!user) {
    throw new AppError(404, "Không tìm thấy người dùng với email này");
  }

  const targetUserId = user.id;

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: targetUserId },
    },
  });

  if (existingMember) {
    if (existingMember.status === GroupMemberStatus.PENDING) {
      const member = await prisma.groupMember.update({
        where: {
          groupId_userId: { groupId, userId: targetUserId },
        },
        data: {
          status: GroupMemberStatus.ACTIVE,
          memberRole: memberRole || GroupMemberRole.MEMBER,
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      });
      await notifyGroupMemberStatusChanged(
        groupId,
        currentUserId,
        targetUserId,
        GroupMemberStatus.ACTIVE,
      );
      return member;
    }
    throw new AppError(400, "User đã là thành viên của nhóm");
  }

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      userId: targetUserId,
      memberRole: memberRole || GroupMemberRole.MEMBER,
      status: GroupMemberStatus.ACTIVE,
    },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  });

  await notifyGroupMemberAdded(groupId, currentUserId, targetUserId);
  return member;
};

export const getGroupMembers = async (
  groupId: number,
  userId: number,
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
) => {
  const group = await checkGroupExists(groupId);

  if (group.groupType === GroupType.PRIVATE) {
    await checkIsGroupMember(groupId, userId);
  }

  const roleFilter =
    role === "STAFF"
      ? {
          memberRole: {
            in: [GroupMemberRole.ADMIN, GroupMemberRole.MODERATOR],
          },
        }
      : role === "MEMBER"
        ? { memberRole: GroupMemberRole.MEMBER }
        : role
          ? { memberRole: role as GroupMemberRole }
          : null;

  const where = {
    groupId,
    status: GroupMemberStatus.ACTIVE,
    ...(roleFilter ? roleFilter : {}),
    ...(search
      ? {
          user: {
            OR: [
              { fullName: { contains: search } },
              { email: { contains: search } },
            ],
          },
        }
      : {}),
  };

  const [members, total] = await Promise.all([
    prisma.groupMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profile: { select: { avatarKey: true } },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.groupMember.count({ where }),
  ]);

  return {
    members: await Promise.all(
      members.map(async (member) => ({
        id: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
        memberRole: member.memberRole,
        joinedAt: member.joinedAt,
        status: member.status,
        avatarUrl: member.user.profile?.avatarKey
          ? await getFileUrl(member.user.profile.avatarKey, 24 * 60 * 60)
          : null,
      })),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const removeMemberFromGroup = async (
  groupId: number,
  userId: number,
  currentUserId: number,
) => {
  await checkGroupExists(groupId);
  const actor = await checkCanManageMember(groupId, currentUserId);

  if (userId === currentUserId) {
    throw new AppError(400, "Bạn không thể tự xóa mình khỏi nhóm tại đây");
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "User không phải thành viên của nhóm");
  }

  assertCanManageTargetRole(actor.memberRole, member.memberRole);
  await assertNotLastAdmin(groupId, member.memberRole);

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  await notifyGroupMemberKicked(groupId, currentUserId, userId);
  return true;
};

export const updateMemberRole = async (
  groupId: number,
  userId: number,
  currentUserId: number,
  memberRole: GroupMemberRole,
) => {
  if (!memberRole) {
    throw new AppError(400, "memberRole không được để trống");
  }

  if (!Object.values(GroupMemberRole).includes(memberRole)) {
    throw new AppError(400, "Vai trò không hợp lệ");
  }

  await checkGroupExists(groupId);
  const actor = await checkCanManageMember(groupId, currentUserId);

  if (userId === currentUserId) {
    throw new AppError(400, "Bạn không thể tự thay đổi quyền của mình");
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "User không phải thành viên của nhóm");
  }

  assertCanManageTargetRole(actor.memberRole, member.memberRole);
  assertCanManageTargetRole(actor.memberRole, memberRole);

  if (
    member.memberRole === GroupMemberRole.ADMIN &&
    memberRole !== GroupMemberRole.ADMIN
  ) {
    await assertNotLastAdmin(groupId, GroupMemberRole.ADMIN);
  }

  const updatedMember = await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { memberRole },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await notifyGroupMemberRoleChanged(
    groupId,
    currentUserId,
    userId,
    memberRole,
  );

  return updatedMember;
};

export const joinGroup = async (groupId: number, userId: number) => {
  const group = await checkGroupExists(groupId);

  if (group.status !== GroupStatus.ACTIVE) {
    throw new AppError(400, "Nhóm không hoạt động");
  }

  const existingMember = await findGroupMember(groupId, userId);

  if (existingMember?.status === GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "Bạn đã là thành viên của nhóm");
  }

  if (existingMember?.status === GroupMemberStatus.PENDING) {
    throw new AppError(400, "Bạn đã gửi yêu cầu tham gia nhóm này");
  }

  if (existingMember?.status === GroupMemberStatus.BLOCKED) {
    throw new AppError(400, "Bạn không thể tham gia nhóm này");
  }

  const isPrivate = group.groupType === GroupType.PRIVATE;

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      userId,
      memberRole: GroupMemberRole.MEMBER,
      status: isPrivate ? GroupMemberStatus.PENDING : GroupMemberStatus.ACTIVE,
    },
    include: {
      group: true,
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  return {
    member,
    action: isPrivate ? ("requested" as const) : ("joined" as const),
  };
};

export const leaveGroup = async (groupId: number, userId: number) => {
  await checkGroupExists(groupId);

  const member = await findGroupMember(groupId, userId);

  if (!member) {
    throw new AppError(400, "Bạn chưa tham gia nhóm này");
  }

  if (member.status === GroupMemberStatus.PENDING) {
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
    return { action: "cancelled_request" as const };
  }

  if (member.status !== GroupMemberStatus.ACTIVE) {
    throw new AppError(400, "Bạn không thể rời nhóm ở trạng thái hiện tại");
  }

  if (member.memberRole === GroupMemberRole.ADMIN) {
    const adminCount = await prisma.groupMember.count({
      where: {
        groupId,
        memberRole: GroupMemberRole.ADMIN,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (adminCount <= 1) {
      throw new AppError(400, "Admin cuối cùng không thể rời nhóm");
    }
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  return { action: "left" as const };
};
