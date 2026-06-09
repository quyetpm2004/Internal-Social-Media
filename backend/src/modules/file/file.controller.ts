import { Request, Response } from "express";
import type { GetFileUrlQuery } from "@/modules/file/file.schema";
import { getFileUrl } from "@/modules/file/file.service";

export async function getFileUrlController(req: Request, res: Response) {
  const { key } = req.validated as GetFileUrlQuery;

  const url = await getFileUrl(key);

  res.status(200).json({
    success: true,
    data: { url },
  });
}
