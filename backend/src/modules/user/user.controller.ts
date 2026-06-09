import { Request, Response } from "express";
import type {
  UpdateProfileInput,
  UserIdParams,
} from "@/modules/user/user.schema";
import * as userService from "@/modules/user/user.service";

export async function getProfile(req: Request, res: Response) {
  const { userId } = req.validated as UserIdParams;

  const profile = await userService.getProfile(userId);

  res.status(200).json({
    message: "Lấy profile thành công",
    data: profile,
  });
}

export async function updateProfile(req: Request, res: Response) {
  const data = req.validated as UpdateProfileInput;

  const updatedUser = await userService.updateProfile(req.user!.id, data);

  res.status(200).json({
    message: "Cập nhật profile thành công",
    data: updatedUser,
  });
}

export async function deleteAvatar(req: Request, res: Response) {
  await userService.deleteAvatar(req.user!.id);

  res.status(200).json({
    message: "Xóa avatar thành công",
  });
}
