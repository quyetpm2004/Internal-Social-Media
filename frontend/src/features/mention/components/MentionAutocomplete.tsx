import type { SearchUser } from "@/features/search/types/search.type";
import { isMentionAllSearchUser } from "@/features/mention/utils/mention";
import { getDefaultAvatarUrl } from "@/lib/utils";
import { Loader2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

type MentionAutocompleteProps = {
  users: SearchUser[];
  loading?: boolean;
  activeIndex?: number;
  onSelect: (user: SearchUser) => void;
  className?: string;
};

const MentionAutocomplete = ({
  users,
  loading = false,
  activeIndex = 0,
  onSelect,
  className = "",
}: MentionAutocompleteProps) => {
  const { t } = useTranslation();

  if (!loading && users.length === 0) {
    return null;
  }

  return (
    <div
      className={`absolute z-50 w-64 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg ${className}`}
    >
      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          {t("pages.mention.searching")}
        </div>
      ) : (
        users.map((user, index) => {
          const isMentionAll = isMentionAllSearchUser(user);

          return (
            <button
              key={isMentionAll ? "mention-all" : user.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(user)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                index === activeIndex
                  ? "bg-slate-100 dark:bg-slate-800"
                  : ""
              }`}
            >
              {isMentionAll ? (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-blue-700 dark:text-blue-300" />
                </div>
              ) : (
                <img
                  src={user.avatarUrl || getDefaultAvatarUrl(user.fullName)}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {isMentionAll
                    ? t("pages.mention.mentionAll")
                    : user.fullName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {isMentionAll
                    ? t("pages.mention.mentionAllDescription")
                    : user.email}
                </p>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default MentionAutocomplete;
