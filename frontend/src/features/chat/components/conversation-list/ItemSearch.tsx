import { getDefaultAvatarUrl } from "@/lib/utils";
import { X } from "lucide-react";

type ItemSearchProps = {
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
  onClick?: () => void;
  showDeleteButton?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
};

export default function ItemSearch({
  user,
  onClick,
  showDeleteButton = false,
  onDelete,
}: ItemSearchProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
      </div>

      {showDeleteButton && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(e);
            }}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
            aria-label="Xóa khỏi lịch sử"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
