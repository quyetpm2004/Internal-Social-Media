import { Router } from "express";
import * as departmentController from "@/modules/department/department.controller";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler(departmentController.getAllDepartments),
);

export default router;
