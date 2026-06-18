import type { ConversationFilter } from "@/features/chat/types/chat.type";
import { useTranslation } from "react-i18next";

interface ConversationFiltersProps {
  active: ConversationFilter;
  onChange: (filter: ConversationFilter) => void;
}

const ConversationFilters = ({
  active,
  onChange,
}: ConversationFiltersProps) => {
  const { t } = useTranslation();
  const filters: { value: ConversationFilter; label: string }[] = [
    { value: "ALL", label: t("pages.chat.filterAll") },
    { value: "UNREAD", label: t("pages.chat.filterUnread") },
    { value: "GROUPS", label: t("pages.chat.filterGroups") },
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => {
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
