import { Router } from "express";
import { getFileUrlController } from "@/modules/file/file.controller";
import { getFileUrlQuerySchema } from "@/modules/file/file.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { validateQuery } from "@/shared/middlewares/validate.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  validateQuery(getFileUrlQuerySchema),
  asyncHandler(getFileUrlController),
);

export default router;
