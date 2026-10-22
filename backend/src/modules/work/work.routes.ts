import { Router } from "express";
import * as workController from "@/modules/work/work.controller";
import { myTaskListQuerySchema } from "@/modules/work/work.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { validateQuery } from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get(
  "/my-tasks",
  validateQuery(myTaskListQuerySchema),
  asyncHandler(workController.listMyTasks),
);

export default router;
