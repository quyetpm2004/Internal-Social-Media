import { z } from "zod";

export const uploadPurposeEnum = z.enum([
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

export const createUploadUrlSchema = z.object({
  files: z
    .array(
      z.object({
        purpose: uploadPurposeEnum,
        fileName: z.string().trim().min(1),
        fileType: z.string().trim().min(1),
        fileSize: z.number().positive(),
      }),
    )
    .min(1)
    .max(10),
});

export const confirmUploadSchema = z.object({
  items: z
    .array(
      z.object({
        purpose: uploadPurposeEnum,
        key: z.string().trim().min(1),
        attachmentId: z.number().int().positive().optional(),
        groupId: z.number().int().positive().optional(),
        conversationId: z.number().int().positive().optional(),
      }),
    )
    .min(1),
});

export type UploadPurpose = z.infer<typeof uploadPurposeEnum>;
export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
