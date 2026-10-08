import { Globe, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ProjectVisibility } from "@/features/project/types/project.type";

type VisibilityPickerProps = {
  value: ProjectVisibility;
  onChange: (value: ProjectVisibility) => void;
};

export function VisibilityPicker({ value, onChange }: VisibilityPickerProps) {
  const { t } = useTranslation();
  const options: Array<{
    value: ProjectVisibility;
    label: string;
    hint: string;
    icon: typeof Globe;
  }> = [
    {
      value: "PUBLIC",
      label: t("pages.projects.public"),
      hint: t("pages.projects.publicHint"),
      icon: Globe,
    },
    {
      value: "PRIVATE",
      label: t("pages.projects.private"),
      hint: t("pages.projects.privateHint"),
      icon: Lock,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{option.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-xs",
                  selected ? "text-primary/80" : "text-slate-500",
                )}
              >
                {option.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

type UrgentSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function UrgentSwitch({ checked, onChange }: UrgentSwitchProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
    >
      <span className="text-sm font-medium text-slate-700">
        {t("pages.projects.urgent")}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
