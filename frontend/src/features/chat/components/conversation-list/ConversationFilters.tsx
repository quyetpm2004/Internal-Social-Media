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
    <div className="flex gap-1.5">
      {filters.map((filter) => {
        const isActive = active === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
