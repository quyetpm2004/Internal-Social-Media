import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { adminApi } from "@/features/admin/api/admin.api";
import AdminPagination from "@/features/admin/components/AdminPagination";
import type { AdminComment, Pagination } from "@/features/admin/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unexpected error";
}

function stripHtml(content: string) {
  return content.replace(/<[^>]*>/g, "");
}

type StatusFilter = "" | "ACTIVE" | "HIDDEN" | "DELETED";
type PendingAction = {
  commentId: number;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
};

export default function AdminCommentsPage() {
  const { t } = useTranslation();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const fetchComments = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getComments({
        page: targetPage,
        search,
        status: statusFilter || undefined,
      });
      setComments(res.data.comments);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComments(1);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingAction) return;

    setActionId(pendingAction.commentId);
    try {
      await adminApi.updateCommentStatus(
        pendingAction.commentId,
        pendingAction.status,
      );
      toast.success(t("pages.admin.commentStatusUpdated"));
      setPendingAction(null);
      fetchComments();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const getStatusBadge = (status: AdminComment["status"]) => {
    if (status === "ACTIVE") {
      return <Badge variant="active">{t("common.active")}</Badge>;
    }
    if (status === "HIDDEN") {
      return <Badge variant="inactive">{t("pages.admin.commentHidden")}</Badge>;
    }
    return <Badge variant="inactive">{t("pages.admin.commentDeleted")}</Badge>;
  };

  const getConfirmCopy = () => {
    if (!pendingAction) return { title: "", description: "" };

    if (pendingAction.status === "HIDDEN") {
      return {
        title: t("pages.admin.hideCommentTitle"),
        description: t("pages.admin.hideCommentDescription"),
      };
    }

    if (pendingAction.status === "DELETED") {
      return {
        title: t("pages.admin.deleteCommentTitle"),
        description: t("pages.admin.deleteCommentDescription"),
      };
    }

    return {
      title: t("pages.admin.restoreCommentTitle"),
      description: t("pages.admin.restoreCommentDescription"),
    };
  };

  const confirmCopy = getConfirmCopy();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("pages.admin.commentsTitle")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("pages.admin.commentsDescription")}
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <Input
            placeholder={t("pages.admin.searchCommentsPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button
            type="submit"
            className="cursor-pointer text-white bg-primary hover:bg-primary/90"
          >
            {t("common.search")}
          </Button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as StatusFilter);
          }}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          <option value="">{t("pages.admin.allCommentStatuses")}</option>
          <option value="ACTIVE">{t("common.active")}</option>
          <option value="HIDDEN">{t("pages.admin.commentHidden")}</option>
          <option value="DELETED">{t("pages.admin.commentDeleted")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.content")}</TableHead>
                <TableHead>{t("common.author")}</TableHead>
                <TableHead>{t("pages.admin.relatedPost")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{comment.content}</p>
                    {comment.isAnonymous && (
                      <span className="text-xs text-amber-600">
                        {t("pages.admin.anonymousComment")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{comment.user.fullName}</p>
                      <p className="text-xs text-gray-500">{comment.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <Link
                      to={`/admin/posts/${comment.post.id}`}
                      className="block truncate text-blue-600 hover:underline"
                      title={stripHtml(comment.post.content)}
                    >
                      {stripHtml(comment.post.content) || `#${comment.post.id}`}
                    </Link>
                    <p className="truncate text-xs text-gray-500">
                      {comment.post.group?.groupName ?? t("pages.admin.newsFeed")}
                    </p>
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {comment.status !== "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="unlocked"
                          disabled={actionId === comment.id}
                          onClick={() =>
                            setPendingAction({
                              commentId: comment.id,
                              status: "ACTIVE",
                            })
                          }
                        >
                          {t("pages.admin.restore")}
                        </Button>
                      )}
                      {comment.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === comment.id}
                          onClick={() =>
                            setPendingAction({
                              commentId: comment.id,
                              status: "HIDDEN",
                            })
                          }
                        >
                          {t("pages.admin.hide")}
                        </Button>
                      )}
                      {comment.status !== "DELETED" && (
                        <Button
                          size="sm"
                          variant="locked"
                          disabled={actionId === comment.id}
                          onClick={() =>
                            setPendingAction({
                              commentId: comment.id,
                              status: "DELETED",
                            })
                          }
                        >
                          {t("common.delete")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <AdminPagination pagination={pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <ConfirmModal
        open={pendingAction !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmText={t("common.confirm")}
        loading={actionId !== null}
        variant={pendingAction?.status === "ACTIVE" ? "primary" : "danger"}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
