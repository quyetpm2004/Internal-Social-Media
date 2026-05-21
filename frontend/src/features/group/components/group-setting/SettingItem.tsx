import React from "react";
import { Pencil, ChevronDown } from "lucide-react";

interface SettingItemProps {
  label: string;
  value: string;
  isDropdown?: boolean;
  onClick: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  label,
  value,
  isDropdown,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between py-3.5 px-4 hover:bg-gray-50 cursor-pointer group"
  >
    <div className="flex flex-col">
      <span className="text-[15px] font-semibold text-gray-800">{label}</span>
      <span className="text-[13px] text-gray-500 mt-0.5">{value}</span>
    </div>
    <div className="text-gray-400 group-hover:text-gray-600">
      {isDropdown ? (
        <ChevronDown size={20} strokeWidth={2.5} />
      ) : (
        <Pencil size={18} strokeWidth={2.5} />
      )}
    </div>
  </div>
);

export default SettingItem;
