import { useCallback, useEffect, useState } from "react";
import { Navigate, useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import { groupApi } from "@/features/group/apis/group.api";
import { JoinRequestTable } from "@/features/group/components/group-detail/member-list/JoinRequestTable";
import type { JoinRequest } from "@/features/group/types/group.type";
import type { GroupOutletContext } from "@/features/group/types/group-outlet.type";
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Unexpected error"
  );
}

export const GroupJoinRequestsPage = () => {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const { canApproveJoinRequests, refreshGroupDetail } =
    useOutletContext<GroupOutletContext>();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
    page: 1,
  });

  const fetchRequests = useCallback(async () => {
    if (!groupId) return;

    try {
      const res = await groupApi.getJoinRequests(groupId, currentPage);
      setRequests(res.data.requests);
      setPagination(res.data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }, [groupId, currentPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (userId: string) => {
    if (!groupId) return;

    setProcessingUserId(userId);
    try {
      await groupApi.approveJoinRequest(groupId, userId);
      toast.success(t("pages.groups.requestApproved"));
      await fetchRequests();
      await refreshGroupDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!groupId) return;

    setProcessingUserId(userId);
    try {
      await groupApi.rejectJoinRequest(groupId, userId);
      toast.success(t("pages.groups.requestRejected"));
      await fetchRequests();
      await refreshGroupDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  if (!canApproveJoinRequests) {
    return <Navigate to={`/groups/${groupId}/members`} replace />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-on-surface">
          {t("pages.groups.joinRequestsTitle")}
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          {t("pages.groups.joinRequestsDescription")}
        </p>
      </div>

      <JoinRequestTable
        requests={requests}
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        processingUserId={processingUserId}
        onPageChange={setCurrentPage}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
