import type { GroupItemProps } from "@/features/new-feed/types/new-feed.type";
import { DEFAULT_COVER } from "@/constants/app";
import { Link } from "react-router-dom";

const GroupItem: React.FC<GroupItemProps> = ({ id, name, members, url }) => (
  <Link to={`/groups/${id}`}>
    <div className="flex items-center justify-between group cursor-pointer py-1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10">
          <img
            src={url || DEFAULT_COVER}
            className="w-full h-full rounded-lg"
            alt="Avatar nhóm"
          />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors">
            {name}
          </h4>
          <p className="text-[10px] text-slate-500">{members} thành viên</p>
        </div>
      </div>
    </div>
  </Link>
);

export default GroupItem;
