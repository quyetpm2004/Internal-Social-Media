import { Router } from "express";
import {
  getPostCommentsController,
  getCommentRepliesController,
  createCommentController,
  replyCommentController,
  reactCommentController,
  deleteCommentController,
  updateCommentController,
} from "../controllers/comment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const commentRoutes = Router();

/**
 * GET /api/comments/:commentId/replies
 * Lấy replies của một comment
 */
commentRoutes.get(
  "/:commentId/replies",
  authMiddleware,
  getCommentRepliesController,
);

/**
 * POST /api/comments/:commentId/replies
 * Reply vào một comment
 */
commentRoutes.post(
  "/:commentId/replies",
  authMiddleware,
  replyCommentController,
);

/**
 * POST /api/comments/:commentId/reactions
 * React vào comment
 */
commentRoutes.post(
  "/:commentId/reactions",
  authMiddleware,
  reactCommentController,
);

/**
 * PATCH /api/comments/:commentId
 * Sửa comment
 */
commentRoutes.patch("/:commentId", authMiddleware, updateCommentController);

/**
 * DELETE /api/comments/:commentId
 * Xóa comment
 */
commentRoutes.delete("/:commentId", authMiddleware, deleteCommentController);

export default commentRoutes;
