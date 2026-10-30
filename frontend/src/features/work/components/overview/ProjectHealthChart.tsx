import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DANGER_GAP,
  healthColors,
  type HealthLevel,
  type ProjectHealth,
} from "@/features/work/data/org-overview-dashboard";

type ProjectHealthChartProps = {
  projects: ProjectHealth[];
  className?: string;
};

const levels: HealthLevel[] = ["danger", "warn", "ok"];

export default function ProjectHealthChart({
  projects,
  className,
}: ProjectHealthChartProps) {
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const width = 440;
  const height = 270;
  const padding = { left: 36, right: 14, top: 10, bottom: 34 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xAt = (value: number) => padding.left + (value / 100) * innerWidth;
  const yAt = (value: number) =>
    padding.top + innerHeight - (value / 100) * innerHeight;
  const hovered = projects.find((item) => item.id === hoveredId);
  const dangerPolygon = [
    [DANGER_GAP, 0],
    [100, 100 - DANGER_GAP],
    [100, 0],
  ]
    .map(([x, y]) => `${xAt(x)},${yAt(y)}`)
    .join(" ");

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          role="img"
        >
          <defs>
            <pattern
              id="danger-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="#fda4af"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="#e2e8f0"
                strokeDasharray="3 4"
              />
              <text
                x={padding.left - 6}
                y={yAt(tick) + 3.5}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {tick}
              </text>
              <text
                x={xAt(tick)}
                y={height - 18}
                textAnchor="middle"
                className="fill-slate-400 text-[10px]"
              >
                {tick}
              </text>
            </g>
          ))}
          <polygon
            points={dangerPolygon}
            fill="url(#danger-hatch)"
            opacity="0.55"
          />
          <polygon points={dangerPolygon} fill="#ffe4e6" opacity="0.5" />
          <text
            x={xAt(100) - 6}
            y={yAt(0) - 8}
            textAnchor="end"
            className="fill-rose-500 text-[10px] font-semibold uppercase"
          >
            {t("pages.orgDashboard.health.dangerZone")}
          </text>
          <line
            x1={xAt(0)}
            y1={yAt(0)}
            x2={xAt(100)}
            y2={yAt(100)}
            stroke="#94a3b8"
            strokeDasharray="5 4"
          />
          <text
            x={padding.left + innerWidth / 2}
            y={height - 3}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {t("pages.orgDashboard.health.axisTime")}
          </text>
          <text
            x={10}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 10 ${padding.top + innerHeight / 2})`}
            className="fill-slate-500 text-[10px]"
          >
            {t("pages.orgDashboard.health.axisProgress")}
          </text>
          {projects.map((project) => {
            const radius = 5 + Math.sqrt(project.tasksTotal) * 1.1;
            const color = healthColors[project.level];
            return (
              <g
                key={project.id}
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {project.level === "danger" && (
                  <circle
                    cx={xAt(project.elapsed)}
                    cy={yAt(project.progress)}
                    r={radius + 5}
                    fill={color}
                    opacity="0.2"
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={xAt(project.elapsed)}
                  cy={yAt(project.progress)}
                  r={radius}
                  fill={color}
                  fillOpacity="0.75"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>
        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-52 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(xAt(hovered.elapsed) / width) * 100}%`,
              top: `${(yAt(hovered.progress) / height) * 100}%`,
            }}
          >
            <p className="font-semibold text-slate-800">{hovered.name}</p>
            <p className="mt-0.5 text-slate-500">
              {t("pages.orgDashboard.health.tooltip", {
                progress: hovered.progress,
                elapsed: hovered.elapsed,
              })}
            </p>
          </div>
        )}
      </div>
      <div className="mt-1 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1">
        {levels.map((level) => (
          <span
            key={level}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: healthColors[level] }}
            />
            {t(`pages.orgDashboard.health.${level}`)}
            <span className="font-semibold text-slate-800">
              {projects.filter((item) => item.level === level).length}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
