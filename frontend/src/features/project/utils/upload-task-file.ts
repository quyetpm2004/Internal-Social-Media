import {
  uploadApi,
  type UploadPurpose,
} from "@/features/uploads/api/upload.api";
import type { TaskAttachmentType } from "@/features/project/types/task.type";

export type TaskUploadKind = "description" | "task" | "comment";

export class TaskUploadError extends Error {
  code: "type" | "size" | "failed";
  maxMb?: number;

  constructor(code: "type" | "size" | "failed", maxMb?: number) {
    super(code);
    this.code = code;
    this.maxMb = maxMb;
  }
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const FILE_TYPES = [
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
];

export const TASK_FILE_ACCEPT = [
  ...IMAGE_TYPES,
  ...VIDEO_TYPES,
  ...FILE_TYPES,
].join(",");

type ConfirmItem = {
  attachmentId?: number;
  key?: string;
  fileUrl?: string;
  attachment?: { id: number };
};

export type UploadedTaskFile = {
  id: number;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  attachmentType: TaskAttachmentType;
};

function purposeFor(file: File, kind: TaskUploadKind): UploadPurpose {
  if (kind === "description") return "task-image";
  const prefix = kind === "comment" ? "task-comment" : "task-file";
  if (file.type.startsWith("image/")) {
    return kind === "comment" ? "task-comment-image" : "task-file-image";
  }
  if (file.type.startsWith("video/")) {
    return kind === "comment" ? "task-comment-video" : "task-file-video";
  }
  return prefix === "task-comment" ? "task-comment-file" : "task-file";
}

function attachmentTypeFor(purpose: UploadPurpose): TaskAttachmentType {
  if (purpose.endsWith("image")) return "IMAGE";
  if (purpose.endsWith("video")) return "VIDEO";
  return "FILE";
}

function assertFile(file: File, purpose: UploadPurpose) {
  const image = purpose.endsWith("image");
  const video = purpose.endsWith("video");
  const allowed = image ? IMAGE_TYPES : video ? VIDEO_TYPES : FILE_TYPES;
  const maxMb = image ? 10 : video ? 100 : 20;
  if (!file.type || !allowed.includes(file.type)) {
    throw new TaskUploadError("type");
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new TaskUploadError("size", maxMb);
  }
}

function withMime(file: File) {
  if (file.type) return file;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : ext === "mp4"
              ? "video/mp4"
              : ext === "webm"
                ? "video/webm"
                : ext === "pdf"
                  ? "application/pdf"
                  : ext === "txt"
                    ? "text/plain"
                    : "";
  if (!mime) return file;
  return new File([file], file.name || `file.${ext}`, { type: mime });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadTaskFiles(
  input: File[],
  kind: TaskUploadKind,
): Promise<UploadedTaskFile[]> {
  const files = input.map(withMime);
  if (files.length === 0) return [];

  const payload = files.map((file) => {
    const purpose = purposeFor(file, kind);
    assertFile(file, purpose);
    return {
      purpose,
      fileName: file.name || "file",
      fileType: file.type,
      fileSize: file.size,
    };
  });

  const presign = await uploadApi.presign(payload);
  const items = presign.data.items;

  await Promise.all(
    items.map(async (item, index) => {
      const file = files[index];
      const uploadRes = await fetch(item.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new TaskUploadError("failed");
    }),
  );

  const confirmed = (await uploadApi.confirm(
    items.map((item, index) => ({
      purpose: payload[index].purpose,
      key: item.key,
      attachmentId: item.attachmentId ?? undefined,
    })),
  )) as { data: { items: ConfirmItem[] } };

  return files.map((file, index) => {
    const item = confirmed.data.items[index];
    const id = item?.attachmentId ?? item?.attachment?.id;
    if (!id || !item?.fileUrl || !item.key) {
      throw new TaskUploadError("failed");
    }
    return {
      id,
      fileKey: item.key,
      fileUrl: item.fileUrl,
      fileName: file.name || "file",
      mimeType: file.type,
      fileSize: file.size,
      attachmentType: attachmentTypeFor(payload[index].purpose),
    };
  });
}
