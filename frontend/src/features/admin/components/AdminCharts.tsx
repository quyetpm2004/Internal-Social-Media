type BarChartProps = {
  labels: string[];
  series: Array<{
    key: string;
    label: string;
    values: number[];
    color: string;
  }>;
};

export function AdminBarChart({ labels, series }: BarChartProps) {
  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => item.values),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {series.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex h-52 items-end gap-2 border-b border-gray-200 pb-2">
        {labels.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-40 w-full items-end justify-center gap-1">
              {series.map((item) => {
                const value = item.values[index] ?? 0;
                const height = `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%`;

                return (
                  <div
                    key={item.key}
                    className="w-2 rounded-t-sm transition-all sm:w-2.5"
                    style={{
                      height,
                      backgroundColor: item.color,
                    }}
                    title={`${item.label}: ${value}`}
                  />
                );
              })}
            </div>
            <span className="truncate text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type HorizontalBarChartProps = {
  items: Array<{ label: string; value: number; color?: string }>;
};

export function AdminHorizontalBarChart({ items }: HorizontalBarChartProps) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate text-gray-700">{item.label}</span>
            <span className="font-medium text-gray-900">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color ?? "#2563eb",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type DonutChartProps = {
  items: Array<{ label: string; value: number; color: string }>;
};

export function AdminDonutChart({ items }: DonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const segments = items.map((item) => {
    const fraction = item.value / total;
    const dash = fraction * circumference;
    const segment = {
      ...item,
      dash,
      offset,
      fraction,
    };
    offset += dash;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="16"
        />
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="16"
            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
            strokeDashoffset={-segment.offset}
            transform="rotate(-90 60 60)"
          />
        ))}
        <text
          x="60"
          y="58"
          textAnchor="middle"
          className="fill-gray-900 text-lg font-semibold"
        >
          {total}
        </text>
        <text
          x="60"
          y="74"
          textAnchor="middle"
          className="fill-gray-500 text-[10px]"
        >
          posts
        </text>
      </svg>

      <div className="w-full space-y-2">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-gray-700">{segment.label}</span>
            </div>
            <span className="font-medium text-gray-900">
              {segment.value} ({Math.round(segment.fraction * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
