import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/shared/errors/app-error";
import { s3 } from "@/shared/lib/s3";
import prisma from "@/shared/utils/prisma";
import type {
  ConfirmUploadInput,
  CreateUploadUrlInput,
  UploadPurpose,
} from "@/modules/upload/upload.schema";
import {
  getConversationMemberUserIds,
  invalidateConversationForMembers,
} from "@/modules/chat/services/chat-cache.service";

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
        const attachment = await prisma.postAttachment.create({
          data: {
            fileName: file.fileName,
            fileKey: key,
            attachmentType:
              file.purpose === "post-image"
                ? "IMAGE"
                : file.purpose === "post-video"
                  ? "VIDEO"
                  : "FILE",
            mimeType: file.fileType,
            uploadedById: userId,
            fileSize: file.fileSize,
            status: "PENDING",
          },
        });

        attachmentId = attachment.id;
      }

      if (file.purpose.startsWith("message-")) {
        const attachment = await prisma.messageAttachment.create({
          data: {
            fileName: file.fileName,
            fileKey: key,
            attachmentType:
              file.purpose === "message-image"
                ? "IMAGE"
                : file.purpose === "message-video"
                  ? "VIDEO"
                  : "FILE",
            mimeType: file.fileType,
            uploadedById: userId,
            fileSize: file.fileSize,
            status: "PENDING",
          },
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
      await prisma.profile.upsert({
        where: { userId },
        update: { avatarKey: key },
        create: { userId, avatarKey: key },
      });

      results.push({ type: "avatar", key });
      continue;
    }

    if (purpose === "conversation-avatar") {
      if (!conversationId) {
        throw new AppError(400, "Conversation ID is required");
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { type: true },
      });

      if (!conversation || conversation.type !== "GROUP") {
        throw new AppError(404, "Conversation not found");
      }

      const member = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        select: { role: true, leftAt: true },
      });

      if (!member || member.leftAt || member.role !== "ADMIN") {
        throw new AppError(403, "Forbidden");
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { avatarKey: key },
      });

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

      await prisma.group.update({
        where: { id: groupId },
        data: { coverKey: key },
      });

      results.push({ type: "group-cover", key });
      continue;
    }

    if (purpose.startsWith("message-")) {
      if (!attachmentId) {
        throw new AppError(400, "Attachment ID is required");
      }

      const attachment = await prisma.messageAttachment.findFirst({
        where: { id: attachmentId, status: "PENDING" },
      });

      if (!attachment) {
        throw new AppError(404, "Attachment not found");
      }

      const updatedAttachment = await prisma.messageAttachment.update({
        where: { id: attachment.id },
        data: {
          mimeType: headObject.ContentType,
          fileSize: headObject.ContentLength,
          status: "READY",
        },
      });

      results.push({
        type: "message-attachment",
        attachment: updatedAttachment,
      });
      continue;
    }

    if (!attachmentId) {
      throw new AppError(400, "Attachment ID is required");
    }

    const attachment = await prisma.postAttachment.findFirst({
      where: { id: attachmentId, status: "PENDING" },
    });

    if (!attachment) {
      throw new AppError(404, "Attachment not found");
    }

    const updatedAttachment = await prisma.postAttachment.update({
      where: { id: attachment.id },
      data: {
        mimeType: headObject.ContentType,
        fileSize: headObject.ContentLength,
        status: "READY",
      },
    });

    results.push({
      type: "post-attachment",
      attachment: updatedAttachment,
    });
  }

  return { items: results };
}
