import type { GroupItemProps } from "@/features/new-feed/types/post.type";
import { DEFAULT_COVER } from "@/constants/app";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const GroupItem: React.FC<GroupItemProps> = ({ id, name, members, url }) => {
  const { t } = useTranslation();
  return (
    <Link
      to={`/groups/${id}`}
      className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
    >
      <img
        src={url || DEFAULT_COVER}
        className="h-10 w-10 shrink-0 rounded-xl object-cover"
        alt={t("common.groupAvatar")}
      />
      <div className="min-w-0">
        <h4 className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-700 dark:text-slate-100">
          {name}
        </h4>
        <p className="text-xs text-slate-500">
          {t("pages.groups.memberCount", { count: members })}
        </p>
      </div>
    </Link>
  );
};

export default GroupItem;
