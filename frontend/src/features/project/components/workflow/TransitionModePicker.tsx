import { useTranslation } from "react-i18next";
import type { WorkflowTransitionMode } from "@/features/project/types/project.type";
import { cn } from "@/lib/utils";

const OPTIONS = ["FREE", "STRICT"] as const;

type TransitionModePickerProps = {
  mode: WorkflowTransitionMode;
  disabled?: boolean;
  emptyStrict?: boolean;
  onChange: (mode: WorkflowTransitionMode) => void;
};

export default function TransitionModePicker({
  mode,
  disabled = false,
  emptyStrict = false,
  onChange,
}: TransitionModePickerProps) {
  const { t } = useTranslation();
  const note =
    mode === "STRICT" && emptyStrict
      ? t("pages.projects.workflowPanel.transitionModeStrictEmpty")
      : mode === "FREE"
        ? t("pages.projects.workflowPanel.transitionModeFreeNote")
        : t("pages.projects.workflowPanel.transitionModeStrictNote");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">
        {t("pages.projects.workflowPanel.transitionModeTitle")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = mode === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => {
                if (selected || disabled) return;
                onChange(option);
              }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 bg-white",
                disabled
                  ? "cursor-not-allowed opacity-70"
                  : selected
                    ? "cursor-default"
                    : "cursor-pointer hover:border-slate-300",
              )}
            >
              <span className="block text-sm font-semibold text-slate-900">
                {t(
                  option === "FREE"
                    ? "pages.projects.workflowPanel.transitionModeFree"
                    : "pages.projects.workflowPanel.transitionModeStrict",
                )}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {t(
                  option === "FREE"
                    ? "pages.projects.workflowPanel.transitionModeFreeHint"
                    : "pages.projects.workflowPanel.transitionModeStrictHint",
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-500">{note}</p>
    </section>
  );
}
