import { cn } from "@/lib/utils";

type BudgetMeterProps = {
  usedLabel: string;
  totalLabel: string;
  percent: number;
  status: string;
  over?: boolean;
};

export default function BudgetMeter({
  usedLabel,
  totalLabel,
  percent,
  status,
  over = false,
}: BudgetMeterProps) {
  const width = Math.max(0, Math.min(100, percent));

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3 text-sm">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-900">{usedLabel}</span>
          <span className="text-slate-400"> / {totalLabel}</span>
        </p>
        <p className={cn("font-bold", over ? "text-rose-600" : "text-emerald-600")}>
          {percent}%
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full", over ? "bg-rose-500" : "bg-emerald-500")}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className={cn("mt-2 text-xs font-medium", over ? "text-rose-500" : "text-emerald-600")}>
        {status}
      </p>
    </div>
  );
}
