export type BarSeries = {
  label: string;
  color: string;
};

export type BarGroup = {
  label: string;
  values: number[];
};

type GroupedBarsProps = {
  series: BarSeries[];
  groups: BarGroup[];
};

export default function GroupedBars({ series, groups }: GroupedBarsProps) {
  const max = Math.max(1, ...groups.flatMap((group) => group.values));

  return (
    <div>
      <div className="flex h-44 items-end gap-3">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              {group.values.map((value, index) => (
                <div
                  key={`${group.label}-${series[index]?.label ?? index}`}
                  className="w-3 rounded-t-md sm:w-4"
                  title={`${series[index]?.label ?? ""}: ${value}`}
                  style={{
                    height: `${(value / max) * 100}%`,
                    backgroundColor: series[index]?.color ?? "#94a3b8",
                    minHeight: value > 0 ? 4 : 0,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {group.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
        {series.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
