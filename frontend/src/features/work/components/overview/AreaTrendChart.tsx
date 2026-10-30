import { useId, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type AreaSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type AreaTrendChartProps = {
  labels: string[];
  series: AreaSeries[];
  className?: string;
};

function niceMax(value: number) {
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

export default function AreaTrendChart({
  labels,
  series,
  className,
}: AreaTrendChartProps) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const width = 480;
  const height = 170;
  const padding = { left: 32, right: 12, top: 8, bottom: 22 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = niceMax(
    Math.max(1, ...series.flatMap((item) => item.values)),
  );
  const ticks = [0, 0.5, 1].map((ratio) => maxValue * ratio);

  const xAt = (index: number) =>
    padding.left + (index / Math.max(1, labels.length - 1)) * innerWidth;
  const yAt = (value: number) =>
    padding.top + innerHeight - (value / maxValue) * innerHeight;

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    for (let index = 1; index < labels.length; index += 1) {
      if (Math.abs(xAt(index) - x) < Math.abs(xAt(nearest) - x))
        nearest = index;
    }
    setHovered(nearest);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="mb-1 flex shrink-0 flex-wrap gap-x-3 gap-y-1">
        {series.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          role="img"
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            {series.map((item) => (
              <linearGradient
                key={item.key}
                id={`${gradientId}-${item.key}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((tick) => (
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
                {Math.round(tick)}
              </text>
            </g>
          ))}
          {series.map((item) => {
            const line = item.values
              .map(
                (value, index) =>
                  `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(value)}`,
              )
              .join(" ");
            return (
              <g key={item.key}>
                <path
                  d={`${line} L ${xAt(item.values.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`}
                  fill={`url(#${gradientId}-${item.key})`}
                />
                <path
                  d={line}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
          {labels.map((label, index) => (
            <text
              key={label}
              x={xAt(index)}
              y={height - 6}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {label}
            </text>
          ))}
          {hovered !== null && (
            <g pointerEvents="none">
              <line
                x1={xAt(hovered)}
                x2={xAt(hovered)}
                y1={padding.top}
                y2={padding.top + innerHeight}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
              {series.map((item) => (
                <circle
                  key={item.key}
                  cx={xAt(hovered)}
                  cy={yAt(item.values[hovered] ?? 0)}
                  r="3.5"
                  fill="#fff"
                  stroke={item.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>
        {hovered !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-28 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${Math.min(85, Math.max(15, (xAt(hovered) / width) * 100))}%`,
            }}
          >
            <p className="mb-1 font-semibold text-slate-700">
              {labels[hovered]}
            </p>
            {series.map((item) => (
              <p
                key={item.key}
                className="flex items-center justify-between gap-4 text-slate-500"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <span className="font-semibold text-slate-800">
                  {item.values[hovered] ?? 0}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
