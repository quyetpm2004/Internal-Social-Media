import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Loader2, Paperclip, Plus, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { projectApi } from "@/features/project/api/project.api";
import { formatTaskCreated } from "@/features/project/components/tasks/task-display";
import type {
  ProjectMemberItem,
  ProjectPriority,
  ProjectWorkflow,
  ProjectWorkflowRole,
  ProjectWorkflowTaskType,
} from "@/features/project/types/project.type";
import type { PhaseItem } from "@/features/project/types/planning.type";
import type {
  SaveTaskPayload,
  TaskAttachment,
  TaskDetail,
  TaskListItem,
} from "@/features/project/types/task.type";
import { compactDescriptionImages } from "@/features/project/utils/compact-description-images";
import { toDateInputValue } from "@/features/project/utils/project-date";
import { statusesForTaskMove } from "@/features/project/components/workflow/workflow-flow";
import { taskTypeMatchesWorkflow } from "@/features/project/utils/task-type-workflow";
import {
  getApiErrorMessages,
  toastApiError,
} from "@/features/project-template/utils/api-error";
import {
  TASK_FILE_ACCEPT,
  TaskUploadError,
  formatFileSize,
  uploadTaskFiles,
} from "@/features/project/utils/upload-task-file";
import RichTextContent from "@/features/new-feed/components/RichTextContent";
import RichTextEditor from "@/features/new-feed/components/RichTextEditor";
import {
  isRichTextEmpty,
  sanitizePostHtml,
} from "@/features/new-feed/utils/rich-text";
import { cn } from "@/lib/utils";

const FORM_ID = "project-task-form";
const PRIORITIES: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type AssigneeDraft = {
  projectRoleId: number;
  userId: string;
};

type ChildDraft = {
  key: string;
  title: string;
  estimatedMinutes: string;
};

type ParentDraft = {
  id: number;
  code: string;
  title: string;
};

type TaskDraft = {
  title: string;
  description: string;
  workflowId: string;
  taskTypeId: string;
  statusId: string;
  priority: ProjectPriority;
  startDate: string;
  dueDate: string;
  phaseId: string;
  estimatedMinutes: string;
  parent: ParentDraft | null;
  assignees: AssigneeDraft[];
  reporterId: string;
  reviewerIds: number[];
  newChildren: ChildDraft[];
  files: TaskAttachment[];
};

type FieldErrors = Partial<Record<string, string>>;

type TaskFormModalProps = {
  open: boolean;
  projectId: number;
  mode: "create" | "detail";
  detail: TaskDetail | null;
  loadingDetail: boolean;
  workflows: ProjectWorkflow[];
  taskTypes: ProjectWorkflowTaskType[];
  roles: ProjectWorkflowRole[];
  members: ProjectMemberItem[];
  currentUserId?: number;
  onClose: () => void;
  onSaved: () => void;
  onReloadDetail: () => Promise<void>;
};

function emptyDraft(
  currentUserId: number | undefined,
  memberIds: number[],
): TaskDraft {
  const reporter =
    currentUserId && memberIds.includes(currentUserId)
      ? String(currentUserId)
      : "";
  return {
    title: "",
    description: "",
    workflowId: "",
    taskTypeId: "",
    statusId: "",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    phaseId: "",
    estimatedMinutes: "",
    parent: null,
    assignees: [],
    reporterId: reporter,
    reviewerIds: [],
    newChildren: [],
    files: [],
  };
}

function draftFromDetail(detail: TaskDetail): TaskDraft {
  return {
    title: detail.title,
    description: detail.description ?? "",
    workflowId: String(detail.workflowId),
    taskTypeId: String(detail.taskTypeId),
    statusId: String(detail.statusId),
    priority: detail.priority,
    startDate: detail.startDate ? toDateInputValue(detail.startDate) : "",
    dueDate: detail.dueDate ? toDateInputValue(detail.dueDate) : "",
    phaseId: detail.phaseId ? String(detail.phaseId) : "",
    estimatedMinutes:
      detail.estimatedMinutes == null ? "" : String(detail.estimatedMinutes),
    parent: detail.parent,
    assignees: detail.assignees.map((assignee) => ({
      projectRoleId: assignee.projectRole.id,
      userId: String(assignee.userId),
    })),
    reporterId: detail.reporter ? String(detail.reporter.userId) : "",
    reviewerIds: detail.reviewers.map((reviewer) => reviewer.userId),
    newChildren: [],
    files: [],
  };
}

