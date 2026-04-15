import { Router } from "express";
import {
  createPostController,
  deletePostController,
  getPostListController,
  reactPostController,
} from "../controllers/post.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createUploadMiddleware } from "../middlewares/upload.middleware";

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
  createUploadMiddleware("post").array("images", 5),
  createPostController,
);
postRoutes.post("/:postId/react", authMiddleware, reactPostController);
postRoutes.delete("/:postId", authMiddleware, deletePostController);

export default postRoutes;
