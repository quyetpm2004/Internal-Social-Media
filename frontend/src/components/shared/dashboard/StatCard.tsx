import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatTone = "blue" | "violet" | "rose" | "emerald";

const tones: Record<StatTone, { card: string; icon: string }> = {
  blue: { card: "bg-blue-50 text-blue-800", icon: "bg-white/80 text-blue-600" },
  violet: {
    card: "bg-violet-50 text-violet-800",
    icon: "bg-white/80 text-violet-600",
  },
  rose: { card: "bg-rose-50 text-rose-800", icon: "bg-white/80 text-rose-600" },
  emerald: {
    card: "bg-emerald-50 text-emerald-800",
    icon: "bg-white/80 text-emerald-600",
  },
};

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone: StatTone;
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: StatCardProps) {
  const style = tones[tone];

  return (
    <article className={cn("rounded-2xl p-4", style.card)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-wide uppercase">
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl",
            style.icon,
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-75">{hint}</p>
    </article>
  );
}
