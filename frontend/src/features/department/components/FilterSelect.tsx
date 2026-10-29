import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type FilterSelectProps = {
  value: string;
  label: string;
  onChange: (value: string) => void;
  children: ReactNode;
};

export default function FilterSelect({
  value,
  label,
  onChange,
  children,
}: FilterSelectProps) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-8 pl-3 text-sm text-slate-700 outline-none focus:border-primary"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-slate-400" />
    </label>
  );
}
