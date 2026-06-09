import { Request, Response } from "express";
import * as positionService from "@/modules/position/position.service";

export async function getAllPositions(_req: Request, res: Response) {
  const positions = await positionService.getAllPositions();

  res.status(200).json({
    message: "Get all positions successfully",
    data: positions,
  });
}
