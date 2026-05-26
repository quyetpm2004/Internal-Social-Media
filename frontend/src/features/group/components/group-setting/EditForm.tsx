import React, { useState } from "react";
import type { SettingConfig } from "@/features/group/types/group.type";

interface EditFormProps {
  isLoading: boolean;
  item: SettingConfig;
  onCancel: () => void;
  onSave: (id: string, newValue: string, newDesc?: string) => void;
}

const EditForm: React.FC<EditFormProps> = ({
  isLoading,
  item,
  onCancel,
  onSave,
}) => {
  const [tempValue, setTempValue] = useState(item.value);
  const [description, setDescription] = useState(item.description ?? "");

  return (
    <div className="p-3 space-y-4 animate-in fade-in duration-200">
      <div className="font-semibold text-gray-800">{item.label}</div>

      {item.type === "input-group" && (
        <div className="space-y-3">
          <div className="relative border border-gray-300 rounded-xl px-3 pt-5 pb-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <label className="absolute top-1.5 left-3 text-[12px] text-gray-500 font-medium">
              Tên
            </label>
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full outline-none text-[15px]"
              autoFocus
            />
          </div>
          <div className="relative border border-gray-300 rounded-xl px-3 pt-5 pb-2 min-h-[80px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <label className="absolute top-1.5 left-3 text-[12px] text-gray-500 font-medium">
              Mô tả
            </label>
            <textarea
              className="w-full outline-none text-[15px] resize-none"
              rows={2}
              placeholder="Mô tả..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      )}

      {item.type === "radio" && item.options && (
        <div className="space-y-3">
          {item.options.map((option) => (
            <label
              key={option}
              className="flex items-center justify-between cursor-pointer group"
            >
              <span className="text-[15px] text-gray-700">{option}</span>
              <input
                type="radio"
                name={item.id}
                checked={tempValue === option}
                onChange={() => setTempValue(option)}
                className="w-5 h-5 accent-blue-600"
              />
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="text-blue-600 font-semibold px-4 py-2 hover:bg-blue-50 rounded-lg text-[15px]"
        >
          Hủy
        </button>
        <button
          onClick={() => onSave(item.id, tempValue, description)}
          className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-[15px]"
        >
          {isLoading ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
};

export default EditForm;
