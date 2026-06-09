import { Request, Response } from "express";
import type {
  ConfirmUploadInput,
  CreateUploadUrlInput,
} from "@/modules/upload/upload.schema";
import {
  confirmUploads,
  createUploadUrls,
} from "@/modules/upload/upload.service";

export async function createUploadUrl(req: Request, res: Response) {
  const { files } = req.validated as CreateUploadUrlInput;

  const result = await createUploadUrls({
    userId: req.user!.id,
    files,
  });

  res.status(200).json({
    message: "Presigned URLs created successfully",
    data: result,
  });
}

export async function confirmUpload(req: Request, res: Response) {
  const { items } = req.validated as ConfirmUploadInput;

  const result = await confirmUploads({
    userId: req.user!.id,
    items,
  });

  res.status(200).json({
    message: "Upload confirmed successfully",
    data: result,
  });
}
