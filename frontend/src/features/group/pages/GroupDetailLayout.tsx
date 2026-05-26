import { useCallback, useEffect, useMemo, useState } from "react";
import GroupHeader from "@/features/group/components/group-detail/main-detail/GroupHeader";
import { Clock, Lock, Plus, Users } from "lucide-react";
import { Outlet, useParams } from "react-router-dom";
import type {
  GroupDetail,
  GroupMembershipStatus,
} from "@/features/group/types/group.type";
import { groupApi } from "@/features/group/apis/group.api";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  canManageGroupMembers,
  type GroupMemberRole,
} from "@/features/group/utils/group-member";
import { uploadGroupCover } from "@/features/group/utils/uploadGroupCover";

const GroupDetailLayout = () => {
  const { groupId } = useParams();

  const currentUser = useAuthStore((state) => state.user);

  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);

  const [loading, setLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const fetchGroupDetail = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      const response = await groupApi.getGroupDetail(groupId);

      setGroupDetail(response.data);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };

        message?: string;
      };

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetail();
  }, [fetchGroupDetail]);

  const currentMemberRole = useMemo((): GroupMemberRole | null => {
    if (!groupDetail || !currentUser) return null;

    const member = groupDetail.members.find(
      (m) => m.user.id === currentUser.id,
    );

    return member?.memberRole ?? null;
  }, [groupDetail, currentUser]);

  const canManageMembers = canManageGroupMembers(currentMemberRole);

  const membershipStatus: GroupMembershipStatus =
    groupDetail?.membershipStatus ?? null;

  const handleCoverUpload = async (file: File) => {
    if (!groupId) return;

    try {
      setCoverUploading(true);
      await uploadGroupCover(file, groupId);
      await fetchGroupDetail();
      toast.success("Cập nhật ảnh bìa thành công");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleJoinLeaveGroup = async () => {
    if (!groupId || !groupDetail) return;

    try {
      if (groupDetail.isMember) {
        const response = await groupApi.leaveGroup(groupId);

        setGroupDetail((prev) =>
          prev
            ? {
                ...prev,
                isMember: false,
                membershipStatus: null,
                _count: {
                  ...prev._count,
                  members: Math.max(0, prev._count.members - 1),
                },
              }
            : prev,
        );

        toast.success(response.message || "Rời nhóm thành công");
      } else if (membershipStatus === "PENDING") {
        const response = await groupApi.leaveGroup(groupId);

        setGroupDetail((prev) =>
          prev
            ? {
                ...prev,
                isMember: false,
                membershipStatus: null,
              }
            : prev,
        );

        toast.success(response.message || "Đã hủy yêu cầu tham gia");
      } else {
        const response = await groupApi.joinGroup(groupId);

        const action = response.data?.action as
          | "joined"
          | "requested"
          | undefined;

        if (action === "requested") {
          setGroupDetail((prev) =>
            prev
              ? {
                  ...prev,
                  isMember: false,
                  membershipStatus: "PENDING",
                }
              : prev,
          );

          toast.success("Đã gửi yêu cầu tham gia nhóm");
        } else {
          setGroupDetail((prev) =>
            prev
              ? {
                  ...prev,
                  isMember: true,
                  membershipStatus: "ACTIVE",
                  _count: {
                    ...prev._count,
                    members: prev._count.members + 1,
                  },
                }
              : prev,
          );

          toast.success("Tham gia nhóm thành công");
        }
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";

      toast.error(message);
    }
  };

  const isPrivateBlocked =
    groupDetail?.groupType === "PRIVATE" && !groupDetail?.isMember;
  const isPendingRequest = membershipStatus === "PENDING";

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
            membershipStatus={membershipStatus}
            pendingRequestCount={groupDetail?.pendingRequestCount ?? 0}
            coverUrl={groupDetail?.coverUrl}
            canEditMedia={canManageMembers}
            coverUploading={coverUploading}
            onCoverChange={handleCoverUpload}
            onJoinLeave={handleJoinLeaveGroup}
            currentMemberRole={currentMemberRole}
          />

          <div className="w-full mx-auto px-4 py-8">
            {isPrivateBlocked ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center">
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {isPendingRequest ? (
                      <Clock size={34} className="text-amber-500" />
                    ) : (
                      <Lock size={34} className="text-slate-500" />
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  {isPendingRequest
                    ? "Yêu cầu đang chờ duyệt"
                    : "Đây là nhóm kín"}
                </h2>

                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  {isPendingRequest
                    ? "Quản trị viên nhóm sẽ xem xét yêu cầu của bạn. Bạn sẽ được thông báo khi được chấp nhận."
                    : "Bạn cần tham gia nhóm để xem bài viết, thành viên và các nội dung bên trong."}
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
                  refreshGroupDetail: fetchGroupDetail,
                }}
              />
            )}
          </div>

          <button className="fixed bottom-8 right-8 w-14 h-14 bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all md:hidden">
            <Plus size={28} />
          </button>
        </main>
      )}
    </>
  );
};

export default GroupDetailLayout;
