import { Router } from "express";
import * as notificationController from "@/modules/notification/notification.controller";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "@/modules/notification/notification.schema";
import { asyncHandler } from "@/shared/middlewares/async-handler.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import {
  validateParams,
  validateQuery,
} from "@/shared/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  validateQuery(listNotificationsQuerySchema),
  asyncHandler(notificationController.listNotifications),
);
router.get(
  "/unread-count",
  asyncHandler(notificationController.getUnreadCount),
);
router.patch(
  "/read-all",
  asyncHandler(notificationController.markAllNotificationsRead),
);
router.patch(
  "/:notificationId/read",
  validateParams(notificationIdParamsSchema),
  asyncHandler(notificationController.markNotificationRead),
);

export default router;
