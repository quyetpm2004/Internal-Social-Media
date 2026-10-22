import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  History,
  Image as ImageIcon,
  ListTree,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  ScrollText,
  Video,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { projectApi } from "@/features/project/api/project.api";
import {
  formatTaskCreated,
  priorityBadgeClass,
  taskStatusColor,
} from "@/features/project/components/tasks/task-display";
import type {
  TaskAttachment,
  TaskAttachmentGroups,
  TaskComment,
  TaskDetail,
  TaskPerson,
} from "@/features/project/types/task.type";
import {
  TASK_FILE_ACCEPT,
  TaskUploadError,
  formatFileSize,
  uploadTaskFiles,
} from "@/features/project/utils/upload-task-file";
import { formatProjectDate } from "@/features/project/utils/project-date";
import { toastApiError } from "@/features/project-template/utils/api-error";
import RichTextContent from "@/features/new-feed/components/RichTextContent";
import { isRichTextEmpty } from "@/features/new-feed/utils/rich-text";
import { getDefaultAvatarUrl } from "@/lib/utils";

type DetailTab = "comments" | "activity" | "history" | "children" | "attachments";

type TaskDetailViewProps = {
  projectId: number;
  task: TaskDetail | null;
  loading: boolean;
  canComment: boolean;
  onBack: () => void;
  onEdit: () => void;
  onOpenTask: (taskId: number) => void;
  onDeleted: () => void;
  onUpdated: (task: TaskDetail) => void;
};

function formatDateTime(value: string, language: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function PersonLine({ person, hint }: { person: TaskPerson; hint?: string }) {
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

function TaskStatusControl({
  task,
  value,
  saving,
  onChange,
}: {
  task: TaskDetail;
  value: number;
  saving: boolean;
  onChange: (statusId: number) => void;
}) {
  const options = task.statusOptions ?? [];
  const selected =
    options.find((status) => status.id === value) ?? task.status;
  const canMove =
    task.canChangeStatus &&
    options.some((status) => status.id !== task.statusId);

  if (!canMove) {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: taskStatusColor(selected) }}
        />
        {selected.name}
      </span>
    );
  }

  return (
    <label className="flex min-w-0 items-center gap-2">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: taskStatusColor(selected) }}
      />
      <span className="relative min-w-0 flex-1">
        <select
          value={value}
          disabled={saving}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pr-8 pl-2.5 text-sm font-medium text-slate-800 outline-none focus:border-primary disabled:cursor-wait"
        >
          {options.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  );
}

function CommentAttachments({ files }: { files: TaskAttachment[] }) {
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

function SideRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-start gap-3 border-b border-slate-100 py-3 text-sm last:border-b-0">
      <span className="pt-0.5 text-slate-500">{label}</span>
      <div className="min-w-0 text-slate-800">{children}</div>
    </div>
  );
}

