import { useCallback, useEffect, useMemo, useState } from "react";
import GroupHeader from "@/features/group/components/group-detail/main-detail/GroupHeader";
import { ArrowLeft, Clock, Lock, Plus, Users } from "lucide-react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import type {
  GroupDetail,
  GroupMembershipStatus,
} from "@/features/group/types/group.type";
import { groupApi } from "@/features/group/apis/group.api";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  canApproveJoinRequests,
  canManageGroupMembers,
  type GroupMemberRole,
} from "@/features/group/utils/group-member";
import { uploadGroupCover } from "@/features/group/utils/uploadGroupCover";
import { useTranslation } from "react-i18next";

const GroupDetailLayout = () => {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const navigate = useNavigate();
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
        t("common.genericError");

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

  const canApproveJoin = canApproveJoinRequests({
    isMember: groupDetail?.isMember ?? false,
    groupType: groupDetail?.groupType,
    joinApprovalPolicy: groupDetail?.joinApprovalPolicy,
    memberRole: currentMemberRole,
  });

  const membershipStatus: GroupMembershipStatus =
    groupDetail?.membershipStatus ?? null;

  const handleCoverUpload = async (file: File) => {
    if (!groupId) return;

    try {
      setCoverUploading(true);
      await uploadGroupCover(file, groupId);
      await fetchGroupDetail();
      toast.success(t("pages.groups.coverUpdated"));
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t("common.genericError");
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

        toast.success(response.message || t("pages.groups.leaveSuccess"));
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

        toast.success(
          response.message || t("pages.groups.cancelRequestSuccess"),
        );
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

          toast.success(t("pages.groups.requestSent"));
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

          toast.success(t("pages.groups.joinSuccess"));
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
        t("common.genericError");

      toast.error(message);
    }
  };

  const isPrivateBlocked =
    groupDetail?.groupType === "PRIVATE" && !groupDetail?.isMember;
  const isPendingRequest = membershipStatus === "PENDING";

  if (!groupId) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">
          {t("pages.groups.groupIdMissing")}
        </span>
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">
            {t("pages.groups.loadingDetails")}
          </span>
        </div>
      ) : (
        <main className="flex-1 py-6 max-w-6xl mx-auto bg-slate-50 dark:bg-slate-950">
          <div className="md:hidden">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-slate-500 hover:text-slate-700 pb-4 dark:hover:text-slate-300 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span className="font-medium">{t("common.back")}</span>
            </button>
          </div>
          <GroupHeader
            name={groupDetail?.groupName || t("pages.groups.defaultName")}
            type={groupDetail?.groupType || "PUBLIC"}
            memberCount={groupDetail?._count.members || 0}
            isMember={groupDetail?.isMember || false}
            membershipStatus={membershipStatus}
            pendingRequestCount={groupDetail?.pendingRequestCount ?? 0}
            pendingPostCount={groupDetail?.pendingPostCount ?? 0}
            postApprovalRequired={groupDetail?.postApprovalRequired ?? false}
            coverUrl={groupDetail?.coverUrl}
            canEditMedia={canManageMembers}
            coverUploading={coverUploading}
            onCoverChange={handleCoverUpload}
            onJoinLeave={handleJoinLeaveGroup}
            currentMemberRole={currentMemberRole}
          />

          <div className="w-full mx-auto py-8 px-1">
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
                    ? t("pages.groups.requestPendingTitle")
                    : t("pages.groups.privateGroupTitle")}
                </h2>

                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  {isPendingRequest
                    ? t("pages.groups.requestPendingDescription")
                    : t("pages.groups.privateGroupDescription")}
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Users size={16} />

                  <span>
                    {t("pages.groups.memberCount", {
                      count: groupDetail?._count.members ?? 0,
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <Outlet
                context={{
                  isMember: groupDetail?.isMember || false,
                  groupDetail,
                  currentMemberRole,
                  canManageMembers,
                  canApproveJoinRequests: canApproveJoin,
                  refreshGroupDetail: fetchGroupDetail,
                }}
              />
            )}
          </div>
        </main>
      )}
    </>
  );
};

export default GroupDetailLayout;
