import { Router } from "express";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { getFileUrlController } from "@/controllers/file.controller";

const router = Router();

router.get("/", authMiddleware, getFileUrlController);

export default router;
