import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  label?: ReactNode;
};

export default function Checkbox({
  label,
  className,
  id,
  ...props
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700"
    >
      <input
        id={id}
        type="checkbox"
        className={cn(
          "size-4 cursor-pointer rounded border-slate-300 text-primary accent-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}
