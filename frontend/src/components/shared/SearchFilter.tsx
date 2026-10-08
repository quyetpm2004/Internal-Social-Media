import type { ComponentProps, ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const toolbarClass =
  "mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center";

export const searchButtonClass =
  "h-10 shrink-0 cursor-pointer bg-primary text-sm px-4 text-white hover:bg-primary/90";

export function SearchFilter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(toolbarClass, className)}>{children}</div>;
}

export function SearchField({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <Input className="h-10 bg-white pr-3 pl-9" {...props} />
    </div>
  );
}

export function FilterPills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {options.map((item) => {
        const active = value === item.value;
        return (
          <button
            key={item.value || "all"}
            type="button"
            onClick={() => onChange(item.value)}
            className={`cursor-pointer rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterSelect({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <div className="relative shrink-0">
      <select
        className={cn(
          "h-10 appearance-none rounded-lg border border-slate-200 bg-white pr-10 pl-3 text-sm text-slate-700 outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
