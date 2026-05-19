import { useEffect, useMemo, useState } from "react";
import GroupHeader from "@/features/group/components/group-detail/main-detail/GroupHeader";
import { Lock, Plus, Users } from "lucide-react";
import { Outlet, useParams } from "react-router-dom";
import type { GroupDetail } from "@/features/group/types/group.type";
import { groupApi } from "@/features/group/apis/group.api";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  canManageGroupMembers,
  type GroupMemberRole,
} from "@/features/group/utils/group-member";

const GroupDetailLayout = () => {
  const { groupId } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const currentMemberRole = useMemo((): GroupMemberRole | null => {
    if (!groupDetail || !currentUser) return null;
    const member = groupDetail.members.find(
      (m) => m.user.id === currentUser.id,
    );
    return member?.memberRole ?? null;
  }, [groupDetail, currentUser]);

  const canManageMembers = canManageGroupMembers(currentMemberRole);
  useEffect(() => {
    const fetchGroupDetail = async () => {
      if (!groupId) return;
      try {
        setLoading(true);
        const response = await groupApi.getGroupDetail(groupId);
        setGroupDetail(response.data);
      } catch (error: any) {
        toast.error("Failed to fetch group detail:");
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Có lỗi xảy ra. Vui lòng thử lại.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupDetail();
  }, [groupId]);

  const handleJoinLeaveGroup = async () => {
    if (!groupId) return;
    try {
      if (groupDetail?.isMember) {
        await groupApi.leaveGroup(groupId);
        setGroupDetail((prev) =>
          prev
            ? {
                ...prev,
                isMember: false,
                _count: { ...prev._count, members: prev._count.members - 1 },
              }
            : prev,
        );
        toast.success("Rời nhóm thành công");
      } else {
        await groupApi.joinGroup(groupId);
        setGroupDetail((prev) =>
          prev
            ? {
                ...prev,
                isMember: true,
                _count: { ...prev._count, members: prev._count.members + 1 },
              }
            : prev,
        );
        toast.success("Tham gia nhóm thành công");
      }
    } catch (error: any) {
      console.error("Failed to join/leave group:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  // Chặn khi là nhóm kín và chưa phải thành viên
  const isPrivateBlocked =
    groupDetail?.groupType === "PRIVATE" && !groupDetail?.isMember;

  if (!groupId) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Group ID is missing.</span>
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">Loading group details...</span>
        </div>
      ) : (
        <main className="flex-1 py-8 max-w-6xl mx-auto px-4 bg-slate-50 dark:bg-slate-950">
          <GroupHeader
            name={groupDetail?.groupName || "Tên nhóm"}
            type={groupDetail?.groupType || "PUBLIC"}
            memberCount={groupDetail?._count.members || 0}
            isMember={groupDetail?.isMember || false}
            avatarUrl={groupDetail?.avatarUrl}
            coverUrl={groupDetail?.coverUrl}
            onJoinLeave={handleJoinLeaveGroup}
          />

          <div className="max-w-5xl mx-auto px-4 py-8">
            {isPrivateBlocked ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center">
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Lock size={34} className="text-slate-500" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3">Đây là nhóm kín</h2>

                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Bạn cần tham gia nhóm để xem bài viết, thành viên và các nội
                  dung bên trong.
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Users size={16} />

                  <span>{groupDetail?._count.members} thành viên</span>
                </div>
              </div>
            ) : (
              <Outlet
                context={{
                  isMember: groupDetail?.isMember || false,
                  groupDetail,
                  currentMemberRole,
                  canManageMembers,
                }}
              />
            )}
          </div>

          {/* FAB Mobile */}
          <button className="fixed bottom-8 right-8 w-14 h-14 bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all md:hidden">
            <Plus size={28} />
          </button>
        </main>
      )}
    </>
  );
};

export default GroupDetailLayout;
