import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  riskColors,
  type OrgRisk,
} from "@/features/work/data/org-overview-dashboard";

type RiskGaugeProps = {
  risk: OrgRisk;
  factorLimit?: number;
  className?: string;
};

export default function RiskGauge({
  risk,
  factorLimit = 3,
  className,
}: RiskGaugeProps) {
  const { t } = useTranslation();
  const color = riskColors[risk.level];
  const arc = "M 20 100 A 80 80 0 0 1 180 100";
  const factors = risk.factors.slice(0, factorLimit);
  const maxPoints = Math.max(1, ...factors.map((factor) => factor.points));

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3", className)}>
      <div className="relative mx-auto w-full max-w-56 shrink-0">
        <svg viewBox="0 0 200 112" className="w-full" role="img">
          <path
            d={arc}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="14"
            strokeLinecap="round"
            pathLength={100}
          />
          <path
            d={arc}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${risk.score} 100`}
            className="drop-shadow-[0_0_6px_rgba(244,63,94,0.35)] transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p
            className="text-4xl leading-none font-bold tracking-tight tabular-nums"
            style={{ color }}
          >
            {risk.score}
          </p>
          <p className="mt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {t(`pages.orgDashboard.risk.level.${risk.level}`)}
          </p>
        </div>
      </div>
      <ul className="min-h-0 flex-1 space-y-2">
        {factors.map((factor) => (
          <li key={factor.id}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                {t(`pages.orgDashboard.risk.factors.${factor.id}`)}{" "}
                <span className="font-semibold text-slate-800">
                  {factor.count}
                </span>
              </span>
              <span className="font-semibold text-rose-600 tabular-nums">
                {t("pages.orgDashboard.risk.points", { count: factor.points })}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-rose-400"
                style={{ width: `${(factor.points / maxPoints) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