export default function TaskDetailView({
  projectId,
  task,
  loading,
  canComment,
  onBack,
  onEdit,
  onOpenTask,
  onDeleted,
  onUpdated,
}: TaskDetailViewProps) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<DetailTab>("comments");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [attachmentPane, setAttachmentPane] = useState<"images" | "files">("images");
  const [attachmentGroups, setAttachmentGroups] =
    useState<TaskAttachmentGroups | null>(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentTaskId, setAttachmentTaskId] = useState<number | null>(
    task?.id ?? null,
  );
  const loadedAttachmentTaskId = useRef<number | null>(null);
  if ((task?.id ?? null) !== attachmentTaskId) {
    setAttachmentTaskId(task?.id ?? null);
    setAttachmentGroups(null);
    setAttachmentPane("images");
    loadedAttachmentTaskId.current = null;
  }
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusId, setStatusId] = useState<number | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    setTab("comments");
    setDraft("");
    setCommentFiles([]);
    if (!task) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setCommentsLoading(true);
      try {
        const response = await projectApi.getTaskComments(projectId, task.id);
        if (!cancelled) setComments(response.data);
      } catch (error) {
        if (!cancelled) {
          setComments([]);
          toastApiError(error);
        }
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, task]);

  useEffect(() => {
    loadedAttachmentTaskId.current = null;
    setAttachmentGroups(null);
  }, [task?.updatedAt]);

  useEffect(() => {
    if (tab !== "attachments" || !task || attachmentTaskId !== task.id) return;
    if (loadedAttachmentTaskId.current === task.id) return;
    let cancelled = false;
    const taskId = task.id;
    setAttachmentsLoading(true);
    void (async () => {
      try {
        const response = await projectApi.getTaskAttachments(projectId, taskId);
        if (cancelled) return;
        loadedAttachmentTaskId.current = taskId;
        setAttachmentGroups(response.data);
      } catch (error) {
        if (!cancelled) {
          loadedAttachmentTaskId.current = null;
          setAttachmentGroups({ images: [], files: [] });
          toastApiError(error);
        }
      } finally {
        if (!cancelled) setAttachmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, task, attachmentTaskId, projectId]);

  const commentPreviews = useMemo(
    () =>
      commentFiles.map((file) => ({
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
    [commentFiles],
  );

  useEffect(() => {
    return () => {
      commentPreviews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [commentPreviews]);

  const activity = useMemo(() => {
    if (!task) return [];
    const items: Array<{ id: string; at: string; text: string }> = [
      {
        id: "created",
        at: task.createdAt,
        text: t("pages.projects.tasks.detail.activityCreated"),
      },
    ];
    if (task.updatedAt && task.updatedAt !== task.createdAt) {
      items.push({
        id: "updated",
        at: task.updatedAt,
        text: t("pages.projects.tasks.detail.activityUpdated"),
      });
    }
    for (const comment of comments) {
      items.push({
        id: `comment-${comment.id}`,
        at: comment.createdAt,
        text: t("pages.projects.tasks.detail.activityCommented", {
          name: comment.author.fullName,
        }),
      });
    }
    return items.sort((left, right) => right.at.localeCompare(left.at));
  }, [task, comments, t]);

  const changeStatus = async (nextStatusId: number) => {
    if (!task || nextStatusId === task.statusId || statusSaving) return;
    setStatusId(nextStatusId);
    setStatusSaving(true);
    try {
      const response = await projectApi.updateTaskStatus(
        projectId,
        task.id,
        nextStatusId,
      );
      setStatusId(null);
      onUpdated(response.data);
      toast.success(t("pages.projects.tasks.detail.statusUpdated"));
    } catch (error) {
      setStatusId(null);
      toastApiError(error);
    } finally {
      setStatusSaving(false);
    }
  };

  const addCommentFiles = (list: FileList | null) => {
    const selected = Array.from(list ?? []);
    if (selected.length === 0) return;
    setCommentFiles((current) => {
      if (current.length + selected.length > 10) {
        toast.error(t("pages.projects.tasks.detail.commentFileLimit"));
        return current;
      }
      return [...current, ...selected];
    });
  };

  const sendComment = async () => {
    if (!task || sending) return;
    const content = draft.trim();
    if (!content && commentFiles.length === 0) {
      toast.error(t("pages.projects.tasks.detail.commentOrFile"));
      return;
    }
    setSending(true);
    try {
      const uploaded = await uploadTaskFiles(commentFiles, "comment");
      const response = await projectApi.createTaskComment(projectId, task.id, {
        content,
        attachmentIds: uploaded.map((file) => file.id),
      });
      setComments((current) => [...current, response.data]);
      setDraft("");
      setCommentFiles([]);
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

  const removeTask = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await projectApi.deleteTask(projectId, task.id);
      toast.success(t("pages.projects.tasks.deleted"));
      setConfirmDelete(false);
      onDeleted();
    } catch (error) {
      toastApiError(error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !task) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
        {t("common.processing")}
      </div>
    );
  }

  const empty = t("pages.projects.tasks.detail.emptyValue");
  const tabs: Array<{ id: DetailTab; label: string; icon: typeof MessageSquare; count?: number }> = [
    {
      id: "comments",
      label: t("pages.projects.tasks.detail.tabs.comments"),
      icon: MessageSquare,
      count: comments.length,
    },
    {
      id: "activity",
      label: t("pages.projects.tasks.detail.tabs.activity"),
      icon: ScrollText,
    },
    {
      id: "history",
      label: t("pages.projects.tasks.detail.tabs.history"),
      icon: History,
    },
    {
      id: "children",
      label: t("pages.projects.tasks.detail.tabs.children"),
      icon: ListTree,
      count: task.children.length,
    },
    {
      id: "attachments",
      label: t("pages.projects.tasks.detail.tabs.attachments"),
      icon: Paperclip,
    },
  ];

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="size-4" />
              {t("pages.projects.tasks.detail.back")}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                {task.code}
              </span>
              <span className="text-sm text-slate-500">{task.taskType.name}</span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{task.title}</h2>
          </div>
          {task.canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="size-4" />
              {t("pages.projects.tasks.detail.edit")}
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="mb-2 text-sm font-medium text-slate-500">
            {t("pages.projects.tasks.form.description")}
          </p>
          {task.description && !isRichTextEmpty(task.description) ? (
            <RichTextContent content={task.description} />
          ) : (
            <p className="text-sm text-slate-400">
              {t("pages.projects.tasks.detail.noDescription")}
            </p>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
                {item.count != null && item.count > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-500">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-5 py-4">
          {tab === "comments" && (
            <div className="space-y-4">
              {commentsLoading ? (
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
                            {formatDateTime(comment.createdAt, i18n.language)}
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
                {commentPreviews.length > 0 && (
                  <ul className="mb-2 flex flex-wrap gap-2">
                    {commentPreviews.map((item, index) => (
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
                            setCommentFiles((current) =>
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
                      void sendComment();
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
                    addCommentFiles(event.target.files);
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
                    addCommentFiles(event.target.files);
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
                    addCommentFiles(event.target.files);
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
                    disabled={
                      !canComment ||
                      sending ||
                      (!draft.trim() && commentFiles.length === 0)
                    }
                    onClick={() => void sendComment()}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending && <Loader2 className="size-3.5 animate-spin" />}
                    {t("pages.projects.tasks.detail.send")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "activity" && (
            <ul className="space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-slate-700">{item.text}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDateTime(item.at, i18n.language)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {tab === "history" && (
            <ul className="space-y-3 text-sm">
              <li className="flex items-start justify-between gap-4">
                <span className="text-slate-700">
                  {t("pages.projects.tasks.detail.historyCreated")}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatDateTime(task.createdAt, i18n.language)}
                </span>
              </li>
              {task.updatedAt !== task.createdAt && (
                <li className="flex items-start justify-between gap-4">
                  <span className="text-slate-700">
                    {t("pages.projects.tasks.detail.historyUpdated")}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDateTime(task.updatedAt, i18n.language)}
                  </span>
                </li>
              )}
              <p className="pt-2 text-xs text-slate-400">
                {t("pages.projects.tasks.detail.historyHint")}
              </p>
            </ul>
          )}

          {tab === "children" &&
            (task.children.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {t("pages.projects.tasks.detail.childrenEmpty")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {task.children.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => onOpenTask(child.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="mr-2 font-mono text-xs text-slate-400">
                          {child.code}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {child.title}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: taskStatusColor(child.status),
                            backgroundColor: `${taskStatusColor(child.status)}18`,
                          }}
                        >
                          {child.status.name}
                        </span>
                        {child.estimatedMinutes != null && (
                          <span className="text-xs text-slate-400">
                            {t("pages.projects.tasks.detail.minutes", {
                              count: child.estimatedMinutes,
                            })}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "attachments" && (
            <div>
              <div className="mb-4 flex gap-4 border-b border-slate-100">
                {(["images", "files"] as const).map((pane) => (
                  <button
                    key={pane}
                    type="button"
                    onClick={() => setAttachmentPane(pane)}
                    className={`cursor-pointer border-b-2 pb-2 text-sm font-medium ${
                      attachmentPane === pane
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t(`pages.projects.tasks.detail.attachmentTabs.${pane}`)}
                  </button>
                ))}
              </div>
              {attachmentsLoading || !attachmentGroups ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  {t("common.processing")}
                </p>
              ) : attachmentPane === "images" ? (
                attachmentGroups.images.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    {t("pages.projects.tasks.detail.imagesEmpty")}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {attachmentGroups.images.map((file) => (
                      <a
                        key={file.id}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="aspect-video w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )
              ) : attachmentGroups.files.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  {t("pages.projects.tasks.detail.filesEmpty")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {attachmentGroups.files.map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
                      >
                        {file.attachmentType === "IMAGE" && file.fileUrl ? (
                          <img
                            src={file.fileUrl}
                            alt=""
                            className="size-10 rounded-md object-cover"
                          />
                        ) : file.attachmentType === "VIDEO" ? (
                          <Video className="size-5 text-slate-400" />
                        ) : (
                          <FileText className="size-5 text-slate-400" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {file.fileName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatFileSize(file.fileSize)}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
        <SideRow label={t("pages.projects.tasks.form.taskType")}>
          {task.taskType.name}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.workflow")}>
          {task.workflow.name}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.status")}>
          <TaskStatusControl
            task={task}
            value={statusId ?? task.statusId}
            saving={statusSaving}
            onChange={(nextStatusId) => void changeStatus(nextStatusId)}
          />
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.priority")}>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadgeClass[task.priority]}`}
          >
            {t(`pages.projects.tasks.priority.${task.priority}`)}
          </span>
        </SideRow>
        <SideRow label={t("pages.projects.tasks.assignee")}>
          {task.assignees.length === 0 ? (
            <span className="text-slate-400">{empty}</span>
          ) : (
            <ul className="space-y-2">
              {task.assignees.map((assignee) => (
                <li key={`${assignee.projectRole.id}-${assignee.userId}`}>
                  <PersonLine person={assignee} hint={assignee.projectRole.name} />
                </li>
              ))}
            </ul>
          )}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.reporter")}>
          {task.reporter ? (
            <PersonLine person={task.reporter} />
          ) : (
            <span className="text-slate-400">{empty}</span>
          )}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.reviewer")}>
          {task.reviewers.length === 0 ? (
            <span className="text-slate-400">{empty}</span>
          ) : (
            <ul className="space-y-2">
              {task.reviewers.map((reviewer) => (
                <li key={reviewer.userId}>
                  <PersonLine person={reviewer} />
                </li>
              ))}
            </ul>
          )}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.parent")}>
          {task.parent ? (
            <button
              type="button"
              onClick={() => onOpenTask(task.parent!.id)}
              className="cursor-pointer text-left text-primary hover:underline"
            >
              <span className="font-mono text-xs">{task.parent.code}</span>
              <span className="mt-0.5 block">{task.parent.title}</span>
            </button>
          ) : (
            <span className="text-slate-400">{empty}</span>
          )}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.startDate")}>
          {task.startDate
            ? formatProjectDate(task.startDate, i18n.language)
            : empty}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.dueDate")}>
          {task.dueDate ? formatProjectDate(task.dueDate, i18n.language) : empty}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.estimate")}>
          {task.estimatedMinutes == null
            ? empty
            : t("pages.projects.tasks.detail.minutes", {
                count: task.estimatedMinutes,
              })}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.createdAt")}>
          {formatTaskCreated(task.createdAt, i18n.language)}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.detail.updatedAt")}>
          {formatDateTime(task.updatedAt, i18n.language)}
        </SideRow>
        {task.canEdit && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="my-3 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            {t("pages.projects.tasks.detail.deleteTask")}
          </button>
        )}
      </aside>

      <ConfirmModal
        open={confirmDelete}
        title={t("pages.projects.tasks.form.deleteTitle")}
        description={t("pages.projects.tasks.form.deleteDescription", {
          name: `${task.code} ${task.title}`,
        })}
        confirmText={t("pages.projects.tasks.form.delete")}
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void removeTask()}
      />
    </div>
  );
}
