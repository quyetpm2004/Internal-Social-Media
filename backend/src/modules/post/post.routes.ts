import { Router } from "express";
import {
  createComment,
  getPostComments,
} from "@/modules/comment/comment.controller";
import { createCommentSchema } from "@/modules/comment/comment.schema";
import * as postController from "@/modules/post/post.controller";
import {
  createPostSchema,
  pinPostSchema,
  postIdParamsSchema,
  postListQuerySchema,
  postReactionListQuerySchema,
  reactPostSchema,
  savedPostListQuerySchema,
  updatePostSchema,
} from "@/modules/post/post.schema";
import { commentListQuerySchema } from "@/modules/comment/comment.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get(
  "/new-feed",
  validateQuery(postListQuerySchema),
  asyncHandler(postController.getPostList),
);
router.get(
  "/saved",
  validateQuery(savedPostListQuerySchema),
  asyncHandler(postController.getSavedPosts),
);
router.post(
  "/",
  validateBody(createPostSchema),
  asyncHandler(postController.createPost),
);
router.get(
  "/:postId/reactions",
  validateParams(postIdParamsSchema),
  validateQuery(postReactionListQuerySchema),
  asyncHandler(postController.getPostReactions),
);
router.post(
  "/:postId/reactions",
  validateParams(postIdParamsSchema),
  validateBody(reactPostSchema),
  asyncHandler(postController.reactPost),
);
router.patch(
  "/:postId",
  validateParams(postIdParamsSchema),
  validateBody(updatePostSchema),
  asyncHandler(postController.updatePost),
);
router.delete(
  "/:postId",
  validateParams(postIdParamsSchema),
  asyncHandler(postController.deletePost),
);

router.get(
  "/:postId/comments",
  validateParams(postIdParamsSchema),
  validateQuery(commentListQuerySchema),
  asyncHandler(getPostComments),
);
router.post(
  "/:postId/comments",
  validateParams(postIdParamsSchema),
  validateBody(createCommentSchema),
  asyncHandler(createComment),
);
router.get(
  "/:postId",
  validateParams(postIdParamsSchema),
  asyncHandler(postController.getPostByIdHandler),
);
router.patch(
  "/:postId/pin",
  validateParams(postIdParamsSchema),
  validateBody(pinPostSchema),
  asyncHandler(postController.pinPost),
);
router.post(
  "/:postId/save",
  validateParams(postIdParamsSchema),
  asyncHandler(postController.toggleSavePost),
);

export default router;
