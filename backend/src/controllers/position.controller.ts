import { Request, Response } from "express";
import * as positionService from "../services/position.service";

export async function getAllPositions(req: Request, res: Response) {
  try {
    const positions = await positionService.getAllPositions();
    res
      .status(200)
      .json({ message: "Lấy tất cả chức vụ thành công", data: positions });
  } catch (error) {
    res
      .status(500)
      .json({ message: error instanceof Error ? error.message : "Lỗi server" });
  }
}
