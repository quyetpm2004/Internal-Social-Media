import { NextFunction, Request, Response } from "express";
import { authenticateAccessToken } from "@/shared/utils/authenticate";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access token không hợp lệ" });
      return;
    }

    const token = authHeader.split(" ")[1];
    req.user = await authenticateAccessToken(token);
    next();
  } catch (error) {
    res.status(401).json({
      message: "Access token không hợp lệ hoặc đã hết hạn",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
