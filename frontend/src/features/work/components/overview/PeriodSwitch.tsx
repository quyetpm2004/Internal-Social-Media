import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  periodRanges,
  type PeriodKey,
} from "@/features/work/data/org-overview.mock";

type PeriodSwitchProps = {
  period: PeriodKey;
  onChange: (period: PeriodKey) => void;
};

const periods: PeriodKey[] = ["week", "month", "quarter"];

export default function PeriodSwitch({ period, onChange }: PeriodSwitchProps) {
  const { t } = useTranslation();
  const range = periodRanges[period];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-slate-500 tabular-nums">
        {range.from} → {range.to}
      </span>
      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {periods.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1 text-sm font-medium transition-colors",
              period === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {t(`pages.workOverview.periods.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
