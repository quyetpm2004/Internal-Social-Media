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

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Đã xảy ra lỗi";
}

export default function AdminPostsPage() {
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
      toast.success("Đã xóa bài viết");
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
      <h1 className="mb-6 text-2xl font-semibold">Quản lý bài viết</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <Input
          placeholder="Tìm theo nội dung hoặc tác giả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          className="cursor-pointer text-white bg-primary hover:bg-primary/90"
          type="submit"
        >
          Tìm kiếm
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
                <TableHead>Nội dung</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs truncate">
                    {post.content.replace(/<[^>]*>/g, "")}
                  </TableCell>
                  <TableCell>{post.user.fullName}</TableCell>
                  <TableCell>{post.group?.groupName ?? "News Feed"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={post.status === "ACTIVE" ? "active" : "inactive"}
                    >
                      {post.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/posts/${post.id}`}>Chi tiết</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={deletingId === post.id}
                        onClick={() => setConfirmDeleteId(post.id)}
                      >
                        Xóa
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
        title="Xóa bài viết?"
        description="Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deletingId !== null}
        variant="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