function sprintDay(value: string, language: string) {
  const [, month, day] = value.slice(0, 10).split("-");
  if (!month || !day) return "";
  return language.startsWith("vi") ? `${day}/${month}` : `${month}-${day}`;
}

function sprintRange(phase: PhaseItem, language: string) {
  const start = phase.startDate ? sprintDay(phase.startDate, language) : "";
  const end = phase.endDate ? sprintDay(phase.endDate, language) : "";
  if (start && end) return `${start} → ${end}`;
  return start || end;
}

function sprintTone(phase: PhaseItem) {
  if (phase.isOverdue) {
    return {
      dot: "bg-rose-500",
      text: "text-rose-600",
      label: "pages.projects.phases.overdue",
    };
  }
  if (phase.status === "ACTIVE") {
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      label: "pages.projects.phases.status.ACTIVE",
    };
  }
  if (phase.status === "COMPLETED") {
    return {
      dot: "bg-slate-400",
      text: "text-slate-500",
      label: "pages.projects.phases.status.COMPLETED",
    };
  }
  return {
    dot: "bg-blue-500",
    text: "text-blue-600",
    label: "pages.projects.phases.status.PLANNED",
  };
}

function parseEstimate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return "invalid" as const;
  const minutes = Number(trimmed);
  if (minutes > 1_000_000) return "invalid" as const;
  return minutes;
}

