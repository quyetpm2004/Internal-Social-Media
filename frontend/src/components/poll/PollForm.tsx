import { Plus, X } from "lucide-react";
import type { PollInput } from "@/types/poll.type";

interface PollFormProps {
  value: PollInput;
  onChange: (value: PollInput) => void;
  onRemove?: () => void;
}

const PollForm = ({ value, onChange, onRemove }: PollFormProps) => {
  const updateOption = (index: number, label: string) => {
    const options = [...value.options];
    options[index] = label;
    onChange({ ...value, options });
  };

  const addOption = () => {
    if (value.options.length >= 10) return;
    onChange({ ...value, options: [...value.options, ""] });
  };

  const removeOption = (index: number) => {
    if (value.options.length <= 2) return;
    onChange({
      ...value,
      options: value.options.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Tạo bình chọn
        </p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label="Xóa bình chọn"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <input
        type="text"
        value={value.question}
        onChange={(e) => onChange({ ...value, question: e.target.value })}
        placeholder="Câu hỏi bình chọn..."
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />

      <div className="space-y-2">
        {value.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Lựa chọn ${index + 1}`}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {value.options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                aria-label="Xóa lựa chọn"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {value.options.length < 10 && (
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <Plus size={16} />
          Thêm lựa chọn
        </button>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value.allowMultiple ?? false}
          onChange={(e) =>
            onChange({ ...value, allowMultiple: e.target.checked })
          }
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Cho phép chọn nhiều lựa chọn
        </span>
      </label>
    </div>
  );
};

export default PollForm;
