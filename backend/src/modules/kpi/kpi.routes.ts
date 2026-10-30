import { Role } from "@prisma/client";
import { Router } from "express";
import * as kpiController from "@/modules/kpi/kpi.controller";
import { kpiMemberQuerySchema, kpiQuerySchema } from "@/modules/kpi/kpi.schema";
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

router.get(
  "/department/members",
  requireRoles(Role.MANAGER),
  validateQuery(kpiMemberQuerySchema),
  asyncHandler(kpiController.getDepartmentKpi),
);

router.get(
  "/department/members/:userId",
  requireRoles(Role.MANAGER),
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getMemberKpi),
);

export default router;
