import type { ChangeEvent } from "react";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";

interface InfoFieldProps {
  label: string;
  value: string | number | null | undefined;
  date?: boolean;
  name?: string;
  onChange?: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  options?: { id: string; name: string }[];
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
}

const InfoField = ({
  label,
  value,
  date,
  name,
  onChange,
  options,
  placeholder,
  disabled,
  readonly,
}: InfoFieldProps) => {
  const locked = Boolean(disabled || readonly);
  const displayValue =
    date && value ? new Date(value).toISOString().split("T")[0] : (value ?? "");

  return (
    <div className="flex-1 space-y-2">
      <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase">
        {label}
      </label>
      {options ? (
        <Select
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={locked}
        >
          <option value="">{placeholder ?? label}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          name={name}
          type={date ? "date" : "text"}
          value={displayValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={locked}
          readOnly={readonly}
        />
      )}
    </div>
  );
};

export default InfoField;
