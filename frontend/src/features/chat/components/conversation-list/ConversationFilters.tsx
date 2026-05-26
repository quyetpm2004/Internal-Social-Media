import type { ConversationFilter } from "@/features/chat/types/chat.type";

interface ConversationFiltersProps {
  active: ConversationFilter;
  onChange: (filter: ConversationFilter) => void;
}

const FILTERS: { value: ConversationFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "UNREAD", label: "Chưa đọc" },
  { value: "GROUPS", label: "Nhóm" },
];

const ConversationFilters = ({
  active,
  onChange,
}: ConversationFiltersProps) => {
  return (
    <div className="flex gap-2">
      {FILTERS.map((filter) => {
        const isActive = active === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-label transition-colors ${
              isActive
                ? "bg-primary text-on-primary font-bold"
                : "bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-container-high"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

export default ConversationFilters;
