import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlarmClock,
  CalendarClock,
  CircleCheck,
  Flag,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import StatCard, {
  type StatTone,
} from "@/components/shared/dashboard/StatCard";
import { projectApi } from "@/features/project/api/project.api";
import MilestoneFormModal from "@/features/project/components/planning/MilestoneFormModal";
import { taskStatusColor } from "@/features/project/components/tasks/task-display";
import type {
  MilestoneItem,
  MilestoneStatus,
  MilestoneTone,
  SaveMilestonePayload,
} from "@/features/project/types/planning.type";
import { formatProjectDate } from "@/features/project/utils/project-date";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { cn } from "@/lib/utils";

type Filter = "all" | "upcoming" | "overdue" | "reached";

const TONE_DOT: Record<MilestoneTone, string> = {
  upcoming: "bg-violet-500",
  today: "bg-amber-500",
  overdue: "bg-rose-500",
  reached: "bg-emerald-500",
};

const TONE_CHIP: Record<MilestoneTone, string> = {
  upcoming: "bg-violet-50 text-violet-700",
  today: "bg-amber-50 text-amber-700",
  overdue: "bg-rose-50 text-rose-700",
  reached: "bg-emerald-50 text-emerald-700",
};

function toPayload(
  milestone: MilestoneItem,
  status?: MilestoneStatus,
): SaveMilestonePayload {
  return {
    name: milestone.name,
    description: milestone.description,
    dueDate: milestone.dueDate,
    phaseId: milestone.phase?.id ?? null,
    status: status ?? milestone.status,
    taskIds: milestone.tasks.map((task) => task.id),
  };
}

