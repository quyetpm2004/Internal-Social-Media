import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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

function stripHtml(content: string) {
  return content.replace(/<[^>]*>/g, "");
}

export default function AdminPendingPostsPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchPosts = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getPosts({
        page: targetPage,
        search,
        status: "PENDING_REVIEW",
      });
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

  const handleReview = async (postId: number, action: "approve" | "reject") => {
    setActionId(postId);
    try {
      await adminApi.reviewPost(postId, action);
      toast.success(
        action === "approve"
          ? t("pages.admin.postApproved")
          : t("pages.admin.postRejected"),
      );
      fetchPosts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("pages.admin.pendingPostsTitle")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("pages.admin.pendingPostsDescription")}
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <Input
          placeholder={t("pages.admin.searchPostsPlaceholder")}
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          {t("pages.admin.noPendingPosts")}
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
                    {stripHtml(post.content) || t("common.noContent")}
                  </TableCell>
                  <TableCell>{post.user.fullName}</TableCell>
                  <TableCell>
                    {post.group?.groupName ?? t("pages.admin.newsFeed")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="inactive">{t("common.pendingReview")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/posts/${post.id}`}>
                          {t("common.details")}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="unlocked"
                        disabled={actionId === post.id}
                        onClick={() => handleReview(post.id, "approve")}
                      >
                        {t("pages.admin.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={actionId === post.id}
                        onClick={() => handleReview(post.id, "reject")}
                      >
                        {t("pages.admin.reject")}
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
    </div>
  );
}
