import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type OverviewPanelProps = {
  title: string;
  to?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function OverviewPanel({
  title,
  to,
  extra,
  children,
  className,
}: OverviewPanelProps) {
  const { t } = useTranslation();
  const base =
    "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm";

  const content = (
    <>
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {extra ??
          (to && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400 transition-colors group-hover:text-primary">
              {t("pages.orgDashboard.detail")}
              <ChevronRight className="size-3.5" />
            </span>
          ))}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          base,
          "group transition-shadow hover:shadow-md",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return <section className={cn(base, className)}>{content}</section>;
}
