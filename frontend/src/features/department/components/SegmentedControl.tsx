import { cn } from "@/lib/utils";

type SegmentedControlProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex self-start rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
