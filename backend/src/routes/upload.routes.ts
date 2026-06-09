import { Router } from "express";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  createUploadUrlController,
  confirmUploadController,
} from "@/controllers/upload.controller";

const router = Router();

router.post("/presign", authMiddleware, createUploadUrlController);
router.post("/confirm", authMiddleware, confirmUploadController);

export default router;
