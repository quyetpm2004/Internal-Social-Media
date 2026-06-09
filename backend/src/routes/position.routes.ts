import { Router } from "express";
import * as positionController from "@/controllers/position.controller";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, positionController.getAllPositions);

export default router;
