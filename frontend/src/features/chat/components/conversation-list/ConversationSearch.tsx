import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConversationSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFocus: () => void;
}

const ConversationSearch = ({
  searchQuery,
  setSearchQuery,
  onFocus,
}: ConversationSearchProps) => {
  const { t } = useTranslation();
  return (
    <div className="relative flex-1">
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
      />

      <input
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
        placeholder={t("pages.chat.searchPlaceholder")}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={onFocus}
      />
    </div>
  );
};

export default ConversationSearch;
