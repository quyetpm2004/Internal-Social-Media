import { ListFilter, Search } from "lucide-react";
import { useState } from "react";

interface FilterSectionProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  activeRole: string;
  onRoleChange: (role: string) => void;
}

export const FilterSection = ({
  searchTerm,
  onSearchChange,
  activeRole,
  onRoleChange,
}: FilterSectionProps) => {
  const roles = ["Tất cả", "ADMIN", "MODERATOR", "MEMBER"];

  // state chỉ để hiển thị input
  const [inputValue, setInputValue] = useState(searchTerm);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
      {/* Search */}
      <div className="flex items-center gap-2 w-full sm:max-w-md">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <ListFilter size={18} />
          </span>

          <button
            onClick={() => onSearchChange(inputValue)}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              flex items-center justify-center
              w-9 h-9
              rounded-xl
              text-primary
              hover:bg-surface-container
              transition
              cursor-pointer
            "
          >
            <Search size={18} />
          </button>

          <input
            className="
              w-full
              pl-10
              pr-14
              py-3
              bg-surface-container-highest
              border-none
              outline-none
              rounded-2xl
              text-sm
              focus:ring-2
              focus:ring-surface-tint
              transition-all
            "
            placeholder="Tìm kiếm thành viên..."
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchChange(inputValue);
              }
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => onRoleChange(role)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeRole === role
                  ? "bg-primary text-white"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
