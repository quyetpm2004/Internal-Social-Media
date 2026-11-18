import { Router } from "express";
import * as kpiController from "@/modules/kpi/kpi.controller";
import { kpiMemberQuerySchema, kpiQuerySchema } from "@/modules/kpi/kpi.schema";
import { departmentIdParamsSchema } from "@/modules/department/department.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { requirePermission } from "@/shared/middlewares/role.middleware";
import {
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";
import { z } from "zod";

const router = Router();

router.use(authMiddleware);

router.get(
  "/me",
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getMyKpi),
);

router.get(
  "/organization/overview",
  requirePermission("organization.dashboard.view"),
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getOrganizationOverview),
);

router.get(
  "/department/overview",
  requirePermission("department.dashboard.view"),
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getDepartmentOverview),
);

router.get(
  "/department/members",
  requirePermission("department.dashboard.view"),
  validateQuery(kpiMemberQuerySchema),
  asyncHandler(kpiController.getDepartmentKpi),
);

router.get(
  "/department/members/:userId",
  requirePermission("department.dashboard.view"),
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getMemberKpi),
);

const memberParamsSchema = departmentIdParamsSchema.extend({
  userId: z.coerce.number().int().positive("userId không hợp lệ"),
});

router.get(
  "/departments/:departmentId/overview",
  requirePermission("department.dashboard.view"),
  validateParams(departmentIdParamsSchema),
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getDepartmentOverview),
);

router.get(
  "/departments/:departmentId/members",
  requirePermission("department.dashboard.view"),
  validateParams(departmentIdParamsSchema),
  validateQuery(kpiMemberQuerySchema),
  asyncHandler(kpiController.getDepartmentKpi),
);

router.get(
  "/departments/:departmentId/members/:userId",
  requirePermission("department.dashboard.view"),
  validateParams(memberParamsSchema),
  validateQuery(kpiQuerySchema),
  asyncHandler(kpiController.getMemberKpi),
);

export default router;
