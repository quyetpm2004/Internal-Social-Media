import type { ComponentProps } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const adminToolbarClass =
  "mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center";

export const adminSearchButtonClass =
  "h-10 shrink-0 cursor-pointer bg-primary px-4 text-white hover:bg-primary/90";

export function AdminSearchField({
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

export function AdminFilterSelect({
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
