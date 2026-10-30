import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/features/work/data/org-overview.mock";

type ActivityListProps = {
  items: ActivityItem[];
  compact?: boolean;
  className?: string;
};

const toneClasses: Record<ActivityItem["tone"], string> = {
  blue: "bg-primary",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
};

export default function ActivityList({
  items,
  compact = false,
  className,
}: ActivityListProps) {
  const { i18n } = useTranslation();
  const pick = (value: { vi: string; en: string }) =>
    i18n.language.startsWith("en") ? value.en : value.vi;

  return (
    <ul
      className={cn(
        "flex min-h-0 flex-col",
        compact ? "h-full justify-between gap-1.5" : "gap-4",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0 gap-2.5">
          <span
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              toneClasses[item.tone],
            )}
          />
          <div className="min-w-0">
            <p
              className={cn(
                "leading-snug text-slate-700",
                compact ? "line-clamp-1 text-xs" : "text-sm",
              )}
            >
              {pick(item.message)}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
              <span>{pick(item.time)}</span>
              <span className="truncate">{item.project}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
