import { Link } from "react-router-dom";
import type { SearchUser } from "@/features/search/types/search.type";
import { getDefaultAvatarUrl } from "@/lib/utils";

type UserSearchResultItemProps = {
  user: SearchUser;
  onClick?: () => void;
};

export default function UserSearchResultItem({
  user,
  onClick,
}: UserSearchResultItemProps) {
  const subtitle = [user.positionName, user.departmentName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/profile/${user.id}`}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
        <img
          src={user?.avatarUrl || getDefaultAvatarUrl(user.fullName)}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {user.fullName}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {subtitle || user.email}
        </p>
      </div>
    </Link>
  );
}
