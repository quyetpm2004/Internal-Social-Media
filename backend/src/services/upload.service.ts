import { randomUUID } from "crypto";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../lib/s3";
import prisma from "../utils/prisma";
import { getFileUrl } from "./file.service";

type UploadPurpose =
  | "avatar"
  | "post-image"
  | "post-video"
  | "post-file"
  | "group-cover";

type CreateUploadUrlsInput = {
  userId: string;
  files: {
    purpose: UploadPurpose;
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
};

interface UploadRule {
  maxSize: number;
  allowedTypes: string[]; // Khai báo là mảng string chung
  folder: string;
}

export async function createUploadUrls(input: CreateUploadUrlsInput) {
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
  };

  const items = await Promise.all(
    files.map(async (file) => {
      const rule = uploadRules[file.purpose];

      if (!rule.allowedTypes.includes(file.fileType)) {
        throw new Error("FILE_TYPE_NOT_ALLOWED");
      }

      if (file.fileSize > rule.maxSize) {
        throw new Error("FILE_TOO_LARGE");
      }

      const extension = file.fileName.split(".").pop();

      const key = `${rule.folder}/${userId}/${crypto.randomUUID()}.${extension}`;

      let attachmentId: number | null = null;

      /**
       * Only create DB record for post media
       */
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
            uploadedById: +userId,
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

  return {
    items,
  };
}

type ConfirmUploadInput = {
  userId: number;
  items: {
    key: string;
    purpose: UploadPurpose;
    attachmentId: number;
    groupId: string;
  }[];
};

export async function confirmUploads(input: ConfirmUploadInput) {
  const { userId, items } = input;

  const results = [];

  for (const item of items) {
    const { purpose, key, attachmentId, groupId } = item;

    const headObject = await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      }),
    );

    if (!headObject.ContentLength || !headObject.ContentType) {
      throw new Error("INVALID_FILE");
    }

    /**
     * AVATAR
     */
    if (purpose === "avatar") {
      await prisma.profile.upsert({
        where: {
          userId: userId,
        },

        update: {
          avatarKey: key,
        },

        create: {
          userId: userId,
          avatarKey: key,
        },
      });

      results.push({
        type: "avatar",
        key,
      });

      continue;
    }

    /**
     * GROUP COVER
     */
    if (purpose === "group-cover") {
      if (!groupId) {
        throw new Error("GROUP_ID_REQUIRED");
      }

      await prisma.group.update({
        where: {
          id: +groupId,
        },

        data: {
          coverKey: key,
        },
      });

      results.push({
        type: "group-cover",
        key,
      });

      continue;
    }

    /**
     * POST MEDIA
     */
    if (!attachmentId) {
      throw new Error("ATTACHMENT_ID_REQUIRED");
    }

    const attachment = await prisma.postAttachment.findFirst({
      where: {
        id: attachmentId,
        status: "PENDING",
      },
    });

    if (!attachment) {
      throw new Error("ATTACHMENT_NOT_FOUND");
    }

    const updatedAttachment = await prisma.postAttachment.update({
      where: {
        id: attachment.id,
      },

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

  return {
    items: results,
  };
}