export default function ProjectMilestonesPanel({
  projectId,
}: {
  projectId: number;
}) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [phases, setPhases] = useState<Array<{ id: number; name: string }>>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [menuId, setMenuId] = useState<number | null>(null);
  const [editor, setEditor] = useState<MilestoneItem | null | "create">(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MilestoneItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [milestoneResponse, phaseResponse] = await Promise.all([
          projectApi.getMilestones(projectId),
          projectApi.getPhases(projectId),
        ]);
        if (cancelled) return;
        setMilestones(milestoneResponse.data.milestones);
        setCanManage(milestoneResponse.data.canManage);
        setPhases(
          phaseResponse.data.phases.map((phase) => ({
            id: phase.id,
            name: phase.name,
          })),
        );
        setError("");
      } catch (loadError) {
        if (cancelled) return;
        toastApiError(loadError);
        setError(t("pages.projects.milestones.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadKey, t]);

  const counts = useMemo(
    () => ({
      upcoming: milestones.filter(
        (item) => item.tone === "upcoming" || item.tone === "today",
      ).length,
      overdue: milestones.filter((item) => item.tone === "overdue").length,
      reached: milestones.filter((item) => item.tone === "reached").length,
    }),
    [milestones],
  );

  const visible = milestones.filter((item) => {
    if (filter === "all") return true;
    if (filter === "upcoming") {
      return item.tone === "upcoming" || item.tone === "today";
    }
    return item.tone === filter;
  });

  const openTask = (taskId: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "tasks");
    next.set("task", String(taskId));
    setSearchParams(next);
  };

  const reload = () => setReloadKey((value) => value + 1);

  const saveMilestone = async (payload: SaveMilestonePayload) => {
    setSaving(true);
    try {
      if (editor && editor !== "create") {
        await projectApi.updateMilestone(projectId, editor.id, {
          ...payload,
          status: editor.status,
        });
        toast.success(t("pages.projects.milestones.updated"));
      } else {
        await projectApi.createMilestone(projectId, payload);
        toast.success(t("pages.projects.milestones.created"));
      }
      setEditor(null);
      reload();
    } catch (saveError) {
      toastApiError(saveError);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    milestone: MilestoneItem,
    status: MilestoneStatus,
  ) => {
    setMenuId(null);
    try {
      await projectApi.updateMilestone(
        projectId,
        milestone.id,
        toPayload(milestone, status),
      );
      toast.success(t("pages.projects.milestones.updated"));
      reload();
    } catch (saveError) {
      toastApiError(saveError);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await projectApi.deleteMilestone(projectId, pendingDelete.id);
      toast.success(t("pages.projects.milestones.deleted"));
      setPendingDelete(null);
      reload();
    } catch (deleteError) {
      toastApiError(deleteError);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-2xl bg-white" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 animate-pulse rounded-2xl bg-white" />
          <div className="h-20 animate-pulse rounded-2xl bg-white" />
          <div className="h-20 animate-pulse rounded-2xl bg-white" />
        </div>
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
            {t("pages.projects.milestones.title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            {t("pages.projects.milestones.subtitle")}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setEditor("create")}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {t("pages.projects.milestones.create")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FilterStat
          tone="blue"
          icon={<Flag className="size-4" />}
          label={t("pages.projects.milestones.filters.all")}
          value={milestones.length}
          hint={t("pages.projects.milestones.hints.all")}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterStat
          tone="violet"
          icon={<CalendarClock className="size-4" />}
          label={t("pages.projects.milestones.upcoming")}
          value={counts.upcoming}
          hint={t("pages.projects.milestones.hints.upcoming")}
          active={filter === "upcoming"}
          onClick={() => setFilter("upcoming")}
        />
        <FilterStat
          tone="rose"
          icon={<AlarmClock className="size-4" />}
          label={t("pages.projects.milestones.overdue")}
          value={counts.overdue}
          hint={t("pages.projects.milestones.hints.overdue")}
          active={filter === "overdue"}
          onClick={() => setFilter("overdue")}
        />
        <FilterStat
          tone="emerald"
          icon={<CircleCheck className="size-4" />}
          label={t("pages.projects.milestones.reached")}
          value={counts.reached}
          hint={t("pages.projects.milestones.hints.reached")}
          active={filter === "reached"}
          onClick={() => setFilter("reached")}
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          {error}
        </p>
      ) : milestones.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Flag className="size-5" />
          </span>
          <p className="mt-3 text-base font-semibold text-slate-800">
            {t("pages.projects.milestones.empty")}
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {t("pages.projects.milestones.emptyHint")}
          </p>
        </div>
      ) : (
        <>
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
              {t("pages.projects.milestones.filterEmpty")}
            </p>
          ) : (
            <ol className="relative space-y-4 border-l border-slate-200 pl-6">
              {visible.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  language={i18n.language}
                  menuOpen={menuId === milestone.id}
                  canManage={canManage}
                  onMenu={() =>
                    setMenuId((current) =>
                      current === milestone.id ? null : milestone.id,
                    )
                  }
                  onEdit={() => {
                    setMenuId(null);
                    setEditor(milestone);
                  }}
                  onStatus={(status) => changeStatus(milestone, status)}
                  onDelete={() => {
                    setMenuId(null);
                    setPendingDelete(milestone);
                  }}
                  onOpenTask={openTask}
                />
              ))}
            </ol>
          )}
        </>
      )}

      <MilestoneFormModal
        open={editor != null}
        projectId={projectId}
        milestone={editor && editor !== "create" ? editor : null}
        phases={phases}
        saving={saving}
        onClose={() => {
          if (!saving) setEditor(null);
        }}
        onSubmit={saveMilestone}
      />
      <ConfirmModal
        open={pendingDelete != null}
        title={t("pages.projects.milestones.deleteTitle")}
        description={t("pages.projects.milestones.deleteDescription")}
        confirmText={t("pages.projects.milestones.delete")}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

const FILTER_RING: Record<StatTone, string> = {
  blue: "ring-blue-300",
  violet: "ring-violet-300",
  rose: "ring-rose-300",
  emerald: "ring-emerald-300",
};

