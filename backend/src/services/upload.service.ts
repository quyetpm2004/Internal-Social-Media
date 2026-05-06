import { randomUUID } from "crypto";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../lib/s3";
import prisma from "../utils/prisma";
import { getFileUrl } from "./file.service";

type UploadPurpose = "avatar" | "post-image" | "post-video" | "post-file";

type CreateUploadUrlInput = {
  userId: string;
  purpose: UploadPurpose;
  fileName: string;
  fileType: string;
  fileSize: number;
  postId?: string;
};

interface UploadRule {
  maxSize: number;
  allowedTypes: string[]; // Khai báo là mảng string chung
  folder: string;
}

function buildObjectKey(params: {
  userId: string;
  purpose: UploadPurpose;
  fileName: string;
  postId?: string;
}) {
  const ext = params.fileName.split(".").pop()?.toLowerCase() || "bin";
  const id = randomUUID();

  if (params.purpose === "avatar") {
    return `users/${params.userId}/avatar/${id}.${ext}`;
  }

  if (!params.postId) {
    throw new Error("POST_ID_REQUIRED");
  }

  return `posts/${params.postId}/${params.purpose}/${id}.${ext}`;
}

export async function createUploadUrl(input: CreateUploadUrlInput) {
  const { userId, purpose, fileName, fileType, fileSize, postId } = input;

  // Validate file type and size based on purpose
  const uploadRules: Record<UploadPurpose, UploadRule> = {
    avatar: {
      maxSize: 2 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      folder: "avatars",
    },
    "post-image": {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      folder: "posts/images",
    },
    "post-video": {
      maxSize: 200 * 1024 * 1024,
      allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
      folder: "posts/videos",
    },
    "post-file": {
      maxSize: 20 * 1024 * 1024,
      allowedTypes: [
        "application/pdf",
        "application/zip",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      folder: "posts/files",
    },
  } as const;

  const { maxSize, allowedTypes, folder } = uploadRules[purpose];

  if (!allowedTypes.includes(fileType)) {
    throw new Error("FILE_TYPE_NOT_ALLOWED");
  }

  if (fileSize > maxSize) {
    throw new Error("FILE_TOO_LARGE");
  }

  const key = buildObjectKey({
    userId,
    purpose,
    fileName,
    postId,
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  // Generate a presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 60,
  });

  return {
    uploadUrl,
    key,
    method: "PUT",
    headers: {
      "Content-Type": fileType,
    },
  };
}

type ConfirmUploadInput = {
  userId: string;
  key: string;
  purpose: UploadPurpose;
  postId?: number;
  fileName?: string;
};

export async function confirmUpload(input: ConfirmUploadInput) {
  const { userId, key, purpose, postId, fileName } = input;

  const headObject = await s3.send(
    new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    }),
  );

  if (!headObject.ContentLength || !headObject.ContentType) {
    throw new Error("INVALID_UPLOADED_FILE");
  }

  if (purpose === "avatar") {
    if (!key.startsWith(`users/${userId}/avatar/`)) {
      throw new Error("INVALID_FILE_KEY");
    }

    await prisma.profile.upsert({
      where: {
        userId: +userId,
      },
      update: {
        avatarKey: key,
      },
      create: {
        userId: +userId,
        avatarKey: key,
      },
    });

    const avatarUrl = await getFileUrl(key);

    return {
      type: "avatar",
      avatarUrl,
    };
  }

  if (!postId) {
    throw new Error("POST_ID_REQUIRED");
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId: +userId,
      status: "ACTIVE",
    },
  });

  if (!post) {
    throw new Error("POST_NOT_FOUND");
  }

  if (!key.startsWith(`posts/${postId}/`)) {
    throw new Error("INVALID_FILE_KEY");
  }

  const attachment = await prisma.postAttachment.create({
    data: {
      postId,
      fileName: fileName || "unknown",
      fileKey: key,
      mimeType: headObject.ContentType,
      fileSize: headObject.ContentLength,
      attachmentType:
        purpose === "post-image"
          ? "IMAGE"
          : purpose === "post-video"
            ? "VIDEO"
            : "FILE",
    },
  });

  return {
    type: "post-attachment",
    attachment,
  };
}
