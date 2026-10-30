import { Prisma, WorkflowStatusCategory } from "@prisma/client";
import { getFileUrl } from "@/modules/file/file.service";
import {
  applyDescriptionImageUrls,
  prepareDescriptionForStorage,
} from "@/modules/project/task-description";
import * as projectTaskRepository from "@/modules/project/project-task.repository";
import { AppError } from "@/shared/errors/app-error";

const AVATAR_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function avatarUrlMap(keys: Array<string | null | undefined>) {
  const uniqueKeys = [
    ...new Set(keys.filter((key): key is string => Boolean(key))),
  ];
  const entries = await Promise.all(
    uniqueKeys.map(
      async (key) =>
        [key, await getFileUrl(key, AVATAR_URL_TTL_SECONDS)] as const,
    ),
  );
  return new Map(entries);
}

export function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function toDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function resolveCompletedAt(
  nextCategory: WorkflowStatusCategory,
  currentCategory: WorkflowStatusCategory | null,
  currentCompletedAt: Date | null,
) {
  if (nextCategory !== WorkflowStatusCategory.DONE) return null;
  if (currentCategory === WorkflowStatusCategory.DONE && currentCompletedAt) {
    return currentCompletedAt;
  }
  return new Date();
}

export function attachmentFailure(error: unknown): never {
  if (error instanceof AppError) throw error;
  const message = error instanceof Error ? error.message : "";
  if (message.includes("INVALID_DESCRIPTION_IMAGE")) {
    throw new AppError(400, "Ảnh trong mô tả không hợp lệ hoặc chưa tải xong");
  }
  if (message.includes("INVALID_TASK_FILE") || message.includes("INVALID_COMMENT_FILE")) {
    throw new AppError(400, "Tệp đính kèm không hợp lệ hoặc chưa tải xong");
  }
  throw error;
}

export async function storedDescription(
  tx: Prisma.TransactionClient,
  userId: number,
  taskId: number | null,
  description: string | null,
) {
  const prepared = prepareDescriptionForStorage(description);
  if (prepared.keys.length === 0) {
    return { html: prepared.html, imageIds: [] as number[] };
  }

  const rows = await projectTaskRepository.findDescriptionImageIds(
    tx,
    userId,
    taskId,
    prepared.keys,
  );
  if (rows.length !== prepared.keys.length) {
    throw new AppError(400, "Ảnh trong mô tả không hợp lệ hoặc chưa tải xong");
  }

  const byKey = new Map(rows.map((row) => [row.fileKey, row.id]));
  return {
    html: prepared.html,
    imageIds: prepared.keys.map((key) => byKey.get(key)!),
  };
}

export function assertDates(startDate: string | null, dueDate: string | null) {
  if (startDate && !isCalendarDate(startDate)) {
    throw new AppError(400, "Ngày không hợp lệ");
  }
  if (dueDate && !isCalendarDate(dueDate)) {
    throw new AppError(400, "Ngày không hợp lệ");
  }
  if (startDate && dueDate && dueDate < startDate) {
    throw new AppError(400, "Hạn chót không được trước ngày bắt đầu");
  }
}

export function isForeignKeyError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

export async function presentDescription(html: string | null) {
  if (!html) return html;
  const keys = [
    ...html.matchAll(/\bdata-file-key\s*=\s*"([^"]+)"/gi),
  ].map((match) => match[1]);
  const urls = await avatarUrlMap(keys);
  return applyDescriptionImageUrls(html, urls);
}

export type StoredFile = {
  id: number;
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  attachmentType: "IMAGE" | "VIDEO" | "FILE";
};

export function mapStoredFile(file: StoredFile, urls: Map<string, string>) {
  return {
    id: file.id,
    fileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    attachmentType: file.attachmentType,
    fileUrl: urls.get(file.fileKey) ?? "",
  };
}

export function mapTaskComment(
  comment: {
    id: number;
    content: string;
    createdAt: Date;
    user: {
      id: number;
      fullName: string;
      profile: { avatarKey: string | null } | null;
    };
    attachments: StoredFile[];
  },
  avatarUrls: Map<string, string>,
  fileUrls: Map<string, string>,
) {
  const avatarKey = comment.user.profile?.avatarKey;
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: {
      userId: comment.user.id,
      fullName: comment.user.fullName,
      avatarUrl: avatarKey ? (avatarUrls.get(avatarKey) ?? null) : null,
    },
    attachments: comment.attachments.map((file) => mapStoredFile(file, fileUrls)),
  };
}
