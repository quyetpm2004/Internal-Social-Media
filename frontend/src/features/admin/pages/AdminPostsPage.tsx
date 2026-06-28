import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { adminApi } from "@/features/admin/api/admin.api";
import AdminPagination from "@/features/admin/components/AdminPagination";
import type { AdminPost, Pagination } from "@/features/admin/types/admin.type";
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

function getPostStatusLabel(
  status: string,
  t: (key: string) => string,
) {
  if (status === "ACTIVE") return t("common.active");
  if (status === "PENDING_REVIEW") return t("common.pendingReview");
  if (status === "HIDDEN") return t("pages.admin.commentHidden");
  return t("common.locked");
}

export default function AdminPostsPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchPosts = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getPosts({ page: targetPage, search });
      setPosts(res.data.posts);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(1);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await adminApi.deletePost(confirmDeleteId);
      toast.success(t("pages.admin.postDeleted"));
      setConfirmDeleteId(null);
      fetchPosts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t("pages.admin.postsTitle")}</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <Input
          placeholder={t("pages.admin.searchPostsPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          className="cursor-pointer text-white bg-primary hover:bg-primary/90"
          type="submit"
        >
          {t("common.search")}
        </Button>
      </form>

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
                <TableHead>{t("common.group")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs truncate">
                    {post.content.replace(/<[^>]*>/g, "")}
                  </TableCell>
                  <TableCell>{post.user.fullName}</TableCell>
                  <TableCell>{post.group?.groupName ?? t("pages.admin.newsFeed")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "ACTIVE" ? "active" : "inactive"
                      }
                    >
                      {getPostStatusLabel(post.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/posts/${post.id}`}>{t("common.details")}</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={deletingId === post.id}
                        onClick={() => setConfirmDeleteId(post.id)}
                      >
                        {t("common.delete")}
                      </Button>
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
        open={confirmDeleteId !== null}
        title={t("pages.admin.deletePostTitle")}
        description={t("pages.admin.deletePostDescription")}
        confirmText={t("common.delete")}
        loading={deletingId !== null}
        variant="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
