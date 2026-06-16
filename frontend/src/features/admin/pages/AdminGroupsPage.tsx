import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { adminApi } from "@/features/admin/api/admin.api";
import AdminPagination from "@/features/admin/components/AdminPagination";
import type { AdminGroup, Pagination } from "@/features/admin/types/admin.type";
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

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchGroups = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getGroups({ page: targetPage, search });
      setGroups(res.data.groups);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGroups(1);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await adminApi.deleteGroup(confirmDeleteId);
      toast.success("Đã xóa nhóm");
      setConfirmDeleteId(null);
      fetchGroups();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Quản lý nhóm</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <Input
          placeholder="Tìm theo tên nhóm..."
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
                <TableHead>Tên nhóm</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thành viên</TableHead>
                <TableHead>Bài viết</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.groupName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        group.groupType === "PUBLIC"
                          ? "public"
                          : group.groupType === "DEPARTMENT"
                            ? "department"
                            : "private"
                      }
                    >
                      {group.groupType === "PUBLIC"
                        ? "Công khai"
                        : group.groupType === "DEPARTMENT"
                          ? "Phòng ban"
                          : "Riêng tư"}
                    </Badge>
                  </TableCell>
                  <TableCell>{group._count.members}</TableCell>
                  <TableCell>{group._count.posts}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        group.status === "ACTIVE" ? "active" : "inactive"
                      }
                    >
                      {group.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/groups/${group.id}`}>Chi tiết</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={
                          deletingId === group.id || group.status === "ARCHIVED"
                        }
                        onClick={() => setConfirmDeleteId(group.id)}
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
        title="Xóa nhóm?"
        description="Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deletingId !== null}
        variant="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
