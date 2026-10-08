export type ShareBarItem = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

type ShareBarsProps = {
  items: ShareBarItem[];
};

export default function ShareBars({ items }: ShareBarsProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-medium text-slate-500">
              {item.value}{" "}
              <span className="text-slate-400">{item.percent.toFixed(2)}%</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, item.percent))}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
