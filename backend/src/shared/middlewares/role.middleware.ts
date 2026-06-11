import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { AppError } from "@/shared/errors/app-error";

export const requireRoles =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      throw new AppError(403, "Bạn không có quyền thực hiện thao tác này");
    }
    next();
  };
