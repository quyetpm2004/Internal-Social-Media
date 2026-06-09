import express from "express";
import * as notificationController from "@/controllers/notification.controller";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", notificationController.listNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllNotificationsRead);
router.patch(
  "/:notificationId/read",
  notificationController.markNotificationRead,
);

export default router;
