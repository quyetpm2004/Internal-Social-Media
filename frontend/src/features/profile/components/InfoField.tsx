interface InfoFieldProps {
  label: string;
  value: any; // Chấp nhận string, number hoặc date string
  date?: boolean;
  name?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  options?: { id: string; name: string }[];
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
}

const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  date,
  name,
  onChange,
  options,
  placeholder,
  disabled,
  readonly,
}) => {
  const displayValue =
    date && value ? new Date(value).toISOString().split("T")[0] : value || "";

  return (
    <div className="space-y-2 flex-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        {options ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="bg-transparent w-full p-4 text-slate-900 dark:text-slate-100 font-medium outline-none border-none focus:ring-0 cursor-pointer"
            disabled={disabled}
          >
            <option selected>Chọn {label.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id} className="dark:bg-slate-800">
                {opt.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            name={name}
            type={date ? "date" : "text"}
            value={displayValue}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            className="bg-transparent w-full p-4 text-slate-900 dark:text-slate-100 font-medium outline-none border-none focus:ring-0"
          />
        )}
      </div>
    </div>
  );
};

export default InfoField;
