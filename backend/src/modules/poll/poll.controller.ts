import { Request, Response } from "express";
import type { VotePollInput } from "@/modules/poll/poll.schema";
import { votePollService } from "@/modules/poll/poll.service";
import { emitPollVote } from "@/socket/chat.socket";

export async function votePoll(req: Request, res: Response) {
  const pollId = Number(req.params.pollId);
  const { optionIds } = req.validated as VotePollInput;

  const result = await votePollService({
    pollId,
    userId: req.user!.id,
    optionIds,
  });

  if (result.conversationId) {
    emitPollVote(result.conversationId, {
      pollId,
      poll: result.poll,
    });
  }

  res.status(200).json({
    message: "Bình chọn thành công",
    data: result.poll,
  });
}
