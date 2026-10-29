import { useState, type MouseEvent } from "react";

type ChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type TrendChartProps = {
  labels: string[];
  series: ChartSeries[];
  /** Hậu tố hiển thị sau giá trị trong tooltip, ví dụ "%". */
  valueSuffix?: string;
};

function smoothPath(
  points: Array<{ x: number; y: number }>,
  bounds: { min: number; max: number },
) {
  // Giữ điểm điều khiển trong vùng vẽ để đường cong không vượt quá 0 hoặc giá trị lớn nhất.
  const clampY = (y: number) => Math.min(bounds.max, Math.max(bounds.min, y));
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const control1x = current.x + (next.x - previous.x) / 6;
    const control1y = clampY(current.y + (next.y - previous.y) / 6);
    const control2x = next.x - (after.x - current.x) / 6;
    const control2y = clampY(next.y - (after.y - current.y) / 6);
    path += ` C ${control1x} ${control1y}, ${control2x} ${control2y}, ${next.x} ${next.y}`;
  }
  return path;
}

function niceMax(value: number) {
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

export default function TrendChart({
  labels,
  series,
  valueSuffix = "",
}: TrendChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const width = 760;
  const height = 240;
  const padding = { left: 40, right: 16, top: 16, bottom: 32 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = niceMax(
    Math.max(1, ...series.flatMap((item) => item.values)),
  );
  const ticks = [0, 1, 2, 3, 4].map((step) => (maxValue / 4) * step);

  const xAt = (index: number) => {
    if (labels.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (labels.length - 1)) * innerWidth;
  };
  const yAt = (value: number) =>
    padding.top + innerHeight - (value / maxValue) * innerHeight;

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    if (labels.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    for (let index = 1; index < labels.length; index += 1) {
      if (Math.abs(xAt(index) - x) < Math.abs(xAt(nearest) - x))
        nearest = index;
    }
    setHovered(nearest);
  };

  const tooltipLeft =
    hovered === null
      ? 0
      : Math.min(88, Math.max(12, (xAt(hovered) / width) * 100));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
        {series.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-2 text-xs text-slate-500"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full"
          role="img"
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
        >
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
                x={padding.left - 8}
                y={yAt(tick) + 4}
                textAnchor="end"
                className="fill-slate-400 text-[11px]"
              >
                {Math.round(tick)}
              </text>
            </g>
          ))}
          {series.map((item) => {
            const points = item.values.map((value, index) => ({
              x: xAt(index),
              y: yAt(value),
            }));
            return (
              <path
                key={item.key}
                d={smoothPath(points, {
                  min: padding.top,
                  max: padding.top + innerHeight,
                })}
                fill="none"
                stroke={item.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {labels.map((label, index) => (
            <text
              key={label}
              x={xAt(index)}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-400 text-[11px]"
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
                  r="4.5"
                  fill="#fff"
                  stroke={item.color}
                  strokeWidth="2.5"
                />
              ))}
            </g>
          )}
        </svg>
        {hovered !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-28 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: `${tooltipLeft}%` }}
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
                  {valueSuffix}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
