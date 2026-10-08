type ChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type TrendChartProps = {
  labels: string[];
  series: ChartSeries[];
};

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const control1x = current.x + (next.x - previous.x) / 6;
    const control1y = current.y + (next.y - previous.y) / 6;
    const control2x = next.x - (after.x - current.x) / 6;
    const control2y = next.y - (after.y - current.y) / 6;
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

export default function TrendChart({ labels, series }: TrendChartProps) {
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
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        role="img"
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
              d={smoothPath(points)}
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
      </svg>
    </div>
  );
}
