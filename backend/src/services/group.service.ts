import prisma from "../utils/prisma";
import {
  GroupMemberRole,
  GroupStatus,
  GroupType,
  PostStatus,
  PostVisibility,
} from "@prisma/client";

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

export const getGroups = async (query: any) => {
  const { search, groupType, departmentId } = query;

  const groups = await prisma.group.findMany({
    where: {
      status: GroupStatus.ACTIVE,
      ...(search && {
        groupName: {
          contains: String(search),
        },
      }),
      ...(groupType && {
        groupType: groupType as GroupType,
      }),
      ...(departmentId && {
        departmentId: Number(departmentId),
      }),
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

  return groups;
};

export const getGroupById = async (groupId: number) => {
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

  return group;
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
  const { userId, memberRole } = data;

  if (!userId) {
    throw new Error("userId không được để trống");
  }

  await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) {
    throw new Error("User không tồn tại");
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: Number(userId),
      },
    },
  });

  if (existingMember) {
    throw new Error("User đã là thành viên của nhóm");
  }

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      userId: Number(userId),
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

export const getGroupMembers = async (groupId: number) => {
  await checkGroupExists(groupId);

  const members = await prisma.groupMember.findMany({
    where: { groupId },
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
  });

  return members;
};

export const removeMemberFromGroup = async (
  groupId: number,
  userId: number,
  currentUserId: number,
) => {
  await checkGroupExists(groupId);
  await checkCanManageMember(groupId, currentUserId);

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

  if (member.memberRole === GroupMemberRole.ADMIN) {
    throw new Error("Không thể xóa ADMIN của nhóm");
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

export const updateMemberRole = async (
  groupId: number,
  userId: number,
  currentUserId: number,
  memberRole: GroupMemberRole,
) => {
  if (!memberRole) {
    throw new Error("memberRole không được để trống");
  }

  await checkGroupExists(groupId);
  await checkIsGroupAdmin(groupId, currentUserId);

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
