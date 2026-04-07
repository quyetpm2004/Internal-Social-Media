import { Request, Response } from "express";
import * as userService from "../services/user.service";

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await userService.getProfile(userId);

    res.status(200).json({
      message: "Lấy profile thành công",
      data: profile,
    });
  } catch (error) {
    res.status(404).json({
      message: error instanceof Error ? error.message : "Get profile failed",
    });
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updatedUser = await userService.updateProfile(userId, req.body);

    res.status(200).json({
      message: "Cập nhật profile thành công",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Update profile failed",
    });
  }
}
