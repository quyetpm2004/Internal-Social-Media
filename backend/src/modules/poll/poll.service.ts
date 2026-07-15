import {
  GroupMemberStatus,
  PollStatus,
  PostStatus,
  Prisma,
} from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import type { PollInput, PollUpdateInput } from "@/modules/poll/poll.schema";
import type { PollSummary } from "@/modules/poll/poll.types";
import { assertConversationMember } from "@/modules/chat/services/chat-access.service";
import * as pollRepo from "@/modules/poll/poll.repository";

type PollRow = {
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

export const mapPollSummary = (poll: PollRow, userId: number): PollSummary => {
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

  let totalVotes = 0;
  for (const opt of options) {
    totalVotes += opt.voteCount;
  }

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

// gọi từ post/chat khi đang trong transaction
export const createPollInTransaction = async (
  tx: Prisma.TransactionClient,
  input: PollInput & { postId?: number; messageId?: number },
) => {
  return pollRepo.insertPoll(tx, input);
};

export const updatePollForPost = async (
  tx: Prisma.TransactionClient,
  pollId: number,
  input: PollUpdateInput,
  existingOptions: Array<{ id: number; _count: { votes: number } }>,
) => {
  return pollRepo.applyPollEdit(tx, pollId, input, existingOptions);
};

const ensurePollStillOpen = (poll: {
  status: PollStatus;
  endsAt: Date | null;
}) => {
  if (poll.status !== PollStatus.ACTIVE) {
    throw new AppError(400, "Bình chọn đã đóng");
  }

  if (poll.endsAt && poll.endsAt < new Date()) {
    throw new AppError(400, "Bình chọn đã hết hạn");
  }
};

const checkCanVote = async (pollId: number, userId: number) => {
  const poll = await pollRepo.findPollToVote(pollId);

  if (!poll) {
    throw new AppError(404, "Không tìm thấy bình chọn");
  }

  ensurePollStillOpen(poll);

  if (poll.post) {
    if (poll.post.status !== PostStatus.ACTIVE) {
      throw new AppError(400, "Bài viết không khả dụng");
    }

    if (poll.post.groupId) {
      const member = await pollRepo.findGroupMember(poll.post.groupId, userId);

      if (!member || member.status !== GroupMemberStatus.ACTIVE) {
        throw new AppError(
          403,
          "Bạn không có quyền bình chọn trong bài viết này",
        );
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
  const poll = await checkCanVote(pollId, userId);
  const detail = await pollRepo.loadPollDetail(pollId);

  if (!detail) {
    throw new AppError(404, "Không tìm thấy bình chọn");
  }

  const allowed = new Set(detail.options.map((o) => o.id));
  for (const id of optionIds) {
    if (!allowed.has(id)) {
      throw new AppError(400, "Lựa chọn không hợp lệ");
    }
  }

  if (!detail.allowMultiple && optionIds.length > 1) {
    throw new AppError(400, "Chỉ được chọn một lựa chọn");
  }

  await pollRepo.saveVotes(pollId, userId, optionIds);

  const afterVote = await pollRepo.loadPollDetailOrFail(pollId);

  return {
    poll: mapPollSummary(afterVote, userId),
    conversationId: poll.message?.conversationId ?? null,
  };
};

export const attachPollSummaryToPosts = async (
  posts: Array<{ poll?: PollRow | null } & Record<string, unknown>>,
  userId: number,
) => {
  return posts.map((post) => ({
    ...post,
    poll: post.poll ? mapPollSummary(post.poll, userId) : null,
  }));
};
