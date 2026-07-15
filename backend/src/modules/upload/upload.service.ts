import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/shared/errors/app-error";
import { s3 } from "@/shared/lib/s3";
import type {
  ConfirmUploadInput,
  CreateUploadUrlInput,
  UploadPurpose,
} from "@/modules/upload/upload.schema";
import {
  getConversationMemberUserIds,
  invalidateConversationForMembers,
} from "@/modules/chat/services/chat-cache.service";
import * as uploadRepo from "@/modules/upload/upload.repository";

interface UploadRule {
  maxSize: number;
  allowedTypes: string[];
  folder: string;
}

type CreateUploadUrlsParams = {
  userId: number;
  files: CreateUploadUrlInput["files"];
};

type ConfirmUploadsParams = {
  userId: number;
  items: ConfirmUploadInput["items"];
};

function getAttachmentType(
  purpose: string,
  prefix: "post" | "message",
): "IMAGE" | "VIDEO" | "FILE" {
  if (purpose === `${prefix}-image`) return "IMAGE";
  if (purpose === `${prefix}-video`) return "VIDEO";
  return "FILE";
}

export async function createUploadUrls(input: CreateUploadUrlsParams) {
  const { userId, files } = input;

  const uploadRules: Record<UploadPurpose, UploadRule> = {
    avatar: {
      maxSize: 2 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      folder: "users/avatar",
    },
    "group-cover": {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      folder: "groups/cover",
    },
    "conversation-avatar": {
      maxSize: 2 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      folder: "chat/avatars",
    },
    "post-image": {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      folder: "posts/images",
    },
    "post-video": {
      maxSize: 200 * 1024 * 1024,
      allowedTypes: ["video/mp4", "video/webm"],
      folder: "posts/videos",
    },
    "post-file": {
      maxSize: 20 * 1024 * 1024,
      allowedTypes: [
        "application/pdf",
        "application/zip",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.presentation",
      ],
      folder: "posts/files",
    },
    "message-image": {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      folder: "chat/images",
    },
    "message-video": {
      maxSize: 100 * 1024 * 1024,
      allowedTypes: ["video/mp4", "video/webm"],
      folder: "chat/videos",
    },
    "message-file": {
      maxSize: 20 * 1024 * 1024,
      allowedTypes: [
        "application/pdf",
        "application/zip",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.presentation",
        "text/plain",
      ],
      folder: "chat/files",
    },
  };

  const items = await Promise.all(
    files.map(async (file) => {
      const rule = uploadRules[file.purpose];

      if (!rule.allowedTypes.includes(file.fileType)) {
        throw new AppError(400, "File type not allowed");
      }

      if (file.fileSize > rule.maxSize) {
        throw new AppError(400, "File too large");
      }

      const extension = file.fileName.split(".").pop();
      const key = `${rule.folder}/${userId}/${crypto.randomUUID()}.${extension}`;

      let attachmentId: number | null = null;

      if (file.purpose.startsWith("post-")) {
        const attachment = await uploadRepo.createPendingPostAttachment({
          fileName: file.fileName,
          fileKey: key,
          attachmentType: getAttachmentType(file.purpose, "post"),
          mimeType: file.fileType,
          uploadedById: userId,
          fileSize: file.fileSize,
        });
        attachmentId = attachment.id;
      }

      if (file.purpose.startsWith("message-")) {
        const attachment = await uploadRepo.createPendingMessageAttachment({
          fileName: file.fileName,
          fileKey: key,
          attachmentType: getAttachmentType(file.purpose, "message"),
          mimeType: file.fileType,
          uploadedById: userId,
          fileSize: file.fileSize,
        });
        attachmentId = attachment.id;
      }

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        ContentType: file.fileType,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 60 * 15,
      });

      return {
        attachmentId,
        key,
        uploadUrl,
        method: "PUT",
        headers: {
          "Content-Type": file.fileType,
        },
      };
    }),
  );

  return { items };
}

export async function confirmUploads(input: ConfirmUploadsParams) {
  const { userId, items } = input;
  const results = [];

  for (const item of items) {
    const { purpose, key, attachmentId, groupId, conversationId } = item;

    const headObject = await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      }),
    );

    if (!headObject.ContentLength || !headObject.ContentType) {
      throw new AppError(400, "Invalid file");
    }

    if (purpose === "avatar") {
      await uploadRepo.upsertAvatarKey(userId, key);
      results.push({ type: "avatar", key });
      continue;
    }

    if (purpose === "conversation-avatar") {
      if (!conversationId) {
        throw new AppError(400, "Conversation ID is required");
      }

      const conversation = await uploadRepo.getConversationType(conversationId);

      if (!conversation || conversation.type !== "GROUP") {
        throw new AppError(404, "Conversation not found");
      }

      const member = await uploadRepo.getConversationMember(
        conversationId,
        userId,
      );

      if (!member || member.leftAt || member.role !== "ADMIN") {
        throw new AppError(403, "Forbidden");
      }

      await uploadRepo.updateConversationAvatar(conversationId, key);

      const memberUserIds = await getConversationMemberUserIds(conversationId);
      await invalidateConversationForMembers(conversationId, memberUserIds);

      results.push({
        type: "conversation-avatar",
        key,
        conversationId,
      });
      continue;
    }

    if (purpose === "group-cover") {
      if (!groupId) {
        throw new AppError(400, "Group ID is required");
      }

      await uploadRepo.updateGroupCover(groupId, key);
      results.push({ type: "group-cover", key });
      continue;
    }

    if (purpose.startsWith("message-")) {
      if (!attachmentId) {
        throw new AppError(400, "Attachment ID is required");
      }

      const attachment =
        await uploadRepo.getPendingMessageAttachment(attachmentId);

      if (!attachment) {
        throw new AppError(404, "Attachment not found");
      }

      const updatedAttachment = await uploadRepo.markMessageAttachmentReady(
        attachment.id,
        headObject.ContentType,
        headObject.ContentLength,
      );

      results.push({
        type: "message-attachment",
        attachment: updatedAttachment,
      });
      continue;
    }

    // mặc định: post attachment
    if (!attachmentId) {
      throw new AppError(400, "Attachment ID is required");
    }

    const attachment = await uploadRepo.getPendingPostAttachment(attachmentId);

    if (!attachment) {
      throw new AppError(404, "Attachment not found");
    }

    const updatedAttachment = await uploadRepo.markPostAttachmentReady(
      attachment.id,
      headObject.ContentType,
      headObject.ContentLength,
    );

    results.push({
      type: "post-attachment",
      attachment: updatedAttachment,
    });
  }

  return { items: results };
}
