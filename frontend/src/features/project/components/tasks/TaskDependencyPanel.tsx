import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Layers, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { projectApi } from "@/features/project/api/project.api";
import DependencyFormModal from "@/features/project/components/tasks/DependencyFormModal";
import DependencyGroupFormModal from "@/features/project/components/tasks/DependencyGroupFormModal";
import { taskStatusColor } from "@/features/project/components/tasks/task-display";
import type {
  DependencyGroup,
  DependencyLagUnit,
  DependencyTaskRef,
  DependencyType,
  TaskDependency,
  TaskDependencyView,
} from "@/features/project/types/dependency.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type TaskDependencyPanelProps = {
  projectId: number;
  taskId: number;
  onOpenTask: (taskId: number) => void;
  onCountChange: (count: number) => void;
};

type DependencyEditor = {
  dependency: TaskDependency | null;
  groupId: number | null;
};

type GroupEditor = {
  group: DependencyGroup | null;
};

function TaskLink({
  task,
  onOpen,
}: {
  task: DependencyTaskRef;
  onOpen: (taskId: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="flex min-w-0 cursor-pointer items-center gap-2 text-left hover:text-primary"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: taskStatusColor(task.status) }}
      />
      <span className="shrink-0 font-mono text-xs text-slate-400">{task.code}</span>
      <span className="truncate text-sm font-medium text-slate-800">
        {task.title}
      </span>
    </button>
  );
}

function RelationBadges({
  type,
  lag,
  lagUnit,
}: {
  type: DependencyType;
  lag: number;
  lagUnit: DependencyLagUnit;
}) {
  const { t } = useTranslation();
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span
        title={t(`pages.projects.tasks.dependencies.types.${type}`)}
        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600"
      >
        {type}
      </span>
      {lag !== 0 && (
        <span className="text-xs text-slate-500">
          {lag > 0 ? "+" : "−"}
          {Math.abs(lag)} {t(`pages.projects.tasks.dependencies.units.${lagUnit}`)}
        </span>
      )}
    </span>
  );
}

export default function TaskDependencyPanel({
  projectId,
  taskId,
  onOpenTask,
  onCountChange,
}: TaskDependencyPanelProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<TaskDependencyView | null>(null);
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState<DependencyEditor | null>(null);
  const [groupEditor, setGroupEditor] = useState<GroupEditor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskDependency | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setView(null);
      try {
        const response = await projectApi.getTaskDependencies(projectId, taskId);
        if (!cancelled) setView(response.data);
      } catch (error) {
        if (!cancelled) toastApiError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, taskId]);

  const dependencies = useMemo(
    () => view?.groups.flatMap((group) => group.dependencies) ?? [],
    [view],
  );

  useEffect(() => {
    if (view) onCountChange(dependencies.length);
  }, [view, dependencies.length, onCountChange]);

  const excludedTaskIds = useMemo(
    () => [taskId, ...dependencies.map((item) => item.predecessor.id)],
    [taskId, dependencies],
  );

  const removeDependency = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await projectApi.deleteTaskDependency(
        projectId,
        taskId,
        pendingDelete.id,
      );
      setView(response.data);
      setPendingDelete(null);
      toast.success(t("pages.projects.tasks.dependencies.deleted"));
    } catch (error) {
      toastApiError(error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !view) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        {t("common.processing")}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">
          {t("pages.projects.tasks.dependencies.predecessors")}
        </p>
        {view.canEdit && (
          <div className="flex flex-wrap gap-2">
            {dependencies.length >= 2 && (
              <button
                type="button"
                onClick={() => setGroupEditor({ group: null })}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Layers className="size-4" />
                {t("pages.projects.tasks.dependencies.mergeGroup")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditor({ dependency: null, groupId: null })}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Plus className="size-4" />
              {t("pages.projects.tasks.dependencies.add")}
            </button>
          </div>
        )}
      </div>

      {view.groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {t("pages.projects.tasks.dependencies.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {view.groups.map((group, index) => {
            const manualOr =
              group.logicType === "OR" && group.selectionMode === "MANUAL";
            return (
              <li
                key={group.id}
                className="rounded-xl border border-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      {t("pages.projects.tasks.dependencies.groupName", {
                        index: index + 1,
                      })}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        group.logicType === "AND"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t(`pages.projects.tasks.dependencies.logic.${group.logicType}`)}
                    </span>
                    {group.logicType === "OR" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {t(`pages.projects.tasks.dependencies.mode.${group.selectionMode}`)}
                      </span>
                    )}
                    {manualOr && group.selectedDependencyId == null && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertTriangle className="size-3.5" />
                        {t("pages.projects.tasks.dependencies.noSelection")}
                      </span>
                    )}
                  </div>
                  {view.canEdit && (
                    <button
                      type="button"
                      onClick={() => setGroupEditor({ group })}
                      title={t("pages.projects.tasks.dependencies.groupSettings")}
                      className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                    >
                      <Settings2 className="size-4" />
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-slate-100">
                  {group.dependencies.map((dependency) => (
                    <li
                      key={dependency.id}
                      className={`flex items-center justify-between gap-3 px-3 py-2 ${
                        manualOr && group.selectedDependencyId === dependency.id
                          ? "bg-primary/5"
                          : ""
                      }`}
                    >
                      <TaskLink task={dependency.predecessor} onOpen={onOpenTask} />
                      <span className="flex shrink-0 items-center gap-2">
                        {manualOr &&
                          group.selectedDependencyId === dependency.id && (
                            <span className="text-xs font-semibold text-primary">
                              {t("pages.projects.tasks.dependencies.selected")}
                            </span>
                          )}
                        <RelationBadges
                          type={dependency.relationshipType}
                          lag={dependency.lag}
                          lagUnit={dependency.lagUnit}
                        />
                        {view.canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEditor({ dependency, groupId: group.id })
                              }
                              title={t("pages.projects.tasks.dependencies.edit")}
                              className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(dependency)}
                              title={t("pages.projects.tasks.dependencies.delete")}
                              className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">
          {t("pages.projects.tasks.dependencies.successors")}
        </p>
        {view.successors.length === 0 ? (
          <p className="text-sm text-slate-400">
            {t("pages.projects.tasks.dependencies.successorsEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {view.successors.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <TaskLink task={item.successor} onOpen={onOpenTask} />
                <RelationBadges
                  type={item.relationshipType}
                  lag={item.lag}
                  lagUnit={item.lagUnit}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <DependencyFormModal
        open={editor != null}
        projectId={projectId}
        taskId={taskId}
        groups={view.groups}
        dependency={editor?.dependency ?? null}
        currentGroupId={editor?.groupId ?? null}
        excludedTaskIds={excludedTaskIds}
        onClose={() => setEditor(null)}
        onSaved={setView}
      />

      <DependencyGroupFormModal
        open={groupEditor != null}
        projectId={projectId}
        taskId={taskId}
        dependencies={dependencies}
        group={groupEditor?.group ?? null}
        onClose={() => setGroupEditor(null)}
        onSaved={setView}
      />

      <ConfirmModal
        open={pendingDelete != null}
        title={t("pages.projects.tasks.dependencies.deleteTitle")}
        description={t("pages.projects.tasks.dependencies.deleteDescription", {
          code: pendingDelete?.predecessor.code ?? "",
        })}
        loading={deleting}
        onConfirm={() => void removeDependency()}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
    </div>
  );
}
