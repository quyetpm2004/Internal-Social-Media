import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Paperclip, Plus, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { departmentTaskApi } from "@/features/department/api/department-task.api";
import type { TaskPriority } from "@/features/department/types/department.type";
import type {
  DepartmentTaskConfig,
  DepartmentTaskDetail,
  DepartmentTaskList,
  SaveDepartmentTaskPayload,
} from "@/features/department/types/department-task.type";
import RichTextEditor from "@/features/new-feed/components/RichTextEditor";
import {
  isRichTextEmpty,
  sanitizePostHtml,
} from "@/features/new-feed/utils/rich-text";
import { compactDescriptionImages } from "@/features/project/utils/compact-description-images";
import {
  TASK_FILE_ACCEPT,
  TaskUploadError,
  formatFileSize,
  uploadTaskFiles,
} from "@/features/project/utils/upload-task-file";
import {
  getApiErrorMessages,
  toastApiError,
} from "@/features/project-template/utils/api-error";

const FORM_ID = "department-task-form";
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const MAX_CHILDREN = 20;
const MAX_ATTACHMENTS = 20;

type ChildDraft = {
  key: string;
  title: string;
};

type DraftFile = {
  id: number;
  fileName: string;
  fileSize: number;
};

type TaskDraft = {
  title: string;
  description: string;
  statusId: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  estimatedMinutes: string;
  parentId: number | null;
  assigneeId: string;
  newChildren: ChildDraft[];
  files: DraftFile[];
};

type FieldErrors = Partial<Record<string, string>>;

type LoadedData = {
  list: DepartmentTaskList;
  config: DepartmentTaskConfig;
};

type DepartmentTaskFormModalProps = {
  open: boolean;
  task?: DepartmentTaskDetail;
  presetAssigneeId?: number;
  onClose: () => void;
  onSaved: () => void;
};

function parseEstimate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return "invalid" as const;
  const minutes = Number(trimmed);
  if (minutes > 1_000_000) return "invalid" as const;
  return minutes;
}

