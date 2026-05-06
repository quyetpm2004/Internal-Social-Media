import { Request, Response } from "express";
import { z } from "zod";
import { confirmUpload, createUploadUrl } from "../services/upload.service";

const createUploadUrlSchema = z
  .object({
    purpose: z.enum(["avatar", "post-image", "post-video", "post-file"]),
    fileName: z.string().min(1),
    fileType: z.string().min(1),
    fileSize: z.number().int().positive(),
    postId: z.string().optional().nullable(), // Chấp nhận null hoặc undefined
  })
  .superRefine((data, ctx) => {
    if (data.purpose !== "avatar" && !data.postId) {
      ctx.addIssue({
        code: "custom",
        message: "postId is required for post-related uploads",
        path: ["postId"],
      });
    }
  });

const confirmUploadSchema = z.object({
  key: z.string().min(1),
  purpose: z.enum(["avatar", "post-image", "post-video", "post-file"]),
  postId: z.number().int().positive().optional(),
  fileName: z.string().optional(),
});

export async function createUploadUrlController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    const body = createUploadUrlSchema.parse(req.body);

    const result = await createUploadUrl({
      userId: String(userId),
      purpose: body.purpose,
      fileName: body.fileName,
      fileType: body.fileType,
      fileSize: body.fileSize,
      postId: body.postId ? String(body.postId) : undefined,
    });

    return res.status(200).json({
      message: "Presigned URL created successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "FILE_TYPE_NOT_ALLOWED") {
      return res.status(400).json({ message: "File type not allowed" });
    }

    if (error.message === "FILE_TOO_LARGE") {
      return res.status(400).json({ message: "File too large" });
    }

    return res.status(400).json({
      message: "Cannot create upload URL",
    });
  }
}

export async function confirmUploadController(req: Request, res: Response) {
  try {
    const user = req.user;

    const body = confirmUploadSchema.parse(req.body);

    const result = await confirmUpload({
      userId: String(user?.id),
      key: body.key,
      purpose: body.purpose,
      postId: body.postId,
      fileName: body.fileName,
    });

    return res.status(200).json({
      message: "Upload confirmed successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Cannot confirm upload",
    });
  }
}
