import prisma from "../utils/prisma";
import {
  GroupMemberRole,
  GroupStatus,
  GroupType,
  PostStatus,
  PostVisibility,
} from "@prisma/client";
import { getFileUrl } from "./file.service";

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
    where: { groupId, memberRole: GroupMemberRole.ADMIN },
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

const checkIsGroupAdmin = async (groupId: number, userId: number) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member) {
    throw new Error("Bạn không phải thành viên của nhóm");
  }

  if (member.memberRole !== GroupMemberRole.ADMIN) {
    throw new Error("Bạn không có quyền thực hiện hành động này");
  }

  return member;
};

const checkCanManageMember = async (groupId: number, userId: number) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member) {
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

const checkIsGroupMember = async (groupId: number, userId: number) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member) {
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
  const { search = "", groupType, departmentId, page = 1, limit = 6 } = query;

  const currentPage = Math.max(Number(page), 1);
  const take = Math.max(Number(limit), 1);
  const skip = (currentPage - 1) * take;

  // where condition
  const whereCondition: any = {
    status: GroupStatus.ACTIVE,

    ...(search && {
      OR: [
        {
          groupName: {
            contains: String(search),
          },
        },
        {
          description: {
            contains: String(search),
          },
        },
      ],
    }),

    ...(groupType && {
      groupType: groupType as GroupType,
    }),

    ...(departmentId && {
      departmentId: Number(departmentId),
    }),
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
      const isMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId,
          },
        },
      });

      const avatarUrl = group.avatarKey
        ? await getFileUrl(group.avatarKey, 24 * 60 * 60)
        : null;

      const coverUrl = group.coverKey
        ? await getFileUrl(group.coverKey, 24 * 60 * 60)
        : null;

      return {
        ...group,
        isMember: !!isMember,
        avatarUrl,
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

  const avatarUrl = group?.avatarKey
    ? await getFileUrl(group.avatarKey, 24 * 60 * 60)
    : null;
  const coverUrl = group?.coverKey
    ? await getFileUrl(group.coverKey, 24 * 60 * 60)
    : null;

  const isMember = await checkIsGroupMember(groupId, userId)
    .then(() => true)
    .catch(() => false);

  if (!group) {
    throw new Error("Không tìm thấy nhóm");
  }

  return { ...group, avatarUrl, coverUrl, isMember };
};

export const updateGroup = async (
  groupId: number,
  currentUserId: number,
  data: any,
) => {
  await checkGroupExists(groupId);
  await checkIsGroupAdmin(groupId, currentUserId);

  const { groupName, description, groupType, departmentId, status } = data;

  if (departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: Number(departmentId) },
    });

    if (!department) {
      throw new Error("Phòng ban không tồn tại");
    }
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(groupName !== undefined && { groupName }),
      ...(description !== undefined && { description }),
      ...(groupType !== undefined && { groupType }),
      ...(departmentId !== undefined && {
        departmentId: departmentId ? Number(departmentId) : null,
      }),
      ...(status !== undefined && { status }),
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
    throw new Error("User đã là thành viên của nhóm");
  }

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      userId: targetUserId,
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

  return member;
};

// service
export const getGroupMembers = async (
  groupId: number,
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
) => {
  await checkGroupExists(groupId);

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

  if (!member) {
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

  if (!member) {
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

  return updatedMember;
};

export const joinGroup = async (groupId: number, userId: number) => {
  const group = await checkGroupExists(groupId);

  if (group.status !== GroupStatus.ACTIVE) {
    throw new Error("Nhóm không hoạt động");
  }

  if (group.groupType === GroupType.PRIVATE) {
    throw new Error("Nhóm riêng tư không thể tự tham gia");
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (existingMember) {
    throw new Error("Bạn đã là thành viên của nhóm");
  }

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      userId,
      memberRole: GroupMemberRole.MEMBER,
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

  return member;
};

export const leaveGroup = async (groupId: number, userId: number) => {
  await checkGroupExists(groupId);

  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member) {
    throw new Error("Bạn chưa tham gia nhóm này");
  }

  if (member.memberRole === GroupMemberRole.ADMIN) {
    const adminCount = await prisma.groupMember.count({
      where: {
        groupId,
        memberRole: GroupMemberRole.ADMIN,
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

  return true;
};

export const createGroupPost = async (
  groupId: number,
  userId: number,
  data: any,
) => {
  const { content } = data;

  if (!content) {
    throw new Error("Nội dung bài viết không được để trống");
  }

  const group = await checkGroupExists(groupId);

  if (group.status !== GroupStatus.ACTIVE) {
    throw new Error("Nhóm không hoạt động");
  }

  await checkIsGroupMember(groupId, userId);

  const post = await prisma.post.create({
    data: {
      userId,
      groupId,
      content,
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
