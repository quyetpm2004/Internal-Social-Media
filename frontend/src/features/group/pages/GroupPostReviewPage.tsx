import { useCallback, useEffect, useState } from "react";
import { Navigate, useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import { groupApi } from "@/features/group/apis/group.api";
import { PendingPostReviewTable } from "@/features/group/components/group-detail/post-review/PendingPostReviewTable";
import type { PendingGroupPost } from "@/features/group/types/group.type";
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

export const GroupPostReviewPage = () => {
  const { groupId } = useParams();
  const { canManageMembers, groupDetail, refreshGroupDetail } =
    useOutletContext<GroupOutletContext>();

  const [posts, setPosts] = useState<PendingGroupPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingPostId, setProcessingPostId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
    page: 1,
  });

  const fetchPosts = useCallback(async () => {
    if (!groupId) return;

    try {
      const res = await groupApi.getPendingGroupPosts(groupId, currentPage);
      setPosts(res.data.posts);
      setPagination(res.data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }, [groupId, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleApprove = async (postId: number) => {
    if (!groupId) return;

    setProcessingPostId(postId);
    try {
      await groupApi.approveGroupPost(groupId, postId);
      toast.success("Đã duyệt bài viết");
      await fetchPosts();
      await refreshGroupDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingPostId(null);
    }
  };

  const handleReject = async (postId: number) => {
    if (!groupId) return;

    setProcessingPostId(postId);
    try {
      await groupApi.rejectGroupPost(groupId, postId);
      toast.success("Đã từ chối bài viết");
      await fetchPosts();
      await refreshGroupDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingPostId(null);
    }
  };

  if (
    !canManageMembers ||
    !groupDetail?.postApprovalRequired
  ) {
    return <Navigate to={`/groups/${groupId}`} replace />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-on-surface">Duyệt bài viết</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Các bài viết gửi khi nhóm bật phê duyệt bài viết. Chỉ quản trị viên và
          kiểm duyệt viên có thể duyệt hoặc từ chối.
        </p>
      </div>

      <PendingPostReviewTable
        groupId={groupId!}
        posts={posts}
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        processingPostId={processingPostId}
        onPageChange={setCurrentPage}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
