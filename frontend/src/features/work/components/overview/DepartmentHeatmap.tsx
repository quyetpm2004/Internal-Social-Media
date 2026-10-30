import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DepartmentHeat } from "@/features/work/data/org-overview-dashboard";

type DepartmentHeatmapProps = {
  rows: DepartmentHeat[];
  orientation?: "rows" | "columns";
  className?: string;
};

type HeatColumn = "late" | "idle" | "kpi";

const columns: HeatColumn[] = ["late", "idle", "kpi"];

function cellTone(value: number, column: HeatColumn) {
  if (column === "kpi") {
    if (value >= 80) return "bg-emerald-100 text-emerald-700";
    if (value >= 70) return "bg-amber-100 text-amber-700";
    return "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.45)]";
  }
  if (value === 0) return "bg-slate-50 text-slate-300";
  if (column === "idle") {
    return value >= 2 ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-700";
  }
  return value >= 2
    ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.45)]"
    : "bg-amber-100 text-amber-700";
}

export default function DepartmentHeatmap({
  rows,
  orientation = "rows",
  className,
}: DepartmentHeatmapProps) {
  const { t } = useTranslation();

  if (orientation === "columns") {
    return (
      <div
        className={cn("grid gap-1.5", className)}
        style={{
          gridTemplateColumns: `5.5rem repeat(${rows.length}, minmax(0, 1fr))`,
        }}
      >
        <span />
        {rows.map((row) => (
          <span
            key={row.id}
            className="truncate text-center text-xs font-medium text-slate-700"
          >
            {row.name}
            <span className="ml-1 text-[11px] font-normal text-slate-400">
              {row.headcount}
            </span>
          </span>
        ))}
        {columns.map((column) => (
          <div key={column} className="contents">
            <span className="flex items-center text-xs font-medium text-slate-500">
              {t(`pages.orgDashboard.heat.${column}`)}
            </span>
            {rows.map((row) => (
              <span
                key={row.id}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg text-sm font-semibold tabular-nums",
                  cellTone(row[column], column),
                )}
              >
                {row[column]}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid h-full min-h-0 grid-cols-[minmax(0,1fr)_repeat(3,3.75rem)] gap-1.5",
        className,
      )}
      style={{
        gridTemplateRows: `auto repeat(${rows.length}, minmax(0, 1fr))`,
      }}
    >
      <span />
      {columns.map((column) => (
        <span
          key={column}
          className="text-center text-[11px] font-medium text-slate-400"
        >
          {t(`pages.orgDashboard.heat.${column}`)}
        </span>
      ))}
      {rows.map((row) => (
        <div key={row.id} className="contents">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-slate-700">
            {row.name}
            <span className="text-[11px] font-normal text-slate-400">
              {row.headcount}
            </span>
          </span>
          {columns.map((column) => (
            <span
              key={column}
              className={cn(
                "flex min-h-6 items-center justify-center rounded-lg text-sm font-semibold tabular-nums",
                cellTone(row[column], column),
              )}
            >
              {row[column]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
