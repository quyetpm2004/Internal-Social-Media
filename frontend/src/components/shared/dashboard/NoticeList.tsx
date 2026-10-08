import { cn } from "@/lib/utils";

export type NoticeTone = "rose" | "orange" | "amber" | "slate";

export type NoticeItem = {
  title: string;
  meta: string;
  badge: string;
  tone: NoticeTone;
};

const tones: Record<NoticeTone, string> = {
  rose: "bg-rose-50 text-rose-600",
  orange: "bg-orange-50 text-orange-600",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
};

type NoticeListProps = {
  items: NoticeItem[];
};

export default function NoticeList({ items }: NoticeListProps) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li
          key={`${item.title}-${item.meta}`}
          className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
            <p className="text-xs text-slate-400">{item.meta}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              tones[item.tone],
            )}
          >
            {item.badge}
          </span>
        </li>
      ))}
    </ul>
  );
}
