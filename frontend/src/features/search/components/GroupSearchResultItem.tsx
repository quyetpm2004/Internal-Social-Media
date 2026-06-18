import { Link } from "react-router-dom";
import { Landmark, Users } from "lucide-react";
import type { SearchGroup } from "@/features/search/types/search.type";
import { useTranslation } from "react-i18next";

type GroupSearchResultItemProps = {
  group: SearchGroup;
  onClick?: () => void;
};

export default function GroupSearchResultItem({
  group,
  onClick,
}: GroupSearchResultItemProps) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/groups/${group.id}`}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <div className="size-10 shrink-0 rounded-lg bg-primary-container flex items-center justify-center overflow-hidden">
        {group.coverUrl ? (
          <img
            src={group.coverUrl}
            alt={group.groupName}
            className="size-full object-cover"
          />
        ) : (
          <Landmark className="size-5 text-white" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {group.groupName}
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
          <Users className="size-3 shrink-0" />
          {group.memberCount} {t("pages.groups.members")}
          {group.isMember && (
            <span className="text-blue-600 dark:text-blue-400">
              · {t("pages.groups.memberBadge")}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
