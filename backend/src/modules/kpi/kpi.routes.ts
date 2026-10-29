import { Role } from "@prisma/client";
import { Router } from "express";
import * as kpiController from "@/modules/kpi/kpi.controller";
import { kpiQuerySchema } from "@/modules/kpi/kpi.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { requireRoles } from "@/shared/middlewares/role.middleware";
import { validateQuery } from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get(
  "/me",
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getMyKpi),
);

router.get(
  "/department/overview",
  requireRoles(Role.MANAGER),
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getDepartmentOverview),
);

export default router;
