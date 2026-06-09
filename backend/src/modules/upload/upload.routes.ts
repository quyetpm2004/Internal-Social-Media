import { Router } from "express";
import * as uploadController from "@/modules/upload/upload.controller";
import {
  confirmUploadSchema,
  createUploadUrlSchema,
} from "@/modules/upload/upload.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { validateBody } from "@/shared/middlewares/validate.middleware";

const router = Router();

router.post(
  "/presign",
  authMiddleware,
  validateBody(createUploadUrlSchema),
  asyncHandler(uploadController.createUploadUrl),
);
router.post(
  "/confirm",
  authMiddleware,
  validateBody(confirmUploadSchema),
  asyncHandler(uploadController.confirmUpload),
);

export default router;
