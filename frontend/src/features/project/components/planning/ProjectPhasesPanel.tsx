import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  Layers,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { projectApi } from "@/features/project/api/project.api";
import PhaseFormModal from "@/features/project/components/planning/PhaseFormModal";
import { taskStatusColor } from "@/features/project/components/tasks/task-display";
import type {
  PhaseItem,
  PhaseStatus,
  PlanningTask,
  SavePhasePayload,
} from "@/features/project/types/planning.type";
import { formatProjectDate } from "@/features/project/utils/project-date";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<PhaseStatus, string> = {
  PLANNED: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

function dateRange(phase: PhaseItem, language: string) {
  if (phase.startDate && phase.endDate) {
    return `${formatProjectDate(phase.startDate, language)} – ${formatProjectDate(phase.endDate, language)}`;
  }
  if (phase.startDate) return formatProjectDate(phase.startDate, language);
  if (phase.endDate) return formatProjectDate(phase.endDate, language);
  return "";
}

function toPayload(phase: PhaseItem, status?: PhaseStatus): SavePhasePayload {
  return {
    name: phase.name,
    goal: phase.goal,
    startDate: phase.startDate,
    endDate: phase.endDate,
    status: status ?? phase.status,
    taskIds: phase.tasks.map((task) => task.id),
  };
}

export default function ProjectPhasesPanel({ projectId }: { projectId: number }) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [phases, setPhases] = useState<PhaseItem[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pickedDefault, setPickedDefault] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [editor, setEditor] = useState<PhaseItem | null | "create">(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PhaseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPickedDefault(false);
    setExpandedId(null);
    setShowCompleted(false);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await projectApi.getPhases(projectId);
        if (cancelled) return;
        setPhases(response.data.phases);
        setCanManage(response.data.canManage);
        setError("");
      } catch (loadError) {
        if (cancelled) return;
        toastApiError(loadError);
        setError(t("pages.projects.phases.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadKey, t]);

  useEffect(() => {
    if (pickedDefault || phases.length === 0) return;
    const active = phases.find((phase) => phase.status === "ACTIVE");
    setExpandedId(active?.id ?? null);
    setPickedDefault(true);
  }, [phases, pickedDefault]);

  const openTask = (taskId: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "tasks");
    next.set("task", String(taskId));
    setSearchParams(next);
  };

  const reload = () => setReloadKey((value) => value + 1);

  const savePhase = async (payload: SavePhasePayload) => {
    setSaving(true);
    try {
      if (editor && editor !== "create") {
        await projectApi.updatePhase(projectId, editor.id, {
          ...payload,
          status: editor.status,
        });
        toast.success(t("pages.projects.phases.updated"));
      } else {
        await projectApi.createPhase(projectId, payload);
        toast.success(t("pages.projects.phases.created"));
      }
      setEditor(null);
      reload();
    } catch (saveError) {
      toastApiError(saveError);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (phase: PhaseItem, status: PhaseStatus) => {
    setMenuId(null);
    try {
      await projectApi.updatePhase(projectId, phase.id, toPayload(phase, status));
      toast.success(t("pages.projects.phases.updated"));
      reload();
    } catch (saveError) {
      toastApiError(saveError);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await projectApi.deletePhase(projectId, pendingDelete.id);
      toast.success(t("pages.projects.phases.deleted"));
      setPendingDelete(null);
      reload();
    } catch (deleteError) {
      toastApiError(deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const openPhases = phases.filter((phase) => phase.status !== "COMPLETED");
  const completed = phases.filter((phase) => phase.status === "COMPLETED");

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-2xl bg-white" />
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {menuId != null && (
        <button
          type="button"
          aria-label={t("common.close")}
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setMenuId(null)}
        />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {t("pages.projects.phases.title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            {t("pages.projects.phases.subtitle")}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setEditor("create")}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {t("pages.projects.phases.create")}
          </button>
        )}
      </div>

      {error ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          {error}
        </p>
      ) : phases.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Layers className="size-5" />
          </span>
          <p className="mt-3 text-base font-semibold text-slate-800">
            {t("pages.projects.phases.empty")}
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {t("pages.projects.phases.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {openPhases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              language={i18n.language}
              expanded={expandedId === phase.id}
              menuOpen={menuId === phase.id}
              canManage={canManage}
              onToggle={() =>
                setExpandedId((current) =>
                  current === phase.id ? null : phase.id,
                )
              }
              onMenu={() =>
                setMenuId((current) => (current === phase.id ? null : phase.id))
              }
              onEdit={() => {
                setMenuId(null);
                setEditor(phase);
              }}
              onStatus={(status) => changeStatus(phase, status)}
              onDelete={() => {
                setMenuId(null);
                setPendingDelete(phase);
              }}
              onOpenTask={openTask}
            />
          ))}

          {completed.length > 0 && (
            <section className="pt-2">
              <button
                type="button"
                onClick={() => setShowCompleted((value) => !value)}
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    showCompleted ? "rotate-0" : "-rotate-90",
                  )}
                />
                {t("pages.projects.phases.completedSection", {
                  count: completed.length,
                })}
              </button>
              {showCompleted && (
                <div className="mt-3 space-y-3">
                  {completed.map((phase) => (
                    <PhaseCard
                      key={phase.id}
                      phase={phase}
                      language={i18n.language}
                      expanded={expandedId === phase.id}
                      menuOpen={menuId === phase.id}
                      canManage={canManage}
                      onToggle={() =>
                        setExpandedId((current) =>
                          current === phase.id ? null : phase.id,
                        )
                      }
                      onMenu={() =>
                        setMenuId((current) =>
                          current === phase.id ? null : phase.id,
                        )
                      }
                      onEdit={() => {
                        setMenuId(null);
                        setEditor(phase);
                      }}
                      onStatus={(status) => changeStatus(phase, status)}
                      onDelete={() => {
                        setMenuId(null);
                        setPendingDelete(phase);
                      }}
                      onOpenTask={openTask}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <PhaseFormModal
        open={editor != null}
        projectId={projectId}
        phase={editor && editor !== "create" ? editor : null}
        saving={saving}
        onClose={() => {
          if (!saving) setEditor(null);
        }}
        onSubmit={savePhase}
      />

      <ConfirmModal
        open={pendingDelete != null}
        title={t("pages.projects.phases.deleteTitle")}
        description={t("pages.projects.phases.deleteDescription")}
        confirmText={t("pages.projects.phases.delete")}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function PhaseCard({
  phase,
  language,
  expanded,
  menuOpen,
  canManage,
  onToggle,
  onMenu,
  onEdit,
  onStatus,
  onDelete,
  onOpenTask,
}: {
  phase: PhaseItem;
  language: string;
  expanded: boolean;
  menuOpen: boolean;
  canManage: boolean;
  onToggle: () => void;
  onMenu: () => void;
  onEdit: () => void;
  onStatus: (status: PhaseStatus) => void;
  onDelete: () => void;
  onOpenTask: (taskId: number) => void;
}) {
  const { t } = useTranslation();
  const range = dateRange(phase, language);
  const accent =
    phase.status === "COMPLETED"
      ? "border-l-emerald-400"
      : phase.isOverdue
        ? "border-l-rose-400"
        : phase.status === "ACTIVE"
          ? "border-l-blue-500"
          : "border-l-slate-200";

  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 border-l-4 bg-white shadow-sm",
        accent,
        menuOpen && "relative z-20",
      )}
    >
      <div className="flex items-start gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
        >
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-slate-400 transition-transform",
              expanded ? "rotate-0" : "-rotate-90",
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">{phase.name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  STATUS_CLASS[phase.status],
                )}
              >
                {t(`pages.projects.phases.status.${phase.status}`)}
              </span>
              {phase.isOverdue && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                  {t("pages.projects.phases.overdue")}
                </span>
              )}
            </span>
            {range && (
              <span className="mt-1 block text-xs text-slate-500">{range}</span>
            )}
            {phase.goal && (
              <span className="mt-1 block truncate text-xs text-slate-500">
                {phase.goal}
              </span>
            )}
            <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-slate-100">
              <span
                className={cn(
                  "block h-full rounded-full",
                  phase.percent === 100 ? "bg-emerald-500" : "bg-blue-500",
                )}
                style={{ width: `${phase.percent}%` }}
              />
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <PhaseStats phase={phase} />
          {canManage && (
            <div className="relative">
              <button
                type="button"
                onClick={onMenu}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={t("pages.projects.membersPanel.actions")}
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <MenuButton label={t("pages.projects.phases.edit")} onClick={onEdit} />
                  {phase.status !== "ACTIVE" && (
                    <MenuButton
                      label={t("pages.projects.phases.start")}
                      onClick={() => onStatus("ACTIVE")}
                    />
                  )}
                  {phase.status !== "COMPLETED" ? (
                    <MenuButton
                      label={t("pages.projects.phases.complete")}
                      onClick={() => onStatus("COMPLETED")}
                    />
                  ) : (
                    <MenuButton
                      label={t("pages.projects.phases.reopen")}
                      onClick={() => onStatus("PLANNED")}
                    />
                  )}
                  <MenuButton
                    label={t("pages.projects.phases.delete")}
                    danger
                    onClick={onDelete}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100">
          {phase.tasks.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400">
              {t("pages.projects.phases.noTasks")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {phase.tasks.map((task) => (
                <PhaseTaskRow
                  key={task.id}
                  task={task}
                  onOpen={() => onOpenTask(task.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

function PhaseStats({ phase }: { phase: PhaseItem }) {
  const { t } = useTranslation();
  return (
    <div className="hidden items-center gap-4 text-right text-xs text-slate-500 sm:flex">
      <span>
        {t("pages.projects.phases.taskCount")}{" "}
        <strong className="text-sm text-slate-800">{phase.taskCount}</strong>
      </span>
      <span>
        {t("pages.projects.phases.doneCount")}{" "}
        <strong className="text-sm text-slate-800">{phase.doneCount}</strong>
      </span>
      <strong className="w-10 text-sm text-slate-800">{phase.percent}%</strong>
    </div>
  );
}

function PhaseTaskRow({
  task,
  onOpen,
}: {
  task: PlanningTask;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: taskStatusColor(task.status) }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">
            {task.title}
          </span>
          <span className="block text-xs text-slate-400">{task.code}</span>
        </span>
        <span
          className="hidden max-w-32 truncate text-xs font-semibold sm:inline"
          style={{ color: taskStatusColor(task.status) }}
        >
          {task.status.name}
        </span>
        <AssigneeStack assignees={task.assignees} />
      </button>
    </li>
  );
}

function AssigneeStack({
  assignees,
}: {
  assignees: PlanningTask["assignees"];
}) {
  if (assignees.length === 0) return null;
  const visible = assignees.slice(0, 3);
  return (
    <span className="flex -space-x-1.5">
      {visible.map((person) =>
        person.avatarUrl ? (
          <img
            key={person.userId}
            src={person.avatarUrl}
            alt={person.fullName}
            title={person.fullName}
            className="size-6 rounded-full border border-white object-cover"
          />
        ) : (
          <span
            key={person.userId}
            title={person.fullName}
            className="flex size-6 items-center justify-center rounded-full border border-white bg-slate-200 text-[10px] font-semibold text-slate-600"
          >
            {person.fullName.slice(0, 1).toUpperCase()}
          </span>
        ),
      )}
      {assignees.length > 3 && (
        <span className="flex size-6 items-center justify-center rounded-full border border-white bg-slate-100 text-[10px] font-semibold text-slate-500">
          +{assignees.length - 3}
        </span>
      )}
    </span>
  );
}

function MenuButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-slate-50",
        danger ? "text-rose-600" : "text-slate-700",
      )}
    >
      {label}
    </button>
  );
}
