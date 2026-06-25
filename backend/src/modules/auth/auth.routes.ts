import { Router } from "express";
import * as authController from "@/modules/auth/auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyTokenPasswordResetSchema,
} from "@/modules/auth/auth.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
} from "@/shared/middlewares/validate.middleware";

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
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
router.post(
  "/change-password",
  authMiddleware,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
router.get(
  "/verify-reset-token/:token",
  validateParams(verifyTokenPasswordResetSchema),
  asyncHandler(authController.verifyTokenPasswordReset),
);

export default router;
