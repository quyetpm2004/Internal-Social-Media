import { Request, Response } from "express";
import { getFileUrl } from "../services/file.service";

export async function getFileUrlController(req: Request, res: Response) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Key is required",
      });
    }

    const url = await getFileUrl(key as string);

    return res.status(200).json({
      success: true,
      data: {
        url,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Cannot get file URL",
    });
  }
}
