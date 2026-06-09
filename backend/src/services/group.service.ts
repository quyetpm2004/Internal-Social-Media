import prisma from "@/shared/utils/prisma";
import {
  AttachmentType,
  GroupMemberRole,
  GroupMemberStatus,
  GroupPermission,
  GroupStatus,
  GroupType,
  MediaStatus,
  PostStatus,
  PostVisibility,
} from "@prisma/client";
import { getFileUrl } from "@/modules/file/file.service";
import {
  assertGroupAllowsAnonymousContent,
  getGroupViewerContext,
  maskGroupPostAuthors,
  maskUserForGroupDisplay,
  shouldHideAnonymousAuthor,
} from "@/shared/utils/group-anonymous";
import {
  notifyGroupMemberAdded,
  notifyGroupMemberKicked,
  notifyGroupMemberRejected,
  notifyGroupMemberRoleChanged,
  notifyGroupMemberStatusChanged,
  notifyPostApproved,
  notifyPostRejected,
} from "@/services/notification.service";

const ROLE_RANK: Record<GroupMemberRole, number> = {
  [GroupMemberRole.MEMBER]: 1,
  [GroupMemberRole.MODERATOR]: 2,
  [GroupMemberRole.ADMIN]: 3,
};

const getRoleRank = (role: GroupMemberRole) => ROLE_RANK[role] ?? 0;

const assertCanManageTargetRole = (
  actorRole: GroupMemberRole,
  targetRole: GroupMemberRole,
) => {
  if (getRoleRank(actorRole) < getRoleRank(targetRole)) {
    throw new Error("Bạn không có quyền thao tác với thành viên này");
  }
};

const countGroupAdmins = async (groupId: number) => {
  return prisma.groupMember.count({
    where: {
      groupId,
      memberRole: GroupMemberRole.ADMIN,
      status: GroupMemberStatus.ACTIVE,
    },
  });
};

const assertNotLastAdmin = async (
  groupId: number,
  memberRole: GroupMemberRole,
) => {
  if (memberRole !== GroupMemberRole.ADMIN) return;

  const adminCount = await countGroupAdmins(groupId);
  if (adminCount <= 1) {
    throw new Error("Nhóm phải có ít nhất một quản trị viên");
  }
};

const checkGroupExists = async (groupId: number) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error("Không tìm thấy nhóm");
  }

  return group;
};

const findGroupMember = async (groupId: number, userId: number) => {
  return prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });
};

const countActiveMembers = async (groupId: number) => {
  return prisma.groupMember.count({
    where: {
      groupId,
      status: GroupMemberStatus.ACTIVE,
    },
  });
};

const checkIsGroupAdmin = async (groupId: number, userId: number) => {
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new Error("Bạn không phải thành viên của nhóm");
  }

  if (member.memberRole !== GroupMemberRole.ADMIN) {
    throw new Error("Bạn không có quyền thực hiện hành động này");
  }

  return member;
};

const checkCanManageMember = async (groupId: number, userId: number) => {
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new Error("Bạn không phải thành viên của nhóm");
  }

  if (
    member.memberRole !== GroupMemberRole.ADMIN &&
    member.memberRole !== GroupMemberRole.MODERATOR
  ) {
    throw new Error("Bạn không có quyền quản lý thành viên");
  }

  return member;
};

const checkCanApproveJoinRequest = async (groupId: number, userId: number) => {
  const group = await checkGroupExists(groupId);
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new Error("Bạn không phải thành viên của nhóm");
  }

  if (group.joinApprovalPolicy === GroupPermission.ANY_MEMBER) {
    return member;
  }

  if (
    member.memberRole !== GroupMemberRole.ADMIN &&
    member.memberRole !== GroupMemberRole.MODERATOR
  ) {
    throw new Error("Bạn không có quyền phê duyệt yêu cầu tham gia");
  }

  return member;
};

const checkCanPostInGroup = async (groupId: number, userId: number) => {
  const group = await checkGroupExists(groupId);
  const member = await checkIsGroupMember(groupId, userId);

  if (group.postPermission === GroupPermission.ANY_MEMBER) {
    return { group, member };
  }

  if (member.memberRole !== GroupMemberRole.ADMIN) {
    throw new Error("Chỉ quản trị viên mới có thể đăng bài trong nhóm này");
  }

  return { group, member };
};

