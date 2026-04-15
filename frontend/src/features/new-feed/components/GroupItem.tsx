import { MessageCircle } from "lucide-react";
import type { GroupItemProps } from "../types/new-feed.type";

const GroupItem: React.FC<GroupItemProps> = ({
  name,
  members,
  unread,
  iconBg,
  icon: Icon,
}) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center text-white shrink-0`}
      >
        <Icon size={20} />
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors">
          {name}
        </h4>
        <p className="text-[10px] text-slate-500">{members} thành viên</p>
      </div>
    </div>
    {unread && unread > 0 ? (
      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        {unread}
      </span>
    ) : (
      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
        <MessageCircle size={14} className="text-slate-400" />
      </button>
    )}
  </div>
);

export default GroupItem;
