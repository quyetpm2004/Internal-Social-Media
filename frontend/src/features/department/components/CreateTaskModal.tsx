import { useRef, useState, type FormEvent } from "react";
import { Paperclip, Plus, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import MemberAvatar from "@/features/department/components/MemberAvatar";
import { useDepartmentStore } from "@/features/department/store/department.store";
import type {
  DepartmentMember,
  NewTaskInput,
  TaskPriority,
  TaskRecurrence,
} from "@/features/department/types/department.type";
import RichTextEditor from "@/features/new-feed/components/RichTextEditor";
import {
  isRichTextEmpty,
  sanitizePostHtml,
} from "@/features/new-feed/utils/rich-text";
import { cn } from "@/lib/utils";

const FORM_ID = "department-task-form";
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const RECURRENCES: TaskRecurrence[] = ["NONE", "WEEKLY", "MONTHLY"];
const MAX_CHILDREN = 20;
const MAX_ATTACHMENTS = 20;
const MINUTES_PER_HOUR = 60;

type ChildDraft = {
  key: string;
  title: string;
};

type TaskDraft = {
  title: string;
  description: string;
  statusId: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  estimatedMinutes: string;
  recurrence: TaskRecurrence;
  parentCode: string | null;
  assigneeIds: number[];
  reporterId: string;
  reviewerIds: number[];
  newChildren: ChildDraft[];
  files: string[];
};

type FieldErrors = Partial<Record<string, string>>;

type CreateTaskModalProps = {
  open: boolean;
  members: DepartmentMember[];
  presetAssigneeIds?: number[];
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => void;
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
  members,
  presetAssigneeIds = [],
  onClose,
  onSubmit,
}: Omit<CreateTaskModalProps, "open">) {
  const { t } = useTranslation();
  const info = useDepartmentStore((state) => state.info);
  const workflow = useDepartmentStore((state) => state.workflow);
  const statuses = useDepartmentStore((state) => state.statuses);
  const tasks = useDepartmentStore((state) => state.tasks);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const childCounter = useRef(0);

  const [draft, setDraft] = useState<TaskDraft>(() => ({
    title: "",
    description: "",
    statusId: statuses.find((status) => status.isInitial)?.id ?? "",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    estimatedMinutes: "",
    recurrence: "NONE",
    parentCode: null,
    assigneeIds: presetAssigneeIds,
    reporterId: String(info.leaderId),
    reviewerIds: [],
    newChildren: [],
    files: [],
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [parentQuery, setParentQuery] = useState("");
  const [parentOpen, setParentOpen] = useState(false);

  const patch = (partial: Partial<TaskDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const nameOf = (id: number) =>
    members.find((member) => member.id === id)?.name ?? String(id);

  const parentMatches = tasks
    .filter((task) => {
      const keyword = parentQuery.trim().toLowerCase();
      return (
        keyword &&
        (task.code.toLowerCase().includes(keyword) ||
          task.title.toLowerCase().includes(keyword))
      );
    })
    .slice(0, 8);
  const parentTask = tasks.find((task) => task.code === draft.parentCode);

  const validate = (): NewTaskInput | null => {
    const next: FieldErrors = {};
    const title = draft.title.trim();
    if (!title) next.title = t("pages.projects.tasks.form.titleRequired");
    if (!draft.statusId) {
      next.statusId = t("pages.projects.tasks.form.statusRequired");
    }
    if (draft.assigneeIds.length === 0) {
      next.assignees = t("department.createTask.assigneeRequired");
    }
    if (!draft.reporterId) {
      next.reporterId = t("pages.projects.tasks.form.reporterRequired");
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
        ? ""
        : sanitizePostHtml(draft.description),
      priority: draft.priority,
      statusId: draft.statusId,
      assigneeIds: draft.assigneeIds,
      reporterId: Number(draft.reporterId),
      reviewerIds: draft.reviewerIds,
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
      estimatedHours: (estimate ?? 0) / MINUTES_PER_HOUR,
      recurrence: draft.recurrence,
      parentCode: draft.parentCode,
      children: draft.newChildren.map((child) => child.title.trim()),
      attachments: draft.files,
    };
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = validate();
    if (!payload) return;
    onSubmit(payload);
    toast.success(t("pages.projects.tasks.created"));
    onClose();
  };

  const addFiles = (list: FileList | null) => {
    const names = Array.from(list ?? []).map((file) => file.name);
    if (names.length === 0) return;
    if (draft.files.length + names.length > MAX_ATTACHMENTS) {
      toast.error(t("pages.projects.tasks.form.attachmentLimit"));
      return;
    }
    patch({ files: [...draft.files, ...names] });
  };

  const availableAssignees = members.filter(
    (member) => !draft.assigneeIds.includes(member.id),
  );
  const availableReviewers = members.filter(
    (member) => !draft.reviewerIds.includes(member.id),
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={t("pages.projects.tasks.form.createTitle")}
      size="xl"
      className="max-h-[90vh] max-w-[min(96rem,calc(100vw-2rem))]"
      bodyClassName="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      formId={FORM_ID}
      confirmText={t("pages.projects.tasks.form.save")}
    >
      <form
        id={FORM_ID}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={handleSubmit}
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
                  onClick={() => patch({ parentCode: null })}
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
                      parentMatches.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            patch({ parentCode: task.code });
                            setParentQuery("");
                            setParentOpen(false);
                          }}
                          className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="font-semibold text-slate-500">
                            {task.code}
                          </span>{" "}
                          {task.title}
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

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {t("department.fields.assignees")}
              <span className="ml-0.5 text-red-500">*</span>
            </p>
            {draft.assigneeIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {draft.assigneeIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 py-1 pr-2 pl-1 text-xs font-semibold text-violet-700"
                  >
                    <MemberAvatar
                      id={id}
                      name={nameOf(id)}
                      className="size-5 text-[10px]"
                    />
                    {nameOf(id)}
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          assigneeIds: draft.assigneeIds.filter(
                            (item) => item !== id,
                          ),
                        })
                      }
                      className="cursor-pointer rounded-full p-0.5 hover:bg-violet-100"
                      aria-label={nameOf(id)}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Select
              value=""
              disabled={availableAssignees.length === 0}
              onChange={(event) => {
                const id = Number(event.target.value);
                if (!id) return;
                patch({ assigneeIds: [...draft.assigneeIds, id] });
                setErrors((current) => ({ ...current, assignees: undefined }));
              }}
            >
              <option value="">{t("department.createTask.addAssignee")}</option>
              {availableAssignees.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
            {errors.assignees && (
              <p className="text-xs text-red-600">{errors.assignees}</p>
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
            />
          </Field>

          <Field label={t("pages.projects.tasks.form.attachments")}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Paperclip className="size-4" />
              {t("pages.projects.tasks.form.addAttachment")}
            </button>
            {draft.files.length > 0 && (
              <ul className="mt-2 space-y-2">
                {draft.files.map((name, index) => (
                  <li
                    key={`${name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium text-slate-800">
                      {name}
                    </span>
                    <button
                      type="button"
                      title={t("pages.projects.tasks.form.removeAttachment")}
                      onClick={() =>
                        patch({
                          files: draft.files.filter((_, item) => item !== index),
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
          <Field label={t("pages.projects.tasks.form.workflow")} htmlFor="department-task-workflow">
            <Select id="department-task-workflow" value="fixed" disabled>
              <option value="fixed">{workflow.name}</option>
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
              <option value="">{t("pages.projects.tasks.form.pickStatus")}</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
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
            label={t("pages.projects.tasks.form.reporter")}
            htmlFor="department-task-reporter"
            required
            error={errors.reporterId}
          >
            <Select
              id="department-task-reporter"
              value={draft.reporterId}
              aria-invalid={Boolean(errors.reporterId)}
              onChange={(event) => patch({ reporterId: event.target.value })}
            >
              <option value="">
                {t("pages.projects.tasks.form.pickReporter")}
              </option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {t("pages.projects.tasks.form.reviewer")}
            </p>
            {draft.reviewerIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {draft.reviewerIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                  >
                    {nameOf(id)}
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          reviewerIds: draft.reviewerIds.filter(
                            (item) => item !== id,
                          ),
                        })
                      }
                      className="cursor-pointer rounded-full p-0.5 hover:bg-slate-200"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Select
              value=""
              onChange={(event) => {
                const id = Number(event.target.value);
                if (!id || draft.reviewerIds.includes(id)) return;
                patch({ reviewerIds: [...draft.reviewerIds, id] });
              }}
            >
              <option value="">{t("pages.projects.tasks.form.addReviewer")}</option>
              {availableReviewers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>

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
              onChange={(event) => patch({ estimatedMinutes: event.target.value })}
            />
          </Field>
          <Field
            label={t("department.fields.recurrence")}
            htmlFor="department-task-recurrence"
          >
            <Select
              id="department-task-recurrence"
              value={draft.recurrence}
              onChange={(event) =>
                patch({ recurrence: event.target.value as TaskRecurrence })
              }
              className={cn(draft.recurrence !== "NONE" && "text-violet-700")}
            >
              {RECURRENCES.map((item) => (
                <option key={item} value={item}>
                  {t(`department.recurrence.${item}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function CreateTaskModal({
  open,
  ...rest
}: CreateTaskModalProps) {
  if (!open) return null;
  return <TaskForm {...rest} />;
}