export type GroupSettingPayload = {
  groupName: string;
  description: string | null;
  isHidden: boolean;
  joinApprovalPolicy: GroupPermission;
  allowAnonymousJoin: boolean;
  postPermission: GroupPermission;
  postApprovalRequired: boolean;
};

const mapGroupToSettings = (group: {
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

const checkIsGroupMember = async (groupId: number, userId: number) => {
  const member = await findGroupMember(groupId, userId);

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new Error("Bạn phải là thành viên nhóm");
  }

  return member;
};

export const createGroup = async (userId: number, data: any) => {
  const { groupName, description, groupType, departmentId } = data;

  if (!groupName) {
    throw new Error("Tên nhóm không được để trống");
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: Number(departmentId) },
    });

    if (!department) {
      throw new Error("Phòng ban không tồn tại");
    }
  }

  const group = await prisma.group.create({
    data: {
      groupName,
      description,
      groupType: groupType || GroupType.PUBLIC,
      departmentId: departmentId ? Number(departmentId) : null,
      createdBy: userId,
      members: {
        create: {
          userId,
          memberRole: GroupMemberRole.ADMIN,
          status: GroupMemberStatus.ACTIVE,
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      department: true,
      members: true,
    },
  });

  return group;
};

export const getGroups = async (query: any, userId: number) => {
  const {
    search = "",
    groupType,
    scope,
    departmentId,
    page = 1,
    limit = 6,
  } = query;

  const isMyGroups = scope === "my";
  const currentPage = Math.max(Number(page), 1);
  const take = Math.max(Number(limit), 1);
  const skip = (currentPage - 1) * take;

  const andConditions: any[] = [];

  if (!isMyGroups) {
    andConditions.push({
      OR: [
        { isHidden: false },
        {
          members: {
            some: {
              userId,
              status: GroupMemberStatus.ACTIVE,
            },
          },
        },
      ],
    });
  }

  if (isMyGroups) {
    andConditions.push({
      members: {
        some: {
          userId,
          status: GroupMemberStatus.ACTIVE,
        },
      },
    });
  }

  if (search) {
    andConditions.push({
      OR: [
        { groupName: { contains: String(search) } },
        { description: { contains: String(search) } },
      ],
    });
  }

  const whereCondition: any = {
    status: GroupStatus.ACTIVE,
    ...(andConditions.length > 0 && { AND: andConditions }),
    ...(groupType && { groupType: groupType as GroupType }),
    ...(departmentId && { departmentId: Number(departmentId) }),
  };

  // lấy total để pagination
  const totalGroups = await prisma.group.count({
    where: whereCondition,
  });

  // lấy groups theo page
  const groups = await prisma.group.findMany({
    where: whereCondition,
    skip,
    take,
    include: {
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      department: true,
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  // xử lý membership + signed url
  const groupWithMembership = await Promise.all(
    groups.map(async (group) => {
      const membership = await findGroupMember(group.id, userId);
      const activeMemberCount = await countActiveMembers(group.id);

      const coverUrl = group.coverKey
        ? await getFileUrl(group.coverKey, 24 * 60 * 60)
        : null;

      return {
        ...group,
        isMember: membership?.status === GroupMemberStatus.ACTIVE,
        membershipStatus: membership?.status ?? null,
        _count: {
          ...group._count,
          members: activeMemberCount,
        },
        coverUrl,
      };
    }),
  );

  return {
    groups: groupWithMembership,

    pagination: {
      total: totalGroups,
      page: currentPage,
      limit: take,
      totalPages: Math.ceil(totalGroups / take),
      hasNextPage: currentPage < Math.ceil(totalGroups / take),
      hasPrevPage: currentPage > 1,
    },
  };
};

export const getGroupById = async (groupId: number, userId: number) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      department: true,
      members: {
        include: {
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
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error("Không tìm thấy nhóm");
  }

  const coverUrl = group.coverKey
    ? await getFileUrl(group.coverKey, 24 * 60 * 60)
    : null;

  const currentMembership = await findGroupMember(groupId, userId);
  const isMember = currentMembership?.status === GroupMemberStatus.ACTIVE;
  const membershipStatus = currentMembership?.status ?? null;

  const activeMemberCount = await countActiveMembers(groupId);

  let pendingRequestCount = 0;
  const isActiveMember = currentMembership?.status === GroupMemberStatus.ACTIVE;
  const canManage =
    isActiveMember &&
    (currentMembership.memberRole === GroupMemberRole.ADMIN ||
      currentMembership.memberRole === GroupMemberRole.MODERATOR);
  const canApproveJoin =
    isActiveMember &&
    group.groupType === GroupType.PRIVATE &&
    (group.joinApprovalPolicy === GroupPermission.ANY_MEMBER || canManage);

  if (canApproveJoin) {
    pendingRequestCount = await prisma.groupMember.count({
      where: {
        groupId,
        status: GroupMemberStatus.PENDING,
      },
    });
  }

  let pendingPostCount = 0;
  if (canManage && group.postApprovalRequired) {
    pendingPostCount = await prisma.post.count({
      where: {
        groupId,
        status: PostStatus.PENDING_REVIEW,
        visibility: PostVisibility.GROUP,
      },
    });
  }

  const activeMembers = await Promise.all(
    group.members
      .filter((m) => m.status === GroupMemberStatus.ACTIVE)
      .map(async (member) => ({
        id: member.id,
        memberRole: member.memberRole,
        joinedAt: member.joinedAt,
        status: member.status,
        user: {
          ...member.user,
          avatarUrl: member.user.profile?.avatarKey
            ? await getFileUrl(member.user.profile.avatarKey, 24 * 60 * 60)
            : null,
        },
      })),
  );

  return {
    ...group,
    members: activeMembers,
    _count: {
      ...group._count,
      members: activeMemberCount,
    },
    coverUrl,
    isMember,
    membershipStatus,
    pendingRequestCount,
    pendingPostCount,
  };
};

export const updateGroup = async (
  groupId: number,
  currentUserId: number,
  data: any,
) => {
  await checkGroupExists(groupId);
  await checkIsGroupAdmin(groupId, currentUserId);

  const { groupName, description } = data;

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(groupName !== undefined && { groupName }),
      ...(description !== undefined && { description }),
    },
    include: {
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      department: true,
    },
  });

  return group;
};

export const deleteGroup = async (groupId: number, currentUserId: number) => {
  await checkGroupExists(groupId);
  await checkIsGroupAdmin(groupId, currentUserId);

  await prisma.group.update({
    where: { id: groupId },
    data: {
      status: GroupStatus.ARCHIVED,
    },
  });

  return true;
};

export const addMemberToGroup = async (
  groupId: number,
  currentUserId: number,
  data: any,
) => {
  const { userId, email, memberRole } = data;

  if (!userId && !email) {
    throw new Error("Vui lòng nhập email thành viên");
  }

  await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: Number(userId) },
      })
    : await prisma.user.findUnique({
        where: { email: String(email).trim() },
      });

  if (!user) {
    throw new Error("Không tìm thấy người dùng với email này");
  }

  const targetUserId = user.id;

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: targetUserId,
      },
    },
  });

  if (existingMember) {
    if (existingMember.status === GroupMemberStatus.PENDING) {
      const member = await prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId,
            userId: targetUserId,
          },
        },
        data: {
          status: GroupMemberStatus.ACTIVE,
          memberRole: memberRole || GroupMemberRole.MEMBER,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
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
    throw new Error("User đã là thành viên của nhóm");
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
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
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
              {
                fullName: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                },
              },
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
            profile: {
              select: {
                avatarKey: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.groupMember.count({
      where,
    }),
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
    throw new Error("Bạn không thể tự xóa mình khỏi nhóm tại đây");
  }

  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new Error("User không phải thành viên của nhóm");
  }

  assertCanManageTargetRole(actor.memberRole, member.memberRole);
  await assertNotLastAdmin(groupId, member.memberRole);

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  await notifyGroupMemberKicked(groupId, currentUserId, userId);
  console.log("Kicked member group service", userId);
  return true;
};

