import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-100";

export default function Input({
  className,
  ...props
}: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}
