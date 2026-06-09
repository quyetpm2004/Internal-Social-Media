import { Router } from "express";
import * as authController from "@/modules/auth/auth.controller";
import { loginSchema, registerSchema } from "@/modules/auth/auth.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { validateBody } from "@/shared/middlewares/validate.middleware";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(authController.login),
);
router.post("/refresh-token", asyncHandler(authController.refreshToken));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", authMiddleware, asyncHandler(authController.getMe));

export default router;
