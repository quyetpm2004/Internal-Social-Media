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

postRoutes.get("/new-feed", authMiddleware, getPostListController);
postRoutes.post("/", authMiddleware, createPostController);
postRoutes.post("/:postId/reactions", authMiddleware, reactPostController);
postRoutes.delete("/:postId", authMiddleware, deletePostController);

postRoutes.get("/:postId/comments", authMiddleware, getPostCommentsController);
postRoutes.post("/:postId/comments", authMiddleware, createCommentController);

export default postRoutes;
