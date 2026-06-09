import { Request, Response } from "express";
import { z } from "zod";
import { confirmUploads, createUploadUrls } from "@/services/upload.service";

const uploadPurposeEnum = z.enum([
  "avatar",
  "post-image",
  "post-video",
  "post-file",
  "group-cover",
  "conversation-avatar",
  "message-image",
  "message-video",
  "message-file",
]);

const createUploadUrlSchema = z.object({
  files: z
    .array(
      z.object({
        purpose: uploadPurposeEnum,
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
      }),
    )
    .max(10),
});

export async function createUploadUrlController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    const body = createUploadUrlSchema.parse(req.body);

    const result = await createUploadUrls({
      userId: String(userId),
      files: body.files,
    });

    return res.status(200).json({
      message: "Presigned URLs created successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "FILE_TYPE_NOT_ALLOWED") {
      return res.status(400).json({
        message: "File type not allowed",
      });
    }

    if (error.message === "FILE_TOO_LARGE") {
      return res.status(400).json({
        message: "File too large",
      });
    }

    return res.status(400).json({
      message: "Cannot create upload URLs",
    });
  }
}

export const confirmUploadSchema = z.object({
  items: z.array(
    z.object({
      purpose: uploadPurposeEnum,

      key: z.string(),

      attachmentId: z.number().optional(),

      groupId: z.number().optional(),

      conversationId: z.number().optional(),
    }),
  ),
});

export async function confirmUploadController(req: Request, res: Response) {
  try {
    const userId = Number(req.user?.id);

    const body = confirmUploadSchema.parse(req.body);

    const result = await confirmUploads({
      userId,
      items: body.items as any[],
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
