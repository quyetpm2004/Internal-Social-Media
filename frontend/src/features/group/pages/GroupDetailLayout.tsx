import { useCallback, useEffect, useMemo, useState } from "react";
import GroupHeader from "@/features/group/components/group-detail/main-detail/GroupHeader";
import { ArrowLeft, Clock, Lock, Users } from "lucide-react";

const GroupDetailSkeleton = () => (
  <div className="space-y-5" aria-hidden>
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-52 animate-pulse bg-slate-200 md:h-64 dark:bg-slate-800" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="mt-4 h-8 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
      <div className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
    </div>
  </div>
);
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
      <div className="flex h-64 items-center justify-center">
        <span className="text-sm text-slate-500">
          {t("pages.groups.groupIdMissing")}
        </span>
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <main className="mx-auto max-w-6xl flex-1 px-3 py-6 sm:px-5 md:py-8">
          <p className="sr-only">{t("pages.groups.loadingDetails")}</p>
          <GroupDetailSkeleton />
        </main>
      ) : (
        <main className="mx-auto max-w-6xl flex-1 px-3 py-6 sm:px-5 md:py-8">
          <div className="md:hidden">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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

          <div className="mx-auto w-full py-5">
            {isPrivateBlocked ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {isPendingRequest ? (
                      <Clock size={28} className="text-amber-500" />
                    ) : (
                      <Lock size={28} className="text-slate-500" />
                    )}
                  </div>
                </div>

                <h2 className="mb-2 text-xl font-bold tracking-tight">
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
