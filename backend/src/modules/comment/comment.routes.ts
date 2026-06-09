import { Router } from "express";
import * as commentController from "@/modules/comment/comment.controller";
import {
  commentIdParamsSchema,
  commentListQuerySchema,
  reactCommentSchema,
  replyCommentSchema,
  updateCommentSchema,
} from "@/modules/comment/comment.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.get(
  "/:commentId/replies",
  authMiddleware,
  validateParams(commentIdParamsSchema),
  validateQuery(commentListQuerySchema),
  asyncHandler(commentController.getCommentReplies),
);
router.post(
  "/:commentId/replies",
  authMiddleware,
  validateParams(commentIdParamsSchema),
  validateBody(replyCommentSchema),
  asyncHandler(commentController.replyComment),
);
router.post(
  "/:commentId/reactions",
  authMiddleware,
  validateParams(commentIdParamsSchema),
  validateBody(reactCommentSchema),
  asyncHandler(commentController.reactComment),
);
router.patch(
  "/:commentId",
  authMiddleware,
  validateParams(commentIdParamsSchema),
  validateBody(updateCommentSchema),
  asyncHandler(commentController.updateComment),
);
router.delete(
  "/:commentId",
  authMiddleware,
  validateParams(commentIdParamsSchema),
  asyncHandler(commentController.deleteComment),
);

export default router;
