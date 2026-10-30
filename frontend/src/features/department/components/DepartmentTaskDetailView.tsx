import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  History,
  ListTree,
  MessageSquare,
  Paperclip,
  Pencil,
  Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { departmentTaskApi } from "@/features/department/api/department-task.api";
import type { DepartmentTaskDetail } from "@/features/department/types/department-task.type";
import RichTextContent from "@/features/new-feed/components/RichTextContent";
import { isRichTextEmpty } from "@/features/new-feed/utils/rich-text";
import {
  PersonLine,
  SideRow,
  TaskCommentsPanel,
} from "@/features/project/components/tasks/task-detail-parts";
import {
  formatTaskCreated,
  formatTaskDateTime,
  priorityBadgeClass,
  taskStatusColor,
} from "@/features/project/components/tasks/task-display";
import type { TaskAttachmentGroups } from "@/features/project/types/task.type";
import { formatProjectDate } from "@/features/project/utils/project-date";
import { formatFileSize } from "@/features/project/utils/upload-task-file";
import { toastApiError } from "@/features/project-template/utils/api-error";

type DetailTab = "comments" | "history" | "children" | "attachments";

type DepartmentTaskDetailViewProps = {
  task: DepartmentTaskDetail | null;
  loading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onOpenTask: (taskId: number) => void;
  onDeleted: () => void;
  onUpdated: (task: DepartmentTaskDetail) => void;
};

type LoadedAttachments = {
  taskId: number;
  stamp: string;
  groups: TaskAttachmentGroups;
};

function StatusControl({
  task,
  saving,
  onChange,
}: {
  task: DepartmentTaskDetail;
  saving: boolean;
  onChange: (statusId: number) => void;
}) {
  const selected = task.status;

  if (!task.canChangeStatus || task.statusOptions.length < 2) {
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
          value={task.statusId}
          disabled={saving}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pr-8 pl-2.5 text-sm font-medium text-slate-800 outline-none focus:border-primary disabled:cursor-wait"
        >
          {task.statusOptions.map((status) => (
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

export default function DepartmentTaskDetailView({
  task,
  loading,
  onBack,
  onEdit,
  onOpenTask,
  onDeleted,
  onUpdated,
}: DepartmentTaskDetailViewProps) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<DetailTab>("comments");
  const [attachmentPane, setAttachmentPane] = useState<"images" | "files">(
    "images",
  );
  const [loaded, setLoaded] = useState<LoadedAttachments | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const taskId = task?.id ?? null;
  const stamp = task?.updatedAt ?? "";
  const attachmentGroups =
    loaded && loaded.taskId === taskId && loaded.stamp === stamp
      ? loaded.groups
      : null;

  useEffect(() => {
    if (tab !== "attachments" || taskId === null || attachmentGroups) return;
    let cancelled = false;
    departmentTaskApi
      .listAttachments(taskId)
      .then((response) => {
        if (!cancelled) setLoaded({ taskId, stamp, groups: response.data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoaded({ taskId, stamp, groups: { images: [], files: [] } });
        toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, taskId, stamp, attachmentGroups]);

  const changeStatus = async (nextStatusId: number) => {
    if (!task || nextStatusId === task.statusId || statusSaving) return;
    setStatusSaving(true);
    try {
      const response = await departmentTaskApi.updateStatus(
        task.id,
        nextStatusId,
      );
      onUpdated(response.data);
      toast.success(t("pages.projects.tasks.detail.statusUpdated"));
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusSaving(false);
    }
  };

  const removeTask = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await departmentTaskApi.remove(task.id);
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
  const tabs: Array<{
    id: DetailTab;
    label: string;
    icon: typeof MessageSquare;
    count?: number;
  }> = [
    {
      id: "comments",
      label: t("pages.projects.tasks.detail.tabs.comments"),
      icon: MessageSquare,
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
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {task.title}
            </h2>
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
            <TaskCommentsPanel
              key={task.id}
              canComment
              fetchComments={() =>
                departmentTaskApi.listComments(task.id).then((r) => r.data)
              }
              postComment={(payload) =>
                departmentTaskApi
                  .createComment(task.id, payload)
                  .then((r) => r.data)
              }
            />
          )}

          {tab === "history" && (
            <ul className="space-y-3 text-sm">
              <li className="flex items-start justify-between gap-4">
                <span className="text-slate-700">
                  {t("pages.projects.tasks.detail.historyCreated")}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatTaskDateTime(task.createdAt, i18n.language)}
                </span>
              </li>
              {task.updatedAt !== task.createdAt && (
                <li className="flex items-start justify-between gap-4">
                  <span className="text-slate-700">
                    {t("pages.projects.tasks.detail.historyUpdated")}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatTaskDateTime(task.updatedAt, i18n.language)}
                  </span>
                </li>
              )}
              <li className="pt-2 text-xs text-slate-400">
                {t("pages.projects.tasks.detail.historyHint")}
              </li>
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
              {!attachmentGroups ? (
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
        <SideRow label={t("pages.projects.tasks.form.workflow")}>
          {task.workflow.name}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.status")}>
          <StatusControl
            task={task}
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
        <SideRow label={t("department.fields.assignees")}>
          {task.assignee ? (
            <PersonLine person={task.assignee} />
          ) : (
            <span className="text-slate-400">
              {t("department.tasks.unassigned")}
            </span>
          )}
        </SideRow>
        <SideRow label={t("pages.projects.tasks.form.reporter")}>
          {task.reporter ? (
            <PersonLine person={task.reporter} />
          ) : (
            <span className="text-slate-400">{empty}</span>
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
          {formatTaskDateTime(task.updatedAt, i18n.language)}
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
