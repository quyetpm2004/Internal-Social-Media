export type MeterRow = {
  name: string;
  detail: string;
  percent: number;
  color: string;
};

type MeterListProps = {
  rows: MeterRow[];
};

export default function MeterList({ rows }: MeterListProps) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span
            className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: row.color }}
          >
            {row.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{row.name}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, row.percent))}%` }}
              />
            </div>
          </div>
          <span className="text-right text-xs text-slate-500">
            <span className="block font-medium text-slate-700">{row.detail}</span>
            <span>{row.percent}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
