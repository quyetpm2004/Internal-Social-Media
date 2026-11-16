import { NextFunction, Request, Response } from "express";
import { AppError } from "@/shared/errors/app-error";
import { can, type Permission } from "@/shared/permissions";

/** Chặn request nếu role hiện tại không có quyền trong ma trận (đặt sau authMiddleware). */
export const requirePermission =
  (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !can(req.user.role, permission)) {
      throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
    }
    next();
  };
