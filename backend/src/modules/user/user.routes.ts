import { Router } from "express";
import * as userController from "@/modules/user/user.controller";
import {
  updateProfileSchema,
  userIdParamsSchema,
} from "@/modules/user/user.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.get(
  "/profile/:userId",
  authMiddleware,
  validateParams(userIdParamsSchema),
  asyncHandler(userController.getProfile),
);
router.put(
  "/profile",
  authMiddleware,
  validateBody(updateProfileSchema),
  asyncHandler(userController.updateProfile),
);
router.delete(
  "/profile/avatar",
  authMiddleware,
  asyncHandler(userController.deleteAvatar),
);

export default router;
