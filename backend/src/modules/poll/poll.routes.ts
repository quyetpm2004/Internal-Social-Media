import { Router } from "express";
import { votePoll } from "@/modules/poll/poll.controller";
import {
  pollIdParamsSchema,
  votePollSchema,
} from "@/modules/poll/poll.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.post(
  "/:pollId/vote",
  validateParams(pollIdParamsSchema),
  validateBody(votePollSchema),
  asyncHandler(votePoll),
);

export default router;
