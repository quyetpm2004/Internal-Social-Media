import { Clock, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { GroupMembershipStatus } from "@/features/group/types/group.type";
import { DEFAULT_COVER } from "@/constants/app";

type GroupCardProps = {
  groupId: string;
  groupName: string;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  description: string;
  memberCount: number;
  coverUrl: string;
  isMember: boolean;
  membershipStatus?: GroupMembershipStatus;
  joinGroup: (groupId: string) => void;
};

const GroupCard = ({
  groupId,
  groupName,
  groupType,
  description,
  memberCount,
  coverUrl,
  isMember,
  membershipStatus,
  joinGroup,
}: GroupCardProps) => {
  const isPending = membershipStatus === "PENDING";

  return (
    <div className="group bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-4px]">
      <div className="h-32 relative">
        <img
          className="w-full h-full object-cover"
          src={coverUrl || DEFAULT_COVER}
          alt={groupName}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="px-6 py-5 flex-1 flex flex-col">
        <NavLink to={`/groups/${groupId}`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-on-surface">{groupName}</h3>
            <span className="px-2 py-1 bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider rounded">
              {groupType}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm body-md line-clamp-2 mb-4">
            {description}
          </p>
        </NavLink>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <Users className="text-sm" />
            <span className="text-xs font-semibold">
              {memberCount.toLocaleString()} thành viên
            </span>
          </div>

          {isMember ? (
            <span className="px-3 py-1.5 bg-green-100 text-green-800 font-bold text-xs rounded-lg">
              Thành viên
            </span>
          ) : isPending ? (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-lg flex items-center gap-1">
              <Clock size={12} />
              Đang chờ duyệt
            </span>
          ) : (
            <button
              type="button"
              onClick={() => joinGroup(groupId)}
              className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-lg cursor-pointer"
            >
              {groupType === "PRIVATE" ? "Yêu cầu tham gia" : "Tham gia"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
