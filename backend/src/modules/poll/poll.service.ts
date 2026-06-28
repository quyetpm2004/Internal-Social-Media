import {
  GroupMemberStatus,
  PollStatus,
  PostStatus,
  Prisma,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import prisma from "@/shared/utils/prisma";
import type { PollInput, PollUpdateInput } from "@/modules/poll/poll.schema";
import {
  pollInclude,
  type PollSummary,
} from "@/modules/poll/poll.types";
import { assertConversationMember } from "@/modules/chat/services/chat-access.service";

type PollForSummary = {
  id: number;
  question: string;
  allowMultiple: boolean;
  endsAt: Date | null;
  status: PollStatus;
  votes: Array<{ optionId: number; userId: number }>;
  options: Array<{
    id: number;
    label: string;
    _count: { votes: number };
    votes?: Array<{ user?: { id: number; fullName: string } | null }>;
  }>;
};

export const mapPollSummary = (
  poll: PollForSummary,
  userId: number,
): PollSummary => {
  const myVotes = poll.votes
    .filter((v) => v.userId === userId)
    .map((v) => v.optionId);

  const options = poll.options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    voteCount: opt._count.votes,
    voters: (opt.votes ?? [])
      .map((vote) => vote.user)
      .filter((user): user is { id: number; fullName: string } => Boolean(user))
      .map((user) => ({
        id: user.id,
        fullName: user.fullName,
      })),
  }));

  const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

  return {
    id: poll.id,
    question: poll.question,
    allowMultiple: poll.allowMultiple,
    endsAt: poll.endsAt?.toISOString() ?? null,
    status: poll.status,
    totalVotes,
    options,
    myVotes,
  };
};

export const createPollInTransaction = async (
  tx: Prisma.TransactionClient,
  input: PollInput & { postId?: number; messageId?: number },
) => {
  const poll = await tx.poll.create({
    data: {
      question: input.question,
      allowMultiple: input.allowMultiple ?? false,
      postId: input.postId ?? null,
      messageId: input.messageId ?? null,
      options: {
        create: input.options.map((label, index) => ({
          label,
          sortOrder: index,
        })),
      },
    },
    include: pollInclude,
  });

  return poll;
};

export const updatePollForPost = async (
  tx: Prisma.TransactionClient,
  pollId: number,
  input: PollUpdateInput,
  existingOptions: Array<{ id: number; _count: { votes: number } }>,
) => {
  await tx.poll.update({
    where: { id: pollId },
    data: {
      question: input.question,
      allowMultiple: input.allowMultiple ?? false,
    },
  });

  const existingById = new Map(
    existingOptions.map((option) => [option.id, option]),
  );
  const keptOptionIds = new Set<number>();

  for (let index = 0; index < input.options.length; index++) {
    const option = input.options[index];

    if (option.id) {
      const existing = existingById.get(option.id);
      if (!existing) {
        throw new AppError(400, "Lựa chọn không hợp lệ");
      }

      await tx.pollOption.update({
        where: { id: option.id },
        data: {
          label: option.label,
          sortOrder: index,
        },
      });
      keptOptionIds.add(option.id);
      continue;
    }

    const created = await tx.pollOption.create({
      data: {
        pollId,
        label: option.label,
        sortOrder: index,
      },
    });
    keptOptionIds.add(created.id);
  }

  for (const existing of existingOptions) {
    if (keptOptionIds.has(existing.id)) continue;

    if (existing._count.votes > 0) {
      throw new AppError(400, "Không thể xóa lựa chọn đã có người bình chọn");
    }

    await tx.pollOption.delete({
      where: { id: existing.id },
    });
  }
};

const assertPollActive = (poll: { status: PollStatus; endsAt: Date | null }) => {
  if (poll.status !== PollStatus.ACTIVE) {
    throw new AppError(400, "Bình chọn đã đóng");
  }

  if (poll.endsAt && poll.endsAt < new Date()) {
    throw new AppError(400, "Bình chọn đã hết hạn");
  }
};

const assertCanVoteOnPoll = async (pollId: number, userId: number) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      post: {
        select: {
          id: true,
          status: true,
          visibility: true,
          groupId: true,
        },
      },
      message: {
        select: {
          id: true,
          conversationId: true,
          status: true,
        },
      },
    },
  });

  if (!poll) {
    throw new AppError(404, "Không tìm thấy bình chọn");
  }

  assertPollActive(poll);

  if (poll.post) {
    if (poll.post.status !== PostStatus.ACTIVE) {
      throw new AppError(400, "Bài viết không khả dụng");
    }

    if (poll.post.groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId: poll.post.groupId, userId },
        },
      });

      if (!membership || membership.status !== GroupMemberStatus.ACTIVE) {
        throw new AppError(403, "Bạn không có quyền bình chọn trong bài viết này");
      }
    }
  } else if (poll.message) {
    await assertConversationMember(poll.message.conversationId, userId);
  } else {
    throw new AppError(400, "Bình chọn không hợp lệ");
  }

  return poll;
};

export const votePollService = async ({
  pollId,
  userId,
  optionIds,
}: {
  pollId: number;
  userId: number;
  optionIds: number[];
}) => {
  const poll = await assertCanVoteOnPoll(pollId, userId);

  const fullPoll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: pollInclude,
  });

  if (!fullPoll) {
    throw new AppError(404, "Không tìm thấy bình chọn");
  }

  const validOptionIds = new Set(fullPoll.options.map((o) => o.id));
  for (const optionId of optionIds) {
    if (!validOptionIds.has(optionId)) {
      throw new AppError(400, "Lựa chọn không hợp lệ");
    }
  }

  if (!fullPoll.allowMultiple && optionIds.length > 1) {
    throw new AppError(400, "Chỉ được chọn một lựa chọn");
  }

  await prisma.$transaction(async (tx) => {
    await tx.pollVote.deleteMany({
      where: { pollId, userId },
    });

    await tx.pollVote.createMany({
      data: optionIds.map((optionId) => ({
        pollId,
        optionId,
        userId,
      })),
    });
  });

  const updated = await prisma.poll.findUniqueOrThrow({
    where: { id: pollId },
    include: pollInclude,
  });

  return {
    poll: mapPollSummary(updated, userId),
    conversationId: poll.message?.conversationId ?? null,
  };
};

export const attachPollSummaryToPosts = async (
  posts: Array<{ poll?: PollForSummary | null } & Record<string, unknown>>,
  userId: number,
) => {
  return posts.map((post) => ({
    ...post,
    poll: post.poll ? mapPollSummary(post.poll, userId) : null,
  }));
};
