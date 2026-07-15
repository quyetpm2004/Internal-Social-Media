import { Prisma } from "@prisma/client";
import prisma from "@/shared/utils/prisma";
import { pollInclude } from "@/modules/poll/poll.types";
import type { PollInput, PollUpdateInput } from "@/modules/poll/poll.schema";
import { AppError } from "@/shared/errors/app-error";

type DbTx = Prisma.TransactionClient;

export function insertPoll(
  db: DbTx,
  data: PollInput & { postId?: number; messageId?: number },
) {
  return db.poll.create({
    data: {
      question: data.question,
      allowMultiple: data.allowMultiple ?? false,
      postId: data.postId ?? null,
      messageId: data.messageId ?? null,
      options: {
        create: data.options.map((label, i) => ({
          label,
          sortOrder: i,
        })),
      },
    },
    include: pollInclude,
  });
}

// cập nhật câu hỏi + danh sách lựa chọn (giữ / thêm / xóa)
export async function applyPollEdit(
  db: DbTx,
  pollId: number,
  data: PollUpdateInput,
  oldOptions: Array<{ id: number; _count: { votes: number } }>,
) {
  await db.poll.update({
    where: { id: pollId },
    data: {
      question: data.question,
      allowMultiple: data.allowMultiple ?? false,
    },
  });

  const byId = new Map(oldOptions.map((o) => [o.id, o]));
  const keep = new Set<number>();

  for (let i = 0; i < data.options.length; i++) {
    const opt = data.options[i];

    if (opt.id) {
      const found = byId.get(opt.id);
      if (!found) {
        throw new AppError(400, "Lựa chọn không hợp lệ");
      }

      await db.pollOption.update({
        where: { id: opt.id },
        data: {
          label: opt.label,
          sortOrder: i,
        },
      });
      keep.add(opt.id);
      continue;
    }

    const created = await db.pollOption.create({
      data: {
        pollId,
        label: opt.label,
        sortOrder: i,
      },
    });
    keep.add(created.id);
  }

  // option cũ không còn trong payload → xóa (nếu chưa có vote)
  for (const old of oldOptions) {
    if (keep.has(old.id)) continue;

    if (old._count.votes > 0) {
      throw new AppError(400, "Không thể xóa lựa chọn đã có người bình chọn");
    }

    await db.pollOption.delete({ where: { id: old.id } });
  }
}

export function findPollToVote(pollId: number) {
  return prisma.poll.findUnique({
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
}

export function findGroupMember(groupId: number, userId: number) {
  return prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });
}

export function loadPollDetail(pollId: number) {
  return prisma.poll.findUnique({
    where: { id: pollId },
    include: pollInclude,
  });
}

export function loadPollDetailOrFail(pollId: number) {
  return prisma.poll.findUniqueOrThrow({
    where: { id: pollId },
    include: pollInclude,
  });
}

// xóa vote cũ của user rồi ghi lại
export function saveVotes(pollId: number, userId: number, optionIds: number[]) {
  return prisma.$transaction(async (db) => {
    await db.pollVote.deleteMany({
      where: { pollId, userId },
    });

    await db.pollVote.createMany({
      data: optionIds.map((optionId) => ({
        pollId,
        optionId,
        userId,
      })),
    });
  });
}
