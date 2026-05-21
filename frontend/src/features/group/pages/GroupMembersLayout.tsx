import { NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import type { GroupOutletContext } from "@/features/group/types/group-outlet.type";

export const GroupMembersLayout = () => {
  const { groupId } = useParams();
  const outletContext = useOutletContext<GroupOutletContext>();
  const { canManageMembers, groupDetail } = outletContext;

  const showJoinRequestsTab =
    canManageMembers && groupDetail?.groupType === "PRIVATE";

  const pendingCount = groupDetail?.pendingRequestCount ?? 0;

  return (
    <main className="md:col-span-8 space-y-6">
      {showJoinRequestsTab && (
        <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl w-fit">
          <NavLink
            to={`/groups/${groupId}/members`}
            end
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isActive
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`
            }
          >
            Thành viên
          </NavLink>
          <NavLink
            to={`/groups/${groupId}/members/requests`}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                isActive
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`
            }
          >
            Yêu cầu tham gia
            {pendingCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 flex items-center justify-center text-[11px] font-bold bg-primary text-on-primary rounded-full">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </NavLink>
        </div>
      )}

      <Outlet context={outletContext} />
    </main>
  );
};
