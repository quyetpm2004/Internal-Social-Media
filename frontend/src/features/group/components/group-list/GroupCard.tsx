import { Landmark, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

type GroupCardProps = {
  groupId: string;
  groupName: string;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  description: string;
  memberCount: number;
  avatarUrl: string;
  coverUrl: string;
  isMember: boolean;
  joinGroup: (groupId: string) => void;
};

const GroupCard = ({
  groupId,
  groupName,
  groupType,
  description,
  memberCount,
  avatarUrl,
  coverUrl,
  isMember,
  joinGroup,
}: GroupCardProps) => {
  return (
    <div className="group bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-4px]">
      <div className="h-28 relative">
        <img
          className="w-full h-full object-cover"
          data-alt="A panoramic view of a minimalist, brightly lit architectural studio with clean lines, large glass windows, and white desks. The lighting is crisp, morning daylight, casting soft shadows. The overall aesthetic is professional, airy, and modern, reflecting a premium corporate environment."
          src={
            coverUrl ||
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute -bottom-6 left-6 p-1 bg-surface-container-lowest rounded-lg">
          <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-white">
            <span
              className="material-symbols-outlined"
              data-icon="architecture"
            >
              {avatarUrl ? (
                <img
                  className="w-full h-full object-cover"
                  src={avatarUrl}
                  alt={groupName}
                />
              ) : (
                <Landmark />
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
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
            <span
              className="material-symbols-outlined text-sm"
              data-icon="group"
            >
              <Users />
            </span>
            <span className="text-xs font-semibold">
              {memberCount.toLocaleString()} members
            </span>
          </div>

          {isMember ? (
            <span className="px-3 py-1.5 bg-green-100 text-green-800 font-bold text-xs rounded-lg">
              Member
            </span>
          ) : (
            <span
              onClick={() => joinGroup(groupId)}
              className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-lg cursor-pointer"
            >
              Join
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
