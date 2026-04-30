import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.patch("/profile/avatar", authMiddleware, userController.updateProfile);
router.delete("/profile/avatar", authMiddleware, userController.updateProfile);

export default router;
