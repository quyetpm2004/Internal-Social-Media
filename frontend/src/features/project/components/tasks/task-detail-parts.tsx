import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Video,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatTaskDateTime } from "@/features/project/components/tasks/task-display";
import type {
  TaskAttachment,
  TaskComment,
  TaskPerson,
} from "@/features/project/types/task.type";
import {
  TASK_FILE_ACCEPT,
  TaskUploadError,
  formatFileSize,
  uploadTaskFiles,
} from "@/features/project/utils/upload-task-file";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { getDefaultAvatarUrl } from "@/lib/utils";

const MAX_COMMENT_FILES = 10;

export function PersonLine({
  person,
  hint,
}: {
  person: TaskPerson;
  hint?: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <img
        src={person.avatarUrl || getDefaultAvatarUrl(person.fullName)}
        alt=""
        className="size-6 shrink-0 rounded-full object-cover"
      />
      <span className="min-w-0">
        <span className="block truncate">{person.fullName}</span>
        {hint && (
          <span className="block truncate text-xs text-slate-400">{hint}</span>
        )}
      </span>
    </span>
  );
}

export function SideRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-start gap-3 border-b border-slate-100 py-3 text-sm last:border-b-0">
      <span className="pt-0.5 text-slate-500">{label}</span>
      <div className="min-w-0 text-slate-800">{children}</div>
    </div>
  );
}

export function CommentAttachments({ files }: { files: TaskAttachment[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mt-2 space-y-2">
      {files.some((file) => file.attachmentType === "IMAGE" && file.fileUrl) && (
        <div className="flex flex-wrap gap-2">
          {files
            .filter((file) => file.attachmentType === "IMAGE" && file.fileUrl)
            .map((file) => (
              <a
                key={file.id}
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-slate-200"
              >
                <img
                  src={file.fileUrl}
                  alt={file.fileName}
                  className="max-h-48 max-w-full object-cover"
                />
              </a>
            ))}
        </div>
      )}
      {files
        .filter((file) => file.attachmentType === "VIDEO" && file.fileUrl)
        .map((file) => (
          <video
            key={file.id}
            src={file.fileUrl}
            controls
            className="max-h-64 max-w-full rounded-lg bg-black"
          />
        ))}
      {files
        .filter((file) => file.attachmentType === "FILE")
        .map((file) => (
          <a
            key={file.id}
            href={file.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileText className="size-4 shrink-0 text-slate-400" />
            <span className="min-w-0 truncate">{file.fileName}</span>
            <span className="shrink-0 text-xs text-slate-400">
              {formatFileSize(file.fileSize)}
            </span>
          </a>
        ))}
    </div>
  );
}

type TaskCommentsPanelProps = {
  canComment: boolean;
  fetchComments: () => Promise<TaskComment[]>;
  postComment: (payload: {
    content: string;
    attachmentIds: number[];
  }) => Promise<TaskComment>;
};

export function TaskCommentsPanel({
  canComment,
  fetchComments,
  postComment,
}: TaskCommentsPanelProps) {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchRef = useRef(fetchComments);

  useEffect(() => {
    let cancelled = false;
    fetchRef
      .current()
      .then((items) => {
        if (!cancelled) setComments(items);
      })
      .catch((error: unknown) => {
        if (!cancelled) toastApiError(error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url:
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : "",
        kind: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : "file",
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [previews]);

  const addFiles = (list: FileList | null) => {
    const selected = Array.from(list ?? []);
    if (selected.length === 0) return;
    setFiles((current) => {
      if (current.length + selected.length > MAX_COMMENT_FILES) {
        toast.error(t("pages.projects.tasks.detail.commentFileLimit"));
        return current;
      }
      return [...current, ...selected];
    });
  };

  const send = async () => {
    if (sending) return;
    const content = draft.trim();
    if (!content && files.length === 0) {
      toast.error(t("pages.projects.tasks.detail.commentOrFile"));
      return;
    }
    setSending(true);
    try {
      const uploaded = await uploadTaskFiles(files, "comment");
      const created = await postComment({
        content,
        attachmentIds: uploaded.map((file) => file.id),
      });
      setComments((current) => [...current, created]);
      setDraft("");
      setFiles([]);
      toast.success(t("pages.projects.tasks.detail.commentSent"));
    } catch (error) {
      if (error instanceof TaskUploadError) {
        toast.error(
          t(`pages.projects.tasks.upload.${error.code}`, { max: error.maxMb }),
        );
      } else {
        toastApiError(error);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-sm text-slate-500">{t("common.processing")}</p>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {t("pages.projects.tasks.detail.commentsEmpty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <img
                src={
                  comment.author.avatarUrl ||
                  getDefaultAvatarUrl(comment.author.fullName)
                }
                alt=""
                className="size-8 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {comment.author.fullName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTaskDateTime(comment.createdAt, i18n.language)}
                  </span>
                </div>
                {comment.content.trim() && (
                  <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
                    {comment.content}
                  </p>
                )}
                <CommentAttachments files={comment.attachments ?? []} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        {previews.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {previews.map((item, index) => (
              <li
                key={item.key}
                className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                {item.kind === "image" ? (
                  <img src={item.url} alt="" className="h-16 w-16 object-cover" />
                ) : item.kind === "video" ? (
                  <video src={item.url} className="h-16 w-24 object-cover" />
                ) : (
                  <span className="flex h-16 max-w-40 items-center gap-1 px-2 text-xs text-slate-600">
                    <FileText className="size-4 shrink-0" />
                    <span className="truncate">{item.file.name}</span>
                  </span>
                )}
                <button
                  type="button"
                  title={t("pages.projects.tasks.detail.removeAttachment")}
                  onClick={() =>
                    setFiles((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="absolute top-1 right-1 cursor-pointer rounded-full bg-white/90 p-0.5 text-slate-500 hover:text-slate-800"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <textarea
          value={draft}
          disabled={!canComment || sending}
          rows={3}
          placeholder={t("pages.projects.tasks.detail.commentPlaceholder")}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          className="w-full resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={TASK_FILE_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              title={t("pages.projects.tasks.detail.attachImage")}
              disabled={!canComment || sending}
              onClick={() => imageInputRef.current?.click()}
              className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-white disabled:opacity-40"
            >
              <ImageIcon className="size-4" />
            </button>
            <button
              type="button"
              title={t("pages.projects.tasks.detail.attachVideo")}
              disabled={!canComment || sending}
              onClick={() => videoInputRef.current?.click()}
              className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-white disabled:opacity-40"
            >
              <Video className="size-4" />
            </button>
            <button
              type="button"
              title={t("pages.projects.tasks.detail.attachFile")}
              disabled={!canComment || sending}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-white disabled:opacity-40"
            >
              <Paperclip className="size-4" />
            </button>
            <p className="truncate text-xs text-slate-400">
              {canComment
                ? t("pages.projects.tasks.detail.commentHint")
                : t("pages.projects.tasks.detail.commentDenied")}
            </p>
          </div>
          <button
            type="button"
            disabled={!canComment || sending || (!draft.trim() && files.length === 0)}
            onClick={() => void send()}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending && <Loader2 className="size-3.5 animate-spin" />}
            {t("pages.projects.tasks.detail.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
