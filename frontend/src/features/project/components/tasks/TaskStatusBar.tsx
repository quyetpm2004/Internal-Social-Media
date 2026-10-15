import { useTranslation } from "react-i18next";
import { taskStatusColor } from "@/features/project/components/tasks/task-display";
import type { TaskListSummary } from "@/features/project/types/task.type";
import { cn } from "@/lib/utils";

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
          return (
            <button
              key={status.id}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusToggle(status.id)}
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                active
                  ? "border-primary bg-primary/5 text-slate-900 ring-2 ring-primary/30"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: taskStatusColor(status) }}
              />
              {status.name}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs font-semibold",
                  active ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600",
                )}
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