export const updateMemberRole = async (
  groupId: number,
  userId: number,
  currentUserId: number,
  memberRole: GroupMemberRole,
) => {
  if (!memberRole) {
    throw new Error("memberRole không được để trống");
  }

  if (!Object.values(GroupMemberRole).includes(memberRole)) {
    throw new Error("Vai trò không hợp lệ");
  }

  await checkGroupExists(groupId);
  const actor = await checkCanManageMember(groupId, currentUserId);

  if (userId === currentUserId) {
    throw new Error("Bạn không thể tự thay đổi quyền của mình");
  }

  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member || member.status !== GroupMemberStatus.ACTIVE) {
    throw new Error("User không phải thành viên của nhóm");
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
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    data: {
      memberRole,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
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
    throw new Error("Nhóm không hoạt động");
  }

  const existingMember = await findGroupMember(groupId, userId);

  if (existingMember?.status === GroupMemberStatus.ACTIVE) {
    throw new Error("Bạn đã là thành viên của nhóm");
  }

  if (existingMember?.status === GroupMemberStatus.PENDING) {
    throw new Error("Bạn đã gửi yêu cầu tham gia nhóm này");
  }

  if (existingMember?.status === GroupMemberStatus.BLOCKED) {
    throw new Error("Bạn không thể tham gia nhóm này");
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
        select: {
          id: true,
          fullName: true,
          email: true,
        },
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
    throw new Error("Bạn chưa tham gia nhóm này");
  }

  if (member.status === GroupMemberStatus.PENDING) {
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
    return { action: "cancelled_request" as const };
  }

  if (member.status !== GroupMemberStatus.ACTIVE) {
    throw new Error("Bạn không thể rời nhóm ở trạng thái hiện tại");
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
      throw new Error("Admin cuối cùng không thể rời nhóm");
    }
  }

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  return { action: "left" as const };
};

