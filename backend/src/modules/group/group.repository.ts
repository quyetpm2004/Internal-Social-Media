import {
  GroupMemberRole,
  GroupMemberStatus,
  GroupStatus,
  GroupType,
  PostStatus,
  PostVisibility,
  Prisma,
} from "@prisma/client";
import prisma from "@/shared/utils/prisma";

export function findGroup(groupId: number) {
  return prisma.group.findUnique({
    where: { id: groupId },
  });
}

export function loadGroupDetail(groupId: number) {
  return prisma.group.findUnique({
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
}

export function listGroups(where: Prisma.GroupWhereInput, skip: number, take: number) {
  return prisma.group.findMany({
    where,
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
}

export function countGroups(where: Prisma.GroupWhereInput) {
  return prisma.group.count({ where });
}

export function insertGroup(data: {
  groupName: string;
  description?: string | null;
  groupType: GroupType;
  departmentId: number | null;
  createdBy: number;
}) {
  return prisma.group.create({
    data: {
      groupName: data.groupName,
      description: data.description,
      groupType: data.groupType,
      departmentId: data.departmentId,
      createdBy: data.createdBy,
      members: {
        create: {
          userId: data.createdBy,
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
}

export function saveGroup(
  groupId: number,
  data: { groupName?: string; description?: string | null },
) {
  return prisma.group.update({
    where: { id: groupId },
    data: {
      ...(data.groupName !== undefined && { groupName: data.groupName }),
      ...(data.description !== undefined && { description: data.description }),
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
}

export function archiveGroup(groupId: number) {
  return prisma.group.update({
    where: { id: groupId },
    data: {
      status: GroupStatus.ARCHIVED,
    },
  });
}

export function loadGroupSettings(groupId: number) {
  return prisma.group.findUnique({
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
}

export function saveGroupSettings(
  groupId: number,
  data: Prisma.GroupUpdateInput,
) {
  return prisma.group.update({
    where: { id: groupId },
    data,
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
}

export function findMember(groupId: number, userId: number) {
  return prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });
}

export function listMembers(
  where: Prisma.GroupMemberWhereInput,
  skip: number,
  take: number,
) {
  return prisma.groupMember.findMany({
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
    skip,
    take,
  });
}

export function countMembers(where: Prisma.GroupMemberWhereInput) {
  return prisma.groupMember.count({ where });
}

export function countActiveMembers(groupId: number) {
  return prisma.groupMember.count({
    where: {
      groupId,
      status: GroupMemberStatus.ACTIVE,
    },
  });
}

export function countAdmins(groupId: number) {
  return prisma.groupMember.count({
    where: {
      groupId,
      memberRole: GroupMemberRole.ADMIN,
      status: GroupMemberStatus.ACTIVE,
    },
  });
}

export function countPendingMembers(groupId: number) {
  return prisma.groupMember.count({
    where: {
      groupId,
      status: GroupMemberStatus.PENDING,
    },
  });
}

export function listJoinRequests(
  where: Prisma.GroupMemberWhereInput,
  skip: number,
  take: number,
) {
  return prisma.groupMember.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: { select: { avatarKey: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
    skip,
    take,
  });
}

export function insertMember(data: {
  groupId: number;
  userId: number;
  memberRole: GroupMemberRole;
  status: GroupMemberStatus;
}) {
  return prisma.groupMember.create({
    data: {
      groupId: data.groupId,
      userId: data.userId,
      memberRole: data.memberRole,
      status: data.status,
    },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  });
}

export function insertJoin(data: {
  groupId: number;
  userId: number;
  memberRole: GroupMemberRole;
  status: GroupMemberStatus;
}) {
  return prisma.groupMember.create({
    data: {
      groupId: data.groupId,
      userId: data.userId,
      memberRole: data.memberRole,
      status: data.status,
    },
    include: {
      group: true,
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

// kích hoạt thành viên đang chờ (invite / add)
export function activateMember(
  groupId: number,
  userId: number,
  memberRole: GroupMemberRole,
) {
  return prisma.groupMember.update({
    where: {
      groupId_userId: { groupId, userId },
    },
    data: {
      status: GroupMemberStatus.ACTIVE,
      memberRole,
    },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  });
}

export function approveMember(groupId: number, userId: number) {
  return prisma.groupMember.update({
    where: {
      groupId_userId: { groupId, userId },
    },
    data: { status: GroupMemberStatus.ACTIVE },
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

export function saveMemberRole(
  groupId: number,
  userId: number,
  memberRole: GroupMemberRole,
) {
  return prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { memberRole },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
}

export function deleteMember(groupId: number, userId: number) {
  return prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function insertGroupPost(data: {
  userId: number;
  groupId: number;
  content: string;
  visibility: PostVisibility;
  status: PostStatus;
  isAnonymous: boolean;
}) {
  return prisma.post.create({
    data: {
      userId: data.userId,
      groupId: data.groupId,
      content: data.content,
      visibility: data.visibility,
      status: data.status,
      isAnonymous: data.isAnonymous,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: { select: { avatarKey: true } },
        },
      },
      group: true,
      attachments: true,
      reactions: true,
      comments: true,
      _count: {
        select: { comments: true, reactions: true },
      },
    },
  });
}

export function listGroupPosts(groupId: number) {
  return prisma.post.findMany({
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
          profile: { select: { avatarKey: true } },
        },
      },
      attachments: true,
      comments: {
        where: { status: "ACTIVE" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { avatarKey: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: true,
      _count: {
        select: { comments: true, reactions: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

export function loadGroupPost(postId: number, userId: number) {
  return prisma.post.findUnique({
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
      group: {
        select: { id: true, groupName: true },
      },
      reactions: {
        where: { userId },
        select: { reactionType: true },
      },
      attachments: true,
      _count: {
        select: { comments: true, reactions: true },
      },
    },
  });
}

export function listPendingPosts(
  where: Prisma.PostWhereInput,
  skip: number,
  take: number,
) {
  return prisma.post.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: { select: { avatarKey: true } },
        },
      },
      _count: { select: { attachments: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function countPendingPosts(groupId: number) {
  return prisma.post.count({
    where: {
      groupId,
      status: PostStatus.PENDING_REVIEW,
      visibility: PostVisibility.GROUP,
    },
  });
}

export function countPosts(where: Prisma.PostWhereInput) {
  return prisma.post.count({ where });
}

export function findPendingPost(groupId: number, postId: number) {
  return prisma.post.findFirst({
    where: {
      id: postId,
      groupId,
      status: PostStatus.PENDING_REVIEW,
      visibility: PostVisibility.GROUP,
    },
  });
}

export function approvePost(postId: number) {
  return prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.ACTIVE },
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

export function rejectPost(postId: number) {
  return prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.DELETED },
  });
}

export function listGroupAttachments(
  where: Prisma.PostAttachmentWhereInput,
  skip: number,
  take: number,
) {
  return prisma.postAttachment.findMany({
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
                select: { avatarKey: true },
              },
            },
          },
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
    skip,
    take,
  });
}

export function countGroupAttachments(where: Prisma.PostAttachmentWhereInput) {
  return prisma.postAttachment.count({ where });
}

export function findDepartment(departmentId: number) {
  return prisma.department.findUnique({
    where: { id: departmentId },
  });
}

export function findUserById(userId: number) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