function FilterStat({
  label,
  value,
  hint,
  icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  tone: StatTone;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "cursor-pointer rounded-2xl text-left transition",
        active && "ring-2 ring-offset-2",
        active && FILTER_RING[tone],
      )}
    >
      <StatCard
        tone={tone}
        icon={icon}
        label={label}
        value={String(value)}
        hint={hint}
      />
    </button>
  );
}

function MilestoneCard({
  milestone,
  language,
  menuOpen,
  canManage,
  onMenu,
  onEdit,
  onStatus,
  onDelete,
  onOpenTask,
}: {
  milestone: MilestoneItem;
  language: string;
  menuOpen: boolean;
  canManage: boolean;
  onMenu: () => void;
  onEdit: () => void;
  onStatus: (status: MilestoneStatus) => void;
  onDelete: () => void;
  onOpenTask: (taskId: number) => void;
}) {
  const { t } = useTranslation();
  const when = timingLabel(milestone, language, t);
  const preview = milestone.tasks.slice(0, 4);

  return (
    <li className={cn("relative", menuOpen && "z-20")}>
      <span
        className={cn(
          "absolute top-4 -left-[31px] size-3.5 rounded-full ring-4 ring-slate-50",
          TONE_DOT[milestone.tone],
        )}
      />
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
              {formatProjectDate(milestone.dueDate, language)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {milestone.name}
              </h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  TONE_CHIP[milestone.tone],
                )}
              >
                {t(`pages.projects.milestones.tones.${milestone.tone}`)}
              </span>
            </div>
          </div>
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
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <MenuButton
                    label={t("pages.projects.milestones.edit")}
                    onClick={onEdit}
                  />
                  {milestone.status === "REACHED" ? (
                    <MenuButton
                      label={t("pages.projects.milestones.reopen")}
                      onClick={() => onStatus("OPEN")}
                    />
                  ) : (
                    <MenuButton
                      label={t("pages.projects.milestones.markReached")}
                      onClick={() => onStatus("REACHED")}
                    />
                  )}
                  <MenuButton
                    label={t("pages.projects.milestones.delete")}
                    danger
                    onClick={onDelete}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {milestone.description && (
          <p className="mt-2 text-sm text-slate-600">{milestone.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {milestone.phase && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">
              {milestone.phase.name}
            </span>
          )}
          <span className="font-medium text-slate-500">{when}</span>
        </div>

        {milestone.taskCount > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>
                {t("pages.projects.milestones.progress", {
                  done: milestone.doneCount,
                  total: milestone.taskCount,
                })}
              </span>
              <span className="font-semibold text-slate-700">
                {milestone.percent}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full",
                  milestone.percent === 100 ? "bg-emerald-500" : "bg-amber-500",
                )}
                style={{ width: `${milestone.percent}%` }}
              />
            </div>
            <ul className="mt-2 divide-y divide-slate-100">
              {preview.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTask(task.id)}
                    className="flex w-full cursor-pointer items-center gap-2 py-1.5 text-left"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: taskStatusColor(task.status) }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {task.code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {milestone.tasks.length > preview.length && (
              <p className="pt-1 text-xs text-slate-400">
                +{milestone.tasks.length - preview.length}
              </p>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

function timingLabel(
  milestone: MilestoneItem,
  language: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (milestone.tone === "reached") {
    const date = milestone.reachedAt
      ? formatProjectDate(milestone.reachedAt, language)
      : formatProjectDate(milestone.dueDate, language);
    return t("pages.projects.milestones.reachedOn", { date });
  }
  if (milestone.tone === "today") return t("pages.projects.milestones.dueToday");
  const days = Math.abs(milestone.daysFromToday);
  if (milestone.tone === "overdue") {
    return days === 1
      ? t("pages.projects.milestones.dayOver")
      : t("pages.projects.milestones.daysOver", { count: days });
  }
  return days === 1
    ? t("pages.projects.milestones.dayLeft")
    : t("pages.projects.milestones.daysLeft", { count: days });
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
