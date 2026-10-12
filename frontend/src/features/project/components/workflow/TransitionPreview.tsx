import { useTranslation } from "react-i18next";
import {
  unreachableStatusIds,
} from "@/features/project/components/workflow/workflow-flow";
import type { ProjectWorkflow } from "@/features/project/types/project.type";
import { cn } from "@/lib/utils";

type TransitionPreviewProps = {
  workflow: ProjectWorkflow;
};

export default function TransitionPreview({ workflow }: TransitionPreviewProps) {
  const { t } = useTranslation();
  const initialCount = workflow.statuses.filter((status) => status.isInitial)
    .length;
  const unreachable = new Set(unreachableStatusIds(workflow));

  if (workflow.statuses.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        {t("pages.projects.workflowPanel.preview")}
      </h3>
      {initialCount !== 1 && (
        <p className="mt-2 text-sm text-amber-700">
          {t("pages.projects.workflowPanel.needOneInitial")}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {workflow.statuses.map((status) => {
          const outgoing = workflow.transitions.filter(
            (transition) =>
              transition.isActive && transition.fromStatusId === status.id,
          );
          const blocked = unreachable.has(status.id);
          return (
            <div
              key={status.id}
              className={cn(
                "min-w-40 rounded-xl border bg-slate-50 p-3",
                blocked ? "border-amber-300" : "border-slate-200",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color ?? "#94A3B8" }}
                />
                <span className="text-sm font-semibold text-slate-800">
                  {status.name}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {status.isInitial && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {t("pages.projects.workflowPanel.initial")}
                  </span>
                )}
                {status.isFinal && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {t("pages.projects.workflowPanel.final")}
                  </span>
                )}
              </div>
              {blocked && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  {t("pages.projects.workflowPanel.unreachable")}
                </p>
              )}
              {outgoing.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {outgoing.map((transition) => {
                    const target = workflow.statuses.find(
                      (item) => item.id === transition.toStatusId,
                    );
                    return (
                      <li key={transition.id}>
                        {transition.name} → {target?.name ?? `#${transition.toStatusId}`}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
