import { useCallback, useEffect, useState } from "react";
import { Navigate, useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import { groupApi } from "@/features/group/apis/group.api";
import { JoinRequestTable } from "@/features/group/components/group-detail/member-list/JoinRequestTable";
import type { JoinRequest } from "@/features/group/types/group.type";
import type { GroupOutletContext } from "@/features/group/types/group-outlet.type";

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
}

export const GroupJoinRequestsPage = () => {
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
      toast.success("Đã chấp nhận yêu cầu tham gia");
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
      toast.success("Đã từ chối yêu cầu tham gia");
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
        <h2 className="text-lg font-bold text-on-surface">Yêu cầu tham gia</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Duyệt các yêu cầu tham gia nhóm riêng tư. Người được chấp nhận sẽ trở
          thành thành viên ngay lập tức.
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
