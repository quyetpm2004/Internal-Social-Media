import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const result = await notificationService.listNotifications(
      userId,
      page,
      limit,
    );

    res.status(200).json({
      message: "Lấy danh sách thông báo thành công",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Lấy danh sách thông báo thất bại",
    });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      message: "Lấy số thông báo chưa đọc thành công",
      data: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Lấy số thông báo chưa đọc thất bại",
    });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const notificationId = Number(req.params.notificationId);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      res.status(400).json({ message: "notificationId không hợp lệ" });
      return;
    }

    const result = await notificationService.markNotificationRead(
      userId,
      notificationId,
    );

    res.status(200).json({
      message: "Đánh dấu đã đọc thành công",
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      message:
        error instanceof Error ? error.message : "Đánh dấu đã đọc thất bại",
    });
  }
};

export const markAllNotificationsRead = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await notificationService.markAllNotificationsRead(userId);

    res.status(200).json({
      message: "Đánh dấu tất cả đã đọc thành công",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Đánh dấu tất cả đã đọc thất bại",
    });
  }
};