export default function TaskFormModal({
  open,
  projectId,
  mode,
  detail,
  loadingDetail,
  workflows,
  taskTypes,
  roles,
  members,
  currentUserId,
  onClose,
  onSaved,
  onReloadDetail,
}: TaskFormModalProps) {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState<TaskDraft>(() => emptyDraft(currentUserId, []));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [childKey, setChildKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<
    | null
    | { kind: "task" | "child"; id: number; label: string }
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [descriptionUploading, setDescriptionUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState(false);
  const [phases, setPhases] = useState<PhaseItem[]>([]);
  const [phasesLoaded, setPhasesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = saving || uploadingFiles || descriptionUploading;

  const readOnly = mode === "detail" && !!detail && !detail.canEdit;
  const activeWorkflows = workflows.filter((workflow) => workflow.isActive);
  const selectedWorkflow = activeWorkflows.find(
    (workflow) => workflow.id === Number(draft.workflowId),
  );
  const statuses = selectedWorkflow
    ? statusesForTaskMove(
        selectedWorkflow,
        mode === "detail" && detail
          ? { workflowId: detail.workflowId, statusId: detail.statusId }
          : null,
      )
    : [];
  const typeOptions = taskTypes.filter(
    (taskType) =>
      taskType.isActive && taskTypeMatchesWorkflow(taskType, selectedWorkflow),
  );
  const memberIds = useMemo(
    () => members.map((member) => member.userId),
    [members],
  );

  const [draftKey, setDraftKey] = useState<string | null>(null);
  const formKey =
    mode === "create" ? "create" : detail ? `task-${detail.id}` : "loading";
  const detailRef = useRef(detail);
  const memberIdsRef = useRef(memberIds);
  const currentUserIdRef = useRef(currentUserId);
  detailRef.current = detail;
  memberIdsRef.current = memberIds;
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    if (!open) {
      setDraftKey(null);
      setAttachmentError(false);
      return;
    }
    if (formKey === "loading") return;
    let cancelled = false;
    setErrors({});
    setPendingDelete(null);
    setAttachmentError(false);
    if (mode === "create") {
      setDraft(emptyDraft(currentUserIdRef.current, memberIdsRef.current));
      setDraftKey(formKey);
      return;
    }
    const current = detailRef.current;
    if (!current) return;
    setDraftKey(null);
    void (async () => {
      const base = draftFromDetail(current);
      try {
        const response = await projectApi.getTaskAttachments(
          projectId,
          current.id,
        );
        if (cancelled) return;
        setDraft({ ...base, files: response.data.files });
        setDraftKey(formKey);
      } catch (error) {
        if (cancelled) return;
        setDraft(base);
        setAttachmentError(true);
        setDraftKey(formKey);
        toastApiError(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, formKey, mode, projectId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPhasesLoaded(false);
    void projectApi
      .getPhases(projectId)
      .then((response) => {
        if (cancelled) return;
        setPhases(response.data.phases);
        setPhasesLoaded(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setPhases([]);
        setPhasesLoaded(true);
        toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const formReady = open && draftKey === formKey && (mode === "create" || detail != null);
  const selectedPhase =
    phases.find((phase) => String(phase.id) === draft.phaseId) ?? null;
  const selectedPhaseTone = selectedPhase ? sprintTone(selectedPhase) : null;
  const selectedPhaseRange = selectedPhase
    ? sprintRange(selectedPhase, i18n.language)
    : "";

  const people = useMemo(() => {
    const map = new Map<number, string>();
    for (const member of members) map.set(member.userId, member.fullName);
    if (detail?.reporter) map.set(detail.reporter.userId, detail.reporter.fullName);
    for (const reviewer of detail?.reviewers ?? []) {
      map.set(reviewer.userId, reviewer.fullName);
    }
    for (const assignee of detail?.assignees ?? []) {
      map.set(assignee.userId, assignee.fullName);
    }
    return [...map.entries()].map(([userId, fullName]) => ({ userId, fullName }));
  }, [members, detail]);

  const roleName = (roleId: number) =>
    roles.find((role) => role.id === roleId)?.name ??
    detail?.assignees.find((assignee) => assignee.projectRole.id === roleId)
      ?.projectRole.name ??
    String(roleId);

  const peopleInRole = (roleId: number, selectedUserId: string) => {
    const inRole = members.filter((member) =>
      member.roles.some((role) => role.id === roleId),
    );
    const selectedId = Number(selectedUserId);
    if (selectedId && !inRole.some((member) => member.userId === selectedId)) {
      const known = people.find((person) => person.userId === selectedId);
      if (known) {
        return [...inRole, { userId: known.userId, fullName: known.fullName }];
      }
    }
    return inRole;
  };

  const availableRoles = [...roles].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  ).filter(
    (role) => !draft.assignees.some((row) => row.projectRoleId === role.id),
  );

  const patch = (partial: Partial<TaskDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const handleWorkflowChange = (value: string) => {
    const workflow = activeWorkflows.find((item) => item.id === Number(value));
    const sameWorkflow =
      mode === "detail" &&
      detail != null &&
      detail.workflowId === Number(value);
    const initial = workflow?.statuses.find((status) => status.isInitial);
    patch({
      workflowId: value,
      taskTypeId: "",
      statusId: sameWorkflow
        ? String(detail.statusId)
        : initial
          ? String(initial.id)
          : "",
    });
    setErrors((current) => ({
      ...current,
      workflowId: undefined,
      taskTypeId: undefined,
      statusId: undefined,
    }));
  };

  const validate = (): SaveTaskPayload | null => {
    const next: FieldErrors = {};
    const title = draft.title.trim();
    if (!title) next.title = t("pages.projects.tasks.form.titleRequired");
    if (!draft.workflowId) {
      next.workflowId = t("pages.projects.tasks.form.workflowRequired");
    }
    if (!draft.taskTypeId) {
      next.taskTypeId = t("pages.projects.tasks.form.taskTypeRequired");
    }
    if (!draft.statusId) {
      next.statusId = t("pages.projects.tasks.form.statusRequired");
    }
    if (draft.assignees.length === 0) {
      next.assignees = t("pages.projects.tasks.form.assigneeRequired");
    } else if (draft.assignees.some((row) => !row.userId)) {
      next.assignees = t("pages.projects.tasks.form.assigneePersonRequired");
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
    if (draft.newChildren.length > 20) {
      next.children = t("pages.projects.tasks.form.childLimit");
    } else if (draft.newChildren.some((child) => !child.title.trim())) {
      next.children = t("pages.projects.tasks.form.childTitleRequired");
    } else if (
      draft.newChildren.some(
        (child) => parseEstimate(child.estimatedMinutes) === "invalid",
      )
    ) {
      next.children = t("pages.projects.tasks.form.estimateInvalid");
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || estimate === "invalid") return null;

    const description = isRichTextEmpty(draft.description)
      ? null
      : compactDescriptionImages(sanitizePostHtml(draft.description));

    return {
      title,
      description,
      workflowId: Number(draft.workflowId),
      taskTypeId: Number(draft.taskTypeId),
      statusId: Number(draft.statusId),
      priority: draft.priority,
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
      phaseId: draft.phaseId ? Number(draft.phaseId) : null,
      estimatedMinutes: estimate,
      parentTaskId: draft.parent?.id ?? null,
      assignees: draft.assignees.map((row) => ({
        projectRoleId: row.projectRoleId,
        userId: Number(row.userId),
      })),
      reporterId: Number(draft.reporterId),
      reviewerIds: draft.reviewerIds,
      attachmentIds: draft.files.map((file) => file.id),
      children: draft.newChildren.map((child) => ({
        title: child.title.trim(),
        estimatedMinutes: parseEstimate(child.estimatedMinutes) as number | null,
      })),
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || busy || attachmentError) return;
    const payload = validate();
    if (!payload) return;
    setSaving(true);
    try {
      if (mode === "create") {
        await projectApi.createTask(projectId, payload);
        toast.success(t("pages.projects.tasks.created"));
      } else if (detail) {
        await projectApi.updateTask(projectId, detail.id, payload);
        toast.success(t("pages.projects.tasks.updated"));
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
    return getApiErrorMessages(error)[0] || t("pages.projects.tasks.upload.failed");
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

  const addTaskFiles = async (list: FileList | null) => {
    const selected = Array.from(list ?? []);
    if (selected.length === 0) return;
    if (draft.files.length + selected.length > 20) {
      toast.error(t("pages.projects.tasks.form.attachmentLimit"));
      return;
    }
    setUploadingFiles(true);
    try {
      const uploaded = await uploadTaskFiles(selected, "task");
      setDraft((current) => ({
        ...current,
        files: [
          ...current.files,
          ...uploaded.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            attachmentType: file.attachmentType,
            fileUrl: file.fileUrl,
          })),
        ],
      }));
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    } finally {
      setUploadingFiles(false);
    }
  };

  const retryAttachments = async () => {
    if (!detail) return;
    try {
      const response = await projectApi.getTaskAttachments(projectId, detail.id);
      setDraft((current) => ({ ...current, files: response.data.files }));
      setAttachmentError(false);
    } catch (error) {
      toastApiError(error);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await projectApi.deleteTask(projectId, pendingDelete.id);
      toast.success(t("pages.projects.tasks.deleted"));
      setPendingDelete(null);
      if (pendingDelete.kind === "task") {
        onSaved();
        onClose();
      } else {
        await onReloadDetail();
      }
    } catch (error) {
      toastApiError(error);
    } finally {
      setDeleting(false);
    }
  };

  const excludedParentIds = new Set<number>();
  if (detail) {
    excludedParentIds.add(detail.id);
    for (const child of detail.children) excludedParentIds.add(child.id);
  }

  const title = readOnly
    ? t("pages.projects.tasks.form.viewTitle")
    : mode === "create"
      ? t("pages.projects.tasks.form.createTitle")
      : t("pages.projects.tasks.form.editTitle");

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={detail ? `${detail.code} · ${title}` : title}
        size="xl"
        className="max-h-[90vh] max-w-[min(96rem,calc(100vw-2rem))]"
        bodyClassName="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        loading={saving}
        hideFooter={readOnly || loadingDetail || !formReady}
        formId={FORM_ID}
        confirmText={t("pages.projects.tasks.form.save")}
        footer={
          readOnly ? undefined : (
            <div className="flex w-full items-center justify-between gap-2">
              {detail?.canEdit ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setPendingDelete({
                      kind: "task",
                      id: detail.id,
                      label: `${detail.code} ${detail.title}`,
                    })
                  }
                  className="h-10 cursor-pointer rounded-lg border border-rose-200 px-4 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
                  {t("pages.projects.tasks.form.delete")}
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="h-10 cursor-pointer rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  form={FORM_ID}
                  disabled={busy || attachmentError}
                  className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving || uploadingFiles || descriptionUploading
                    ? t("common.processing")
                    : t("pages.projects.tasks.form.save")}
                </button>
              </div>
            </div>
          )
        }
      >
        {loadingDetail || !formReady ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {t("common.processing")}
          </p>
        ) : (
          <form id={FORM_ID} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <ParentField
                projectId={projectId}
                parent={draft.parent}
                excludedIds={[...excludedParentIds]}
                disabled={readOnly}
                onChange={(parent) => patch({ parent })}
              />

              <Field
                label={t("pages.projects.tasks.form.title")}
                htmlFor="task-title"
                required
                error={errors.title}
              >
                <Input
                  id="task-title"
                  value={draft.title}
                  maxLength={200}
                  disabled={readOnly}
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
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setChildKey((value) => value + 1);
                        patch({
                          newChildren: [
                            ...draft.newChildren,
                            {
                              key: `new-${childKey + 1}`,
                              title: "",
                              estimatedMinutes: "",
                            },
                          ],
                        });
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary"
                    >
                      <Plus className="size-4" />
                      {t("pages.projects.tasks.form.addChild")}
                    </button>
                  )}
                </div>
                {detail?.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <p className="min-w-0 text-sm text-slate-800">
                      <span className="font-semibold text-slate-500">{child.code}</span>{" "}
                      {child.title}
                    </p>
                    {detail.canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDelete({
                            kind: "child",
                            id: child.id,
                            label: `${child.code} ${child.title}`,
                          })
                        }
                        className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={t("pages.projects.tasks.form.delete")}
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
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
                    <Input
                      type="number"
                      min={0}
                      value={child.estimatedMinutes}
                      placeholder={t("pages.projects.tasks.form.estimate")}
                      className="w-36 shrink-0"
                      onChange={(event) =>
                        patch({
                          newChildren: draft.newChildren.map((item) =>
                            item.key === child.key
                              ? { ...item, estimatedMinutes: event.target.value }
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
                  {t("pages.projects.tasks.form.roles")}
                  <span className="ml-0.5 text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-500">
                  {t("pages.projects.tasks.form.rolesHint")}
                </p>
                {draft.assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {draft.assignees.map((row) => (
                      <span
                        key={row.projectRoleId}
                        className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
                      >
                        {roleName(row.projectRoleId)}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              patch({
                                assignees: draft.assignees.filter(
                                  (item) => item.projectRoleId !== row.projectRoleId,
                                ),
                              })
                            }
                            className="cursor-pointer rounded-full p-0.5 hover:bg-violet-100"
                            aria-label={roleName(row.projectRoleId)}
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {!readOnly && (
                  <Select
                    value=""
                    disabled={availableRoles.length === 0}
                    onChange={(event) => {
                      const roleId = Number(event.target.value);
                      if (!roleId) return;
                      patch({
                        assignees: [
                          ...draft.assignees,
                          { projectRoleId: roleId, userId: "" },
                        ],
                      });
                    }}
                  >
                    <option value="">{t("pages.projects.tasks.form.addRole")}</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                )}
                {draft.assignees.map((row) => {
                  const rolePeople = peopleInRole(row.projectRoleId, row.userId);
                  return (
                    <label key={row.projectRoleId} className="block space-y-1">
                      <span className="text-xs font-semibold text-slate-500">
                        {roleName(row.projectRoleId)}
                      </span>
                      <Select
                        value={row.userId}
                        disabled={readOnly || rolePeople.length === 0}
                        onChange={(event) =>
                          patch({
                            assignees: draft.assignees.map((item) =>
                              item.projectRoleId === row.projectRoleId
                                ? { ...item, userId: event.target.value }
                                : item,
                            ),
                          })
                        }
                      >
                        <option value="">
                          {t("pages.projects.tasks.form.pickPerson")}
                        </option>
                        {rolePeople.map((person) => (
                          <option key={person.userId} value={person.userId}>
                            {person.fullName}
                          </option>
                        ))}
                      </Select>
                      {rolePeople.length === 0 && (
                        <p className="text-xs text-slate-500">
                          {t("pages.projects.tasks.form.noPeopleInRole")}
                        </p>
                      )}
                    </label>
                  );
                })}
                {errors.assignees && (
                  <p className="text-xs text-red-600">{errors.assignees}</p>
                )}
              </div>

              <Field label={t("pages.projects.tasks.form.description")}>
                {readOnly ? (
                  draft.description ? (
                    <RichTextContent content={draft.description} />
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )
                ) : (
                  <RichTextEditor
                    key={formKey}
                    value={draft.description}
                    onChange={(html) => patch({ description: html })}
                    allowMentionAll={false}
                    placeholder={t("pages.projects.tasks.form.description")}
                    minRows={4}
                    extended
                    uploadImage={uploadDescriptionImage}
                    onUploadingChange={setDescriptionUploading}
                  />
                )}
              </Field>

              <Field label={t("pages.projects.tasks.form.attachments")}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={TASK_FILE_ACCEPT}
                  className="hidden"
                  onChange={(event) => {
                    void addTaskFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                {!readOnly && (
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
                )}
                {attachmentError && (
                  <button
                    type="button"
                    onClick={() => void retryAttachments()}
                    className="mt-2 block cursor-pointer text-sm text-rose-600 hover:underline"
                  >
                    {t("pages.projects.tasks.form.attachmentsLoadFailed")}
                  </button>
                )}
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
                        {!readOnly && (
                          <button
                            type="button"
                            title={t("pages.projects.tasks.form.removeAttachment")}
                            onClick={() =>
                              patch({
                                files: draft.files.filter((item) => item.id !== file.id),
                              })
                            }
                            className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Field>
            </div>

            <div className="space-y-4">
              <Field
                label={t("pages.projects.tasks.form.workflow")}
                htmlFor="task-workflow"
                required
                error={errors.workflowId}
              >
                <Select
                  id="task-workflow"
                  value={draft.workflowId}
                  disabled={readOnly}
                  aria-invalid={Boolean(errors.workflowId)}
                  onChange={(event) => handleWorkflowChange(event.target.value)}
                >
                  <option value="">{t("pages.projects.tasks.form.pickWorkflow")}</option>
                  {activeWorkflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t("pages.projects.tasks.form.taskType")}
                htmlFor="task-type"
                required
                error={errors.taskTypeId}
              >
                <Select
                  id="task-type"
                  value={draft.taskTypeId}
                  disabled={readOnly || !draft.workflowId}
                  aria-invalid={Boolean(errors.taskTypeId)}
                  onChange={(event) => patch({ taskTypeId: event.target.value })}
                >
                  <option value="">
                    {t("pages.projects.tasks.form.pickTaskType")}
                  </option>
                  {typeOptions.map((taskType) => (
                    <option key={taskType.id} value={taskType.id}>
                      {taskType.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t("pages.projects.tasks.form.status")}
                htmlFor="task-status"
                required
                error={errors.statusId}
              >
                <Select
                  id="task-status"
                  value={draft.statusId}
                  disabled={readOnly || !draft.workflowId}
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
                htmlFor="task-priority"
              >
                <Select
                  id="task-priority"
                  value={draft.priority}
                  disabled={readOnly}
                  onChange={(event) =>
                    patch({ priority: event.target.value as ProjectPriority })
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
                label={t("pages.projects.tasks.form.sprint")}
                htmlFor="task-sprint"
              >
                <Select
                  id="task-sprint"
                  value={draft.phaseId}
                  disabled={readOnly}
                  onChange={(event) => patch({ phaseId: event.target.value })}
                >
                  <option value="">{t("pages.projects.tasks.form.noSprint")}</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </Select>
                {selectedPhase && selectedPhaseTone ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 font-medium",
                        selectedPhaseTone.text,
                      )}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", selectedPhaseTone.dot)}
                      />
                      {t(selectedPhaseTone.label)}
                    </span>
                    {selectedPhaseRange && (
                      <span className="text-slate-500">{selectedPhaseRange}</span>
                    )}
                  </div>
                ) : (
                  phasesLoaded &&
                  phases.length === 0 && (
                    <p className="text-xs text-slate-400">
                      {t("pages.projects.tasks.form.noSprintYet")}
                    </p>
                  )
                )}
              </Field>

              <Field
                label={t("pages.projects.tasks.form.reporter")}
                htmlFor="task-reporter"
                required
                error={errors.reporterId}
              >
                <Select
                  id="task-reporter"
                  value={draft.reporterId}
                  disabled={readOnly}
                  aria-invalid={Boolean(errors.reporterId)}
                  onChange={(event) => patch({ reporterId: event.target.value })}
                >
                  <option value="">
                    {t("pages.projects.tasks.form.pickReporter")}
                  </option>
                  {people.map((person) => (
                    <option key={person.userId} value={person.userId}>
                      {person.fullName}
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
                    {draft.reviewerIds.map((userId) => (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {people.find((person) => person.userId === userId)?.fullName ??
                          userId}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              patch({
                                reviewerIds: draft.reviewerIds.filter(
                                  (id) => id !== userId,
                                ),
                              })
                            }
                            className="cursor-pointer rounded-full p-0.5 hover:bg-slate-200"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {!readOnly && (
                  <Select
                    value=""
                    onChange={(event) => {
                      const userId = Number(event.target.value);
                      if (!userId || draft.reviewerIds.includes(userId)) return;
                      patch({ reviewerIds: [...draft.reviewerIds, userId] });
                    }}
                  >
                    <option value="">
                      {t("pages.projects.tasks.form.addReviewer")}
                    </option>
                    {people
                      .filter((person) => !draft.reviewerIds.includes(person.userId))
                      .map((person) => (
                        <option key={person.userId} value={person.userId}>
                          {person.fullName}
                        </option>
                      ))}
                  </Select>
                )}
              </div>

              <Field
                label={t("pages.projects.tasks.form.startDate")}
                htmlFor="task-start"
                error={errors.dates}
              >
                <Input
                  id="task-start"
                  type="date"
                  value={draft.startDate}
                  disabled={readOnly}
                  onChange={(event) => patch({ startDate: event.target.value })}
                />
              </Field>
              <Field
                label={t("pages.projects.tasks.form.dueDate")}
                htmlFor="task-due"
              >
                <Input
                  id="task-due"
                  type="date"
                  value={draft.dueDate}
                  disabled={readOnly}
                  aria-invalid={Boolean(errors.dates)}
                  onChange={(event) => patch({ dueDate: event.target.value })}
                />
              </Field>
              <Field
                label={t("pages.projects.tasks.form.estimate")}
                htmlFor="task-estimate"
                error={errors.estimate}
              >
                <Input
                  id="task-estimate"
                  type="number"
                  min={0}
                  value={draft.estimatedMinutes}
                  disabled={readOnly}
                  aria-invalid={Boolean(errors.estimate)}
                  onChange={(event) =>
                    patch({ estimatedMinutes: event.target.value })
                  }
                />
              </Field>
              {mode === "detail" && detail && (
                <Field label={t("pages.projects.tasks.form.createdAt")}>
                  <p className="text-sm text-slate-700">
                    {formatTaskCreated(detail.createdAt, i18n.language)}
                  </p>
                </Field>
              )}
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={pendingDelete != null}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        title={t("pages.projects.tasks.form.deleteTitle")}
        description={t("pages.projects.tasks.form.deleteDescription", {
          name: pendingDelete?.label ?? "",
        })}
        variant="danger"
        loading={deleting}
        confirmText={t("pages.projects.tasks.form.delete")}
        onConfirm={handleDelete}
      />
    </>
  );
}

function ParentField({
  projectId,
  parent,
  excludedIds,
  disabled,
  onChange,
}: {
  projectId: number;
  parent: ParentDraft | null;
  excludedIds: number[];
  disabled: boolean;
  onChange: (parent: ParentDraft | null) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const excludedKey = excludedIds.join(",");

  useEffect(() => {
    if (!open) return;
    const keyword = query.trim();
    if (!keyword) {
      setResults([]);
      return;
    }
    const blocked = new Set(excludedKey.split(",").filter(Boolean).map(Number));
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await projectApi.getTasks(projectId, {
          keyword,
          match: "title_or_code",
          limit: 10,
          page: 1,
        });
        if (!cancelled) {
          setResults(response.data.tasks.filter((task) => !blocked.has(task.id)));
        }
      } catch (error) {
        if (!cancelled) {
          setResults([]);
          toastApiError(error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, projectId, excludedKey]);

  if (parent) {
    return (
      <Field label={t("pages.projects.tasks.form.parent")}>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <p className="min-w-0 text-sm text-slate-800">
            <span className="font-semibold text-slate-500">{parent.code}</span>{" "}
            {parent.title}
          </p>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100"
              aria-label={t("common.cancel")}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </Field>
    );
  }

  return (
    <Field label={t("pages.projects.tasks.form.parent")} htmlFor="task-parent">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          id="task-parent"
          value={query}
          disabled={disabled}
          placeholder={t("pages.projects.tasks.form.parentPlaceholder")}
          className="pl-9"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
        />
        {open && !disabled && (
          <div
            className={cn(
              "absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg",
            )}
          >
            {loading ? (
              <p className="px-3 py-2 text-sm text-slate-500">
                {t("common.processing")}
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">
                {query.trim()
                  ? t("pages.projects.tasks.form.parentEmpty")
                  : t("pages.projects.tasks.form.parentPlaceholder")}
              </p>
            ) : (
              results.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange({ id: task.id, code: task.code, title: task.title });
                    setQuery("");
                    setOpen(false);
                  }}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-semibold text-slate-500">{task.code}</span>{" "}
                  {task.title}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