export const getJoinRequests = async (
  groupId: number,
  currentUserId: number,
  page: number = 1,
  limit: number = 10,
) => {
  const group = await checkGroupExists(groupId);

  if (group.groupType !== GroupType.PRIVATE) {
    throw new Error("Chỉ nhóm riêng tư mới có yêu cầu tham gia");
  }

  await checkCanApproveJoinRequest(groupId, currentUserId);

  const where = {
    groupId,
    status: GroupMemberStatus.PENDING,
  };

  const [requests, total] = await Promise.all([
    prisma.groupMember.findMany({
      where,
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
      },
      orderBy: {
        joinedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.groupMember.count({ where }),
  ]);

  return {
    requests: await Promise.all(
      requests.map(async (request) => ({
        id: request.user.id,
        fullName: request.user.fullName,
        email: request.user.email,
        requestedAt: request.joinedAt,
        avatarUrl: request.user.profile?.avatarKey
          ? await getFileUrl(request.user.profile.avatarKey, 24 * 60 * 60)
          : null,
      })),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const approveJoinRequest = async (
  groupId: number,
  targetUserId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanApproveJoinRequest(groupId, currentUserId);

  if (group.groupType !== GroupType.PRIVATE) {
    throw new Error("Chỉ nhóm riêng tư mới có yêu cầu tham gia");
  }

  const member = await findGroupMember(groupId, targetUserId);

  if (!member || member.status !== GroupMemberStatus.PENDING) {
    throw new Error("Không tìm thấy yêu cầu tham gia");
  }

  const updated = await prisma.groupMember.update({
    where: {
      groupId_userId: {
        groupId,
        userId: targetUserId,
      },
    },
    data: {
      status: GroupMemberStatus.ACTIVE,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
  await notifyGroupMemberAdded(groupId, currentUserId, targetUserId);

  return updated;
};

export const rejectJoinRequest = async (
  groupId: number,
  targetUserId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanApproveJoinRequest(groupId, currentUserId);

  if (group.groupType !== GroupType.PRIVATE) {
    throw new Error("Chỉ nhóm riêng tư mới có yêu cầu tham gia");
  }

  const member = await findGroupMember(groupId, targetUserId);

  if (!member || member.status !== GroupMemberStatus.PENDING) {
    throw new Error("Không tìm thấy yêu cầu tham gia");
  }

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: targetUserId,
      },
    },
  });
  await notifyGroupMemberRejected(groupId, currentUserId, targetUserId);

  return true;
};

export const createGroupPost = async (
  groupId: number,
  userId: number,
  data: any,
) => {
  const { content, isAnonymous: wantsAnonymous } = data;

  if (!content) {
    throw new Error("Nội dung bài viết không được để trống");
  }

  const { group } = await checkCanPostInGroup(groupId, userId);

  if (group.status !== GroupStatus.ACTIVE) {
    throw new Error("Nhóm không hoạt động");
  }

  const isAnonymous = wantsAnonymous === true;
  await assertGroupAllowsAnonymousContent(groupId, isAnonymous);

  const postStatus = group.postApprovalRequired
    ? PostStatus.PENDING_REVIEW
    : PostStatus.ACTIVE;

  const post = await prisma.post.create({
    data: {
      userId,
      groupId,
      content,
      visibility: PostVisibility.GROUP,
      status: postStatus,
      isAnonymous,
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
      group: true,
      attachments: true,
      reactions: true,
      comments: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });

  return post;
};

export const getGroupPosts = async (groupId: number) => {
  await checkGroupExists(groupId);

  const posts = await prisma.post.findMany({
    where: {
      groupId,
      visibility: PostVisibility.GROUP,
      status: PostStatus.ACTIVE,
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
      comments: {
        where: {
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: {
                select: {
                  avatarKey: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      reactions: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
    orderBy: [
      {
        isPinned: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  return posts;
};

export const getGroupPostDetail = async (
  groupId: number,
  postId: number,
  userId: number,
) => {
  const existingGroup = await checkGroupExists(groupId);
  if (existingGroup.status !== GroupStatus.ACTIVE) {
    throw new Error("Nhóm không hoạt động");
  }
  const membership = await findGroupMember(groupId, userId);
  const isActiveMember = membership?.status === GroupMemberStatus.ACTIVE;

  if (existingGroup.groupType === GroupType.PRIVATE && !isActiveMember) {
    throw new Error("Nhóm riêng tư không thể xem chi tiết bài viết");
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
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
      group: {
        select: {
          id: true,
          groupName: true,
        },
      },
      reactions: {
        where: {
          userId: userId,
        },
        select: {
          reactionType: true,
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
  if (!existingPost) {
    throw new Error("Post không tồn tại");
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

  const [maskedPost] = await maskGroupPostAuthors(groupId, userId, [
    { ...existingPost, userId: existingPost.userId },
  ]);

  return {
    ...maskedPost,
    attachments: attachmentsWithUrl,
  };
};

export const getGroupSetting = async (groupId: number, userId: number) => {
  await checkIsGroupAdmin(groupId, userId);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      groupName: true,
      description: true,
      isHidden: true,
      joinApprovalPolicy: true,
      allowAnonymousJoin: true,
      postPermission: true,
      postApprovalRequired: true,
    },
  });

  if (!group) {
    throw new Error("Không tìm thấy nhóm");
  }

  return mapGroupToSettings(group);
};

export type UpdateGroupSettingInput = Partial<{
  groupName: string;
  description: string | null;
  isHidden: boolean;
  joinApprovalPolicy: GroupPermission;
  allowAnonymousJoin: boolean;
  postPermission: GroupPermission;
  postApprovalRequired: boolean;
}>;

export const updateGroupSetting = async (
  groupId: number,
  userId: number,
  data: UpdateGroupSettingInput,
) => {
  await checkIsGroupAdmin(groupId, userId);

  const {
    groupName,
    description,
    isHidden,
    joinApprovalPolicy,
    allowAnonymousJoin,
    postPermission,
    postApprovalRequired,
  } = data;

  if (groupName !== undefined && !groupName.trim()) {
    throw new Error("Tên nhóm không được để trống");
  }

  if (
    joinApprovalPolicy !== undefined &&
    !Object.values(GroupPermission).includes(joinApprovalPolicy)
  ) {
    throw new Error("Chính sách phê duyệt không hợp lệ");
  }

  if (
    postPermission !== undefined &&
    !Object.values(GroupPermission).includes(postPermission)
  ) {
    throw new Error("Quyền đăng bài không hợp lệ");
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(groupName !== undefined && { groupName: groupName.trim() }),
      ...(description !== undefined && { description }),
      ...(isHidden !== undefined && { isHidden }),
      ...(joinApprovalPolicy !== undefined && { joinApprovalPolicy }),
      ...(allowAnonymousJoin !== undefined && { allowAnonymousJoin }),
      ...(postPermission !== undefined && { postPermission }),
      ...(postApprovalRequired !== undefined && { postApprovalRequired }),
    },
    select: {
      groupName: true,
      description: true,
      isHidden: true,
      joinApprovalPolicy: true,
      allowAnonymousJoin: true,
      postPermission: true,
      postApprovalRequired: true,
    },
  });

  return mapGroupToSettings(group);
};

type GroupAttachmentCategory = "media" | "file";

const GROUP_ATTACHMENT_TYPES: Record<
  GroupAttachmentCategory,
  AttachmentType[]
> = {
  media: [AttachmentType.IMAGE, AttachmentType.VIDEO],
  file: [AttachmentType.FILE],
};

export const getGroupAttachments = async (
  groupId: number,
  userId: number,
  category: GroupAttachmentCategory,
  page: number = 1,
  limit: number = 20,
  search?: string,
) => {
  const group = await checkGroupExists(groupId);

  if (group.groupType === GroupType.PRIVATE) {
    await checkIsGroupMember(groupId, userId);
  }

  const where = {
    status: MediaStatus.ACTIVE,
    attachmentType: { in: GROUP_ATTACHMENT_TYPES[category] },
    post: {
      groupId,
      status: PostStatus.ACTIVE,
      visibility: PostVisibility.GROUP,
    },
    ...(search
      ? {
          fileName: {
            contains: search,
          },
        }
      : {}),
  };

  const [attachments, total] = await Promise.all([
    prisma.postAttachment.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            isAnonymous: true,
            userId: true,
            user: {
              select: {
                id: true,
                fullName: true,
                profile: {
                  select: {
                    avatarKey: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.postAttachment.count({ where }),
  ]);

  const viewer = await getGroupViewerContext(groupId, userId);

  const items = await Promise.all(
    attachments.map(async (attachment) => {
      const fileUrl = await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60);

      if (!attachment.post) {
        return {
          id: attachment.id,
          fileName: attachment.fileName,
          fileUrl,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          attachmentType: attachment.attachmentType,
          uploadedAt: attachment.uploadedAt,
          post: null,
        };
      }

      const authorId = attachment.post.userId;
      const hideIdentity = shouldHideAnonymousAuthor(
        attachment.post.isAnonymous,
        authorId,
        viewer,
      );
      const avatarUrl =
        !hideIdentity && attachment.post.user.profile?.avatarKey
          ? await getFileUrl(
              attachment.post.user.profile.avatarKey,
              24 * 60 * 60,
            )
          : null;
      const displayAuthor = maskUserForGroupDisplay(
        {
          id: authorId,
          fullName: attachment.post.user.fullName,
        },
        hideIdentity,
      );

      return {
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        attachmentType: attachment.attachmentType,
        uploadedAt: attachment.uploadedAt,
        post: {
          id: attachment.post.id,
          content: attachment.post.content,
          createdAt: attachment.post.createdAt,
          author: {
            id: displayAuthor.id,
            fullName: displayAuthor.fullName,
            avatarUrl,
            isAnonymous: displayAuthor.isAnonymous,
          },
        },
      };
    }),
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const mapPendingPostForReview = async (post: {
  id: number;
  content: string;
  createdAt: Date;
  user: {
    id: number;
    fullName: string;
    email: string;
    profile: { avatarKey: string | null } | null;
  };
  _count: { attachments: number };
}) => ({
  id: post.id,
  content: post.content,
  createdAt: post.createdAt,
  attachmentCount: post._count.attachments,
  author: {
    id: post.user.id,
    fullName: post.user.fullName,
    email: post.user.email,
    avatarUrl: post.user.profile?.avatarKey
      ? await getFileUrl(post.user.profile.avatarKey, 24 * 60 * 60)
      : null,
  },
});

export const getPendingGroupPosts = async (
  groupId: number,
  currentUserId: number,
  page: number = 1,
  limit: number = 10,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  if (!group.postApprovalRequired) {
    throw new Error("Nhóm này không bật phê duyệt bài viết");
  }

  const where = {
    groupId,
    status: PostStatus.PENDING_REVIEW,
    visibility: PostVisibility.GROUP,
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
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
        _count: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: await Promise.all(posts.map(mapPendingPostForReview)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const approveGroupPost = async (
  groupId: number,
  postId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  if (!group.postApprovalRequired) {
    throw new Error("Nhóm này không bật phê duyệt bài viết");
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      groupId,
      status: PostStatus.PENDING_REVIEW,
      visibility: PostVisibility.GROUP,
    },
  });

  if (!post) {
    throw new Error("Không tìm thấy bài viết chờ duyệt");
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.ACTIVE },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  await notifyPostApproved(postId, groupId, currentUserId);

  return updated;
};

export const rejectGroupPost = async (
  groupId: number,
  postId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  if (!group.postApprovalRequired) {
    throw new Error("Nhóm này không bật phê duyệt bài viết");
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      groupId,
      status: PostStatus.PENDING_REVIEW,
      visibility: PostVisibility.GROUP,
    },
  });

  if (!post) {
    throw new Error("Không tìm thấy bài viết chờ duyệt");
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.DELETED },
  });

  await notifyPostRejected(postId, groupId, currentUserId);

  return updated;
};
