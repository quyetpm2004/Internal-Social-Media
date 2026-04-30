import { Router } from "express";
import {
  createPostController,
  deletePostController,
  getPostListController,
  reactPostController,
} from "../controllers/post.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createUploadMiddleware } from "../middlewares/upload.middleware";
import {
  createCommentController,
  getPostCommentsController,
} from "../controllers/comment.controller";

const postRoutes = Router();

/**
 * GET /api/v1/posts
 * Query:
 * - page?: number = 1
 * - limit?: number = 10
 * - sort?: "latest" | "trending" = "latest"
 * - groupId?: number
 */
postRoutes.get("/new-feed", authMiddleware, getPostListController);
postRoutes.post(
  "/",
  authMiddleware,
  createUploadMiddleware("post").array("files", 5),
  createPostController,
);
postRoutes.post("/:postId/reactions", authMiddleware, reactPostController);
postRoutes.delete("/:postId", authMiddleware, deletePostController);

/**
 * GET /api/:postId/comments
 * Lấy comment cấp 1 của bài viết
 */
postRoutes.get("/:postId/comments", authMiddleware, getPostCommentsController);

/**
 * POST /api/:postId/comments
 * Tạo comment cấp 1 cho bài viết
 */
postRoutes.post("/:postId/comments", authMiddleware, createCommentController);

export default postRoutes;
