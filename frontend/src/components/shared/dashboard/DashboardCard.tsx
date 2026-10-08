import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({
  title,
  extra,
  children,
  className,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}
