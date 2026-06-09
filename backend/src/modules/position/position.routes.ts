import { Router } from "express";
import * as positionController from "@/modules/position/position.controller";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler(positionController.getAllPositions),
);

export default router;