function TaskForm({
  data,
  task,
  presetAssigneeId,
  onClose,
  onSaved,
}: Omit<DepartmentTaskFormModalProps, "open"> & { data: LoadedData }) {
  const { t } = useTranslation();
  const { list, config } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const childCounter = useRef(0);

  const [draft, setDraft] = useState<TaskDraft>(() =>
    task
      ? {
          title: task.title,
          description: task.description ?? "",
          statusId: String(task.statusId),
          priority: task.priority,
          startDate: task.startDate ?? "",
          dueDate: task.dueDate ?? "",
          estimatedMinutes:
            task.estimatedMinutes == null ? "" : String(task.estimatedMinutes),
          parentId: task.parent?.id ?? null,
          assigneeId: task.assignee ? String(task.assignee.userId) : "",
          newChildren: [],
          files: task.attachments.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize,
          })),
        }
      : {
          title: "",
          description: "",
          statusId: String(
            config.statuses.find((status) => status.isInitial)?.id ?? "",
          ),
          priority: "MEDIUM",
          startDate: "",
          dueDate: "",
          estimatedMinutes: "",
          parentId: null,
          assigneeId: presetAssigneeId ? String(presetAssigneeId) : "",
          newChildren: [],
          files: [],
        },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [parentQuery, setParentQuery] = useState("");
  const [parentOpen, setParentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [descriptionUploading, setDescriptionUploading] = useState(false);

  const busy = saving || uploadingFiles || descriptionUploading;

  const patch = (partial: Partial<TaskDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const parentMatches = list.tasks
    .filter((item) => {
      const keyword = parentQuery.trim().toLowerCase();
      return (
        item.id !== task?.id &&
        keyword &&
        (item.code.toLowerCase().includes(keyword) ||
          item.title.toLowerCase().includes(keyword))
      );
    })
    .slice(0, 8);
  const parentTask = list.tasks.find((item) => item.id === draft.parentId);

  const validate = (): SaveDepartmentTaskPayload | null => {
    const next: FieldErrors = {};
    const title = draft.title.trim();
    if (!title) next.title = t("pages.projects.tasks.form.titleRequired");
    if (!draft.statusId) {
      next.statusId = t("pages.projects.tasks.form.statusRequired");
    }
    if (draft.startDate && draft.dueDate && draft.dueDate < draft.startDate) {
      next.dates = t("pages.projects.tasks.form.dateOrder");
    }
    const estimate = parseEstimate(draft.estimatedMinutes);
    if (estimate === "invalid") {
      next.estimate = t("pages.projects.tasks.form.estimateInvalid");
    }
    if (draft.newChildren.length > MAX_CHILDREN) {
      next.children = t("pages.projects.tasks.form.childLimit");
    } else if (draft.newChildren.some((child) => !child.title.trim())) {
      next.children = t("pages.projects.tasks.form.childTitleRequired");
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || estimate === "invalid") return null;

    return {
      title,
      description: isRichTextEmpty(draft.description)
        ? null
        : compactDescriptionImages(sanitizePostHtml(draft.description)),
      statusId: Number(draft.statusId),
      priority: draft.priority,
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
      estimatedMinutes: estimate,
      parentTaskId: draft.parentId,
      assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
      children: draft.newChildren.map((child) => ({
        title: child.title.trim(),
        estimatedMinutes: null,
      })),
      attachmentIds: draft.files.map((file) => file.id),
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const payload = validate();
    if (!payload) return;
    setSaving(true);
    try {
      if (task) {
        await departmentTaskApi.update(task.id, payload);
        toast.success(t("pages.projects.tasks.updated"));
      } else {
        await departmentTaskApi.create(payload);
        toast.success(t("pages.projects.tasks.created"));
      }
      onSaved();
      onClose();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const uploadErrorMessage = (error: unknown) => {
    if (error instanceof TaskUploadError) {
      return t(`pages.projects.tasks.upload.${error.code}`, {
        max: error.maxMb,
      });
    }
    return (
      getApiErrorMessages(error)[0] || t("pages.projects.tasks.upload.failed")
    );
  };

  const uploadDescriptionImage = async (file: File) => {
    try {
      const [uploaded] = await uploadTaskFiles([file], "description");
      if (!uploaded?.fileUrl || !uploaded.fileKey) {
        throw new TaskUploadError("failed");
      }
      return {
        src: uploaded.fileUrl,
        fileKey: uploaded.fileKey,
        alt: uploaded.fileName,
      };
    } catch (error) {
      throw new Error(uploadErrorMessage(error));
    }
  };

  const addFiles = async (selectedList: FileList | null) => {
    const selected = Array.from(selectedList ?? []);
    if (selected.length === 0) return;
    if (draft.files.length + selected.length > MAX_ATTACHMENTS) {
      toast.error(t("pages.projects.tasks.form.attachmentLimit"));
      return;
    }
    setUploadingFiles(true);
    try {
      const uploaded = await uploadTaskFiles(selected, "task");
      setDraft((current) => ({
        ...current,
        files: [...current.files, ...uploaded],
      }));
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    } finally {
      setUploadingFiles(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        task
          ? t("pages.projects.tasks.form.editTitle")
          : t("pages.projects.tasks.form.createTitle")
      }
      size="xl"
      className="max-h-[90vh] max-w-[min(96rem,calc(100vw-2rem))]"
      bodyClassName="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      formId={FORM_ID}
      confirmText={t("pages.projects.tasks.form.save")}
      loading={busy}
    >
      <form
        id={FORM_ID}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="space-y-4">
          <Field label={t("pages.projects.tasks.form.parent")}>
            {parentTask ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <p className="min-w-0 text-sm text-slate-800">
                  <span className="font-semibold text-slate-500">
                    {parentTask.code}
                  </span>{" "}
                  {parentTask.title}
                </p>
                <button
                  type="button"
                  onClick={() => patch({ parentId: null })}
                  className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100"
                  aria-label={t("common.cancel")}
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={parentQuery}
                  placeholder={t("pages.projects.tasks.form.parentPlaceholder")}
                  className="pl-9"
                  onFocus={() => setParentOpen(true)}
                  onChange={(event) => {
                    setParentQuery(event.target.value);
                    setParentOpen(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setParentOpen(false), 150);
                  }}
                />
                {parentOpen && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {parentMatches.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-500">
                        {parentQuery.trim()
                          ? t("pages.projects.tasks.form.parentEmpty")
                          : t("pages.projects.tasks.form.parentPlaceholder")}
                      </p>
                    ) : (
                      parentMatches.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            patch({ parentId: item.id });
                            setParentQuery("");
                            setParentOpen(false);
                          }}
                          className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="font-semibold text-slate-500">
                            {item.code}
                          </span>{" "}
                          {item.title}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </Field>

          <Field
            label={t("pages.projects.tasks.form.title")}
            htmlFor="department-task-title"
            required
            error={errors.title}
          >
            <Input
              id="department-task-title"
              value={draft.title}
              maxLength={200}
              placeholder={t("pages.projects.tasks.form.titlePlaceholder")}
              aria-invalid={Boolean(errors.title)}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                {t("pages.projects.tasks.form.existingChildren")}
              </p>
              <button
                type="button"
                onClick={() => {
                  childCounter.current += 1;
                  patch({
                    newChildren: [
                      ...draft.newChildren,
                      { key: `new-${childCounter.current}`, title: "" },
                    ],
                  });
                }}
                className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary"
              >
                <Plus className="size-4" />
                {t("pages.projects.tasks.form.addChild")}
              </button>
            </div>
            {task?.children.map((child) => (
              <p
                key={child.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <span className="mr-2 font-mono text-xs text-slate-400">
                  {child.code}
                </span>
                {child.title}
              </p>
            ))}
            {draft.newChildren.map((child) => (
              <div key={child.key} className="flex gap-2">
                <Input
                  value={child.title}
                  maxLength={200}
                  placeholder={t("pages.projects.tasks.form.childTitle")}
                  onChange={(event) =>
                    patch({
                      newChildren: draft.newChildren.map((item) =>
                        item.key === child.key
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      newChildren: draft.newChildren.filter(
                        (item) => item.key !== child.key,
                      ),
                    })
                  }
                  className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label={t("common.cancel")}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {errors.children && (
              <p className="text-xs text-red-600">{errors.children}</p>
            )}
          </div>

          <Field label={t("pages.projects.tasks.form.description")}>
            <RichTextEditor
              value={draft.description}
              onChange={(html) => patch({ description: html })}
              allowMentionAll={false}
              placeholder={t("pages.projects.tasks.form.description")}
              minRows={4}
              extended
              uploadImage={uploadDescriptionImage}
              onUploadingChange={setDescriptionUploading}
            />
          </Field>

          <Field label={t("pages.projects.tasks.form.attachments")}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={TASK_FILE_ACCEPT}
              className="hidden"
              onChange={(event) => {
                void addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploadingFiles}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {uploadingFiles ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Paperclip className="size-4" />
              )}
              {t("pages.projects.tasks.form.addAttachment")}
            </button>
            {draft.files.length > 0 && (
              <ul className="mt-2 space-y-2">
                {draft.files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">
                        {file.fileName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatFileSize(file.fileSize)}
                      </span>
                    </span>
                    <button
                      type="button"
                      title={t("pages.projects.tasks.form.removeAttachment")}
                      onClick={() =>
                        patch({
                          files: draft.files.filter(
                            (item) => item.id !== file.id,
                          ),
                        })
                      }
                      className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
        </div>

        <div className="space-y-4">
          <Field
            label={t("pages.projects.tasks.form.workflow")}
            htmlFor="department-task-workflow"
          >
            <Select id="department-task-workflow" value="fixed" disabled>
              <option value="fixed">{config.workflow.name}</option>
            </Select>
          </Field>

          <Field
            label={t("pages.projects.tasks.form.status")}
            htmlFor="department-task-status"
            required
            error={errors.statusId}
          >
            <Select
              id="department-task-status"
              value={draft.statusId}
              aria-invalid={Boolean(errors.statusId)}
              onChange={(event) => patch({ statusId: event.target.value })}
            >
              <option value="">
                {t("pages.projects.tasks.form.pickStatus")}
              </option>
              {config.statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("department.fields.assignees")}
            htmlFor="department-task-assignee"
          >
            <Select
              id="department-task-assignee"
              value={draft.assigneeId}
              onChange={(event) => patch({ assigneeId: event.target.value })}
            >
              <option value="">{t("department.tasks.unassigned")}</option>
              {list.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("pages.projects.tasks.form.priority")}
            htmlFor="department-task-priority"
          >
            <Select
              id="department-task-priority"
              value={draft.priority}
              onChange={(event) =>
                patch({ priority: event.target.value as TaskPriority })
              }
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`pages.projects.tasks.priority.${priority}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("pages.projects.tasks.form.startDate")}
            htmlFor="department-task-start"
            error={errors.dates}
          >
            <Input
              id="department-task-start"
              type="date"
              value={draft.startDate}
              onChange={(event) => patch({ startDate: event.target.value })}
            />
          </Field>
          <Field
            label={t("pages.projects.tasks.form.dueDate")}
            htmlFor="department-task-due"
          >
            <Input
              id="department-task-due"
              type="date"
              value={draft.dueDate}
              min={draft.startDate || undefined}
              aria-invalid={Boolean(errors.dates)}
              onChange={(event) => patch({ dueDate: event.target.value })}
            />
          </Field>
          <Field
            label={t("pages.projects.tasks.form.estimate")}
            htmlFor="department-task-estimate"
            error={errors.estimate}
          >
            <Input
              id="department-task-estimate"
              type="number"
              min={0}
              value={draft.estimatedMinutes}
              aria-invalid={Boolean(errors.estimate)}
              onChange={(event) =>
                patch({ estimatedMinutes: event.target.value })
              }
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function DepartmentTaskFormModal({
  open,
  ...rest
}: DepartmentTaskFormModalProps) {
  const [data, setData] = useState<LoadedData | null>(null);
  const [failed, setFailed] = useState(false);
  const { onClose } = rest;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([departmentTaskApi.list(), departmentTaskApi.getConfig()])
      .then(([list, config]) => {
        if (cancelled) return;
        setData({ list: list.data, config: config.data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toastApiError(error);
        setFailed(true);
      });
    return () => {
      cancelled = true;
      setData(null);
      setFailed(false);
    };
  }, [open]);

  useEffect(() => {
    if (failed) onClose();
  }, [failed, onClose]);

  if (!open || !data) return null;
  return <TaskForm data={data} {...rest} />;
}
