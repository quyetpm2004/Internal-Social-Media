import { Router } from "express";
import * as userController from "@/controllers/user.controller";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";

const router = Router();

router.get("/profile/:userId", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.delete(
  "/profile/avatar",
  authMiddleware,
  userController.deleteAvatarController,
);

export default router;
