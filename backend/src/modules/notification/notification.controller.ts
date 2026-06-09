import { Request, Response } from "express";
import type {
  ListNotificationsQuery,
  NotificationIdParams,
} from "@/modules/notification/notification.schema";
import * as notificationService from "@/modules/notification/notification.service";

export async function listNotifications(req: Request, res: Response) {
  const { page, limit } = req.validated as ListNotificationsQuery;

  const result = await notificationService.listNotifications(
    req.user!.id,
    page,
    limit,
  );

  res.status(200).json({
    message: "Lấy danh sách thông báo thành công",
    data: result,
  });
}

export async function getUnreadCount(req: Request, res: Response) {
  const unreadCount = await notificationService.getUnreadCount(req.user!.id);

  res.status(200).json({
    message: "Lấy số thông báo chưa đọc thành công",
    data: { unreadCount },
  });
}

export async function markNotificationRead(req: Request, res: Response) {
  const { notificationId } = req.validated as NotificationIdParams;

  const result = await notificationService.markNotificationRead(
    req.user!.id,
    notificationId,
  );

  res.status(200).json({
    message: "Đánh dấu đã đọc thành công",
    data: result,
  });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const result = await notificationService.markAllNotificationsRead(req.user!.id);

  res.status(200).json({
    message: "Đánh dấu tất cả đã đọc thành công",
    data: result,
  });
}
