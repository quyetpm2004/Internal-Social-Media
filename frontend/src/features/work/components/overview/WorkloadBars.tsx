import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  OVERLOAD_THRESHOLD,
  WORKLOAD_CAPACITY,
} from "@/features/work/data/org-overview-dashboard";
import {
  avatarTones,
  type WorkloadRow,
} from "@/features/work/data/org-overview.mock";

type WorkloadBarsProps = {
  rows: WorkloadRow[];
  limit?: number;
  className?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const first = parts[0]?.[0] ?? "";
  return `${first}${last[0] ?? ""}`.toUpperCase();
}

export default function WorkloadBars({
  rows,
  limit,
  className,
}: WorkloadBarsProps) {
  const { t } = useTranslation();
  const sorted = [...rows]
    .sort((a, b) => b.inProject + b.outside - (a.inProject + a.outside))
    .slice(0, limit);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <ul className="flex min-h-0 flex-1 flex-col justify-between gap-1.5">
        {sorted.map((row) => {
          const total = row.inProject + row.outside;
          const overloaded = total >= OVERLOAD_THRESHOLD;
          const index = rows.findIndex((item) => item.id === row.id);
          return (
            <li key={row.id} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white",
                  avatarTones[index % avatarTones.length],
                )}
              >
                {initials(row.name)}
              </span>
              <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-700">
                {row.name}
              </span>
              <div className="relative flex h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full",
                    overloaded ? "bg-rose-500" : "bg-primary",
                  )}
                  style={{
                    width: `${Math.min(100, (row.inProject / WORKLOAD_CAPACITY) * 100)}%`,
                  }}
                />
                <div
                  className={cn(
                    "h-full",
                    overloaded ? "bg-rose-300" : "bg-violet-400",
                  )}
                  style={{
                    width: `${Math.min(100, (row.outside / WORKLOAD_CAPACITY) * 100)}%`,
                  }}
                />
              </div>
              <span
                className={cn(
                  "flex w-12 shrink-0 items-center justify-end gap-1 text-xs font-semibold tabular-nums",
                  overloaded ? "text-rose-600" : "text-slate-600",
                )}
              >
                {overloaded && <AlertTriangle className="size-3" />}
                {total}/{WORKLOAD_CAPACITY}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          {t("pages.orgDashboard.workload.inProject")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-violet-400" />
          {t("pages.orgDashboard.workload.outside")}
        </span>
      </div>
    </div>
  );
}
