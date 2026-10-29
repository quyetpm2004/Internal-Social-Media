import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DepartmentPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export default function DepartmentPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: DepartmentPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 @3xl:flex-row @3xl:items-start @3xl:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
