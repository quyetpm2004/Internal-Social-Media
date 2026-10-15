import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronDown,
  History,
  ListTree,
  MessageSquare,
  Paperclip,
  Pencil,
  ScrollText,
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
import type { TaskComment, TaskDetail, TaskPerson } from "@/features/project/types/task.type";
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
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusId, setStatusId] = useState<number | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    setTab("comments");
    setDraft("");
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

  const sendComment = async () => {
    if (!task) return;
    const content = draft.trim();
    if (!content) {
      toast.error(t("pages.projects.tasks.detail.commentRequired"));
      return;
    }
    setSending(true);
    try {
      const response = await projectApi.createTaskComment(
        projectId,
        task.id,
        content,
      );
      setComments((current) => [...current, response.data]);
      setDraft("");
      toast.success(t("pages.projects.tasks.detail.commentSent"));
    } catch (error) {
      toastApiError(error);
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
                        <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
                          {comment.content}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    {canComment
                      ? t("pages.projects.tasks.detail.commentHint")
                      : t("pages.projects.tasks.detail.commentDenied")}
                  </p>
                  <button
                    type="button"
                    disabled={!canComment || sending || !draft.trim()}
                    onClick={() => void sendComment()}
                    className="h-8 cursor-pointer rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
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
            <div className="py-10 text-center">
              <Paperclip className="mx-auto size-6 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {t("pages.projects.tasks.detail.attachmentsEmpty")}
              </p>
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
