import { GroupMemberStatus, Status } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";

type ResolveMentionTargetsParams = {
  mentionAll?: boolean;
  mentionedUserIds?: number[];
  actorId: number;
  groupId?: number | null;
  conversationId?: number;
};

export const normalizeMentionedUserIds = (
  mentionedUserIds: number[] = [],
  actorId?: number,
): number[] => {
  const unique = [...new Set(mentionedUserIds.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );

  if (actorId == null) {
    return unique;
  }

  return unique.filter((id) => id !== actorId);
};

export const assertMentionedUsersExist = async (
  mentionedUserIds: number[],
): Promise<void> => {
  if (mentionedUserIds.length === 0) {
    return;
  }

  const mentionedUsers = await prisma.user.findMany({
    where: {
      id: { in: mentionedUserIds },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (mentionedUsers.length !== mentionedUserIds.length) {
    throw new AppError(404, "Có người dùng được tag không tồn tại");
  }
};

export const assertMentionedUsersInConversation = async (
  conversationId: number,
  mentionedUserIds: number[],
): Promise<void> => {
  if (mentionedUserIds.length === 0) {
    return;
  }

  const members = await prisma.conversationMember.findMany({
    where: {
      conversationId,
      userId: { in: mentionedUserIds },
      leftAt: null,
    },
    select: { userId: true },
  });

  if (members.length !== mentionedUserIds.length) {
    throw new AppError(400, "Chỉ có thể tag thành viên trong cuộc trò chuyện");
  }
};

export const resolveMentionTargets = async ({
  mentionAll = false,
  mentionedUserIds = [],
  actorId,
  groupId,
  conversationId,
}: ResolveMentionTargetsParams): Promise<number[]> => {
  const individualIds = normalizeMentionedUserIds(mentionedUserIds, actorId);

  if (!mentionAll) {
    return individualIds;
  }

  let scopeIds: number[] = [];

  if (groupId) {
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        status: GroupMemberStatus.ACTIVE,
      },
      select: { userId: true },
    });
    scopeIds = members.map((member) => member.userId);
  } else if (conversationId) {
    const members = await prisma.conversationMember.findMany({
      where: {
        conversationId,
        leftAt: null,
      },
      select: { userId: true },
    });
    scopeIds = members.map((member) => member.userId);
  } else {
    const users = await prisma.user.findMany({
      where: { status: Status.ACTIVE },
      select: { id: true },
    });
    scopeIds = users.map((user) => user.id);
  }

  const scoped = scopeIds.filter((id) => id !== actorId);
  return [...new Set([...individualIds, ...scoped])];
};

export const assertMentionedUsersInGroup = async (
  groupId: number,
  mentionedUserIds: number[],
): Promise<void> => {
  if (mentionedUserIds.length === 0) {
    return;
  }

  const members = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: { in: mentionedUserIds },
      status: GroupMemberStatus.ACTIVE,
    },
    select: { userId: true },
  });

  if (members.length !== mentionedUserIds.length) {
    throw new AppError(400, "Chỉ có thể tag thành viên trong nhóm");
  }
};

export const syncPostMentions = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  postId: number,
  mentionedUserIds: number[],
) => {
  await tx.postMention.deleteMany({ where: { postId } });

  if (mentionedUserIds.length === 0) {
    return;
  }

  await tx.postMention.createMany({
    data: mentionedUserIds.map((mentionedUserId) => ({
      postId,
      mentionedUserId,
    })),
    skipDuplicates: true,
  });
};
