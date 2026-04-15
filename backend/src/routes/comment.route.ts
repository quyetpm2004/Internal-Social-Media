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
 * GET /api/posts/:postId
 * Lấy comment cấp 1 của bài viết
 */
commentRoutes.get("/posts/:postId", authMiddleware, getPostCommentsController);

/**
 * GET /api/:commentId/replies
 * Lấy replies của một comment
 */
commentRoutes.get(
  "/replies/:commentId",
  authMiddleware,
  getCommentRepliesController,
);

/**
 * POST - tạo comment cấp 1
 */
commentRoutes.post("/posts/:postId", authMiddleware, createCommentController);

/**
 * POST - reply comment
 */
commentRoutes.post(
  "/replies/:commentId",
  authMiddleware,
  replyCommentController,
);

/**
 * POST - react comment
 */
commentRoutes.post("/react/:commentId", authMiddleware, reactCommentController);

/**
 * PATCH - sửa comment
 */
commentRoutes.patch("/:commentId", authMiddleware, updateCommentController);

/**
 * DELETE - xóa comment
 */
commentRoutes.delete("/:commentId", authMiddleware, deleteCommentController);

export default commentRoutes;
