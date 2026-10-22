import { Request, Response } from "express";
import type { MyTaskListQuery } from "@/modules/work/work.schema";
import * as workService from "@/modules/work/work.service";

export async function listMyTasks(req: Request, res: Response) {
  const query = req.validated as MyTaskListQuery;
  const result = await workService.listMyTasks(req.user!.id, query);

  res.status(200).json({
    message: "Lấy nhiệm vụ của tôi thành công",
    data: result,
  });
}
