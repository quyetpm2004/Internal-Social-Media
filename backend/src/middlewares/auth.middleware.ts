import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access token không hợp lệ" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Access token không hợp lệ hoặc đã hết hạn",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
