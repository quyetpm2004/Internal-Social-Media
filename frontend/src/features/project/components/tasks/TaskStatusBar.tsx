import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { taskStatusColor } from "@/features/project/components/tasks/task-display";
import type { TaskListSummary } from "@/features/project/types/task.type";

function statusChipStyle(color: string, active: boolean): CSSProperties {
  const wash = active ? 20 : 12;
  const edge = active ? 58 : 32;
  return {
    backgroundColor: `color-mix(in srgb, ${color} ${wash}%, white)`,
    borderColor: `color-mix(in srgb, ${color} ${edge}%, white)`,
    color: `color-mix(in srgb, ${color} 70%, #0f172a)`,
    boxShadow: active
      ? `0 0 0 3px color-mix(in srgb, ${color} 18%, transparent)`
      : undefined,
  };
}

type TaskStatusBarProps = {
  workflowId: number | null;
  statusIds: number[];
  summary: TaskListSummary | null;
  onStatusToggle: (statusId: number) => void;
  onWorkflowPick: (workflowId: number) => void;
};

export default function TaskStatusBar({
  workflowId,
  statusIds,
  summary,
  onStatusToggle,
  onWorkflowPick,
}: TaskStatusBarProps) {
  const { t } = useTranslation();

  if (workflowId) {
    const statuses = summary?.mode === "status" ? (summary.statuses ?? []) : [];
    if (statuses.length === 0) return null;
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((status) => {
          const active = statusIds.includes(status.id);
          const color = taskStatusColor(status);
          return (
            <button
              key={status.id}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusToggle(status.id)}
              style={statusChipStyle(color, active)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-[background-color,border-color,box-shadow] hover:brightness-[0.97]"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {status.name}
              <span
                className="min-w-5 rounded-full bg-white/70 px-1.5 text-center text-xs font-semibold"
              >
                {status.count}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const workflows = summary?.mode === "workflow" ? (summary.workflows ?? []) : [];
  if (workflows.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {workflows.map((workflow) => (
        <button
          key={workflow.id}
          type="button"
          onClick={() => onWorkflowPick(workflow.id)}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-primary/40 hover:bg-primary/5"
        >
          <p className="font-semibold text-slate-900">{workflow.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {t("pages.projects.tasks.taskCount", { count: workflow.count })}
          </p>
        </button>
      ))}
    </div>
  );
}
