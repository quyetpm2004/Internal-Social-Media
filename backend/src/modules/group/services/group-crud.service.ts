import {
  GroupMemberRole,
  GroupMemberStatus,
  GroupPermission,
  GroupStatus,
  GroupType,
  PostStatus,
  PostVisibility,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import { getFileUrl } from "@/modules/file/file.service";
import {
  checkGroupExists,
  checkIsGroupAdmin,
  countActiveMembers,
  findGroupMember,
} from "@/modules/group/services/group-access.service";

export const createGroup = async (userId: number, data: any) => {
  const { groupName, description, groupType, departmentId } = data;

  if (!groupName) {
    throw new AppError(400, "Tên nhóm không được để trống");
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: Number(departmentId) },
    });

    if (!department) {
      throw new AppError(404, "Phòng ban không tồn tại");
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

  const totalGroups = await prisma.group.count({
    where: whereCondition,
  });

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
    throw new AppError(404, "Không tìm thấy nhóm");
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
    (currentMembership!.memberRole === GroupMemberRole.ADMIN ||
      currentMembership!.memberRole === GroupMemberRole.MODERATOR);
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
