import { Router } from "express";
import {
  createPostController,
  deletePostController,
  getPostByIdController,
  getPostListController,
  pinPostByUserIdController,
  reactPostController,
  updatePostController,
} from "../controllers/post.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createCommentController,
  getPostCommentsController,
} from "../controllers/comment.controller";

const postRoutes = Router();

postRoutes.use(authMiddleware);

postRoutes.get("/new-feed", getPostListController);
postRoutes.post("/", createPostController);
postRoutes.post("/:postId/reactions", reactPostController);
postRoutes.patch("/:postId", updatePostController);
postRoutes.delete("/:postId", deletePostController);

postRoutes.get("/:postId/comments", getPostCommentsController);
postRoutes.post("/:postId/comments", createCommentController);
postRoutes.get("/:postId", getPostByIdController);
postRoutes.patch("/:postId/pin", pinPostByUserIdController);

export default postRoutes;
