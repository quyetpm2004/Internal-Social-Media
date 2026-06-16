import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { adminApi } from "@/features/admin/api/admin.api";
import AdminPagination from "@/features/admin/components/AdminPagination";
import type {
  AdminGroupDetail,
  AdminGroupMember,
  Pagination,
} from "@/features/admin/types/admin.type";
import { formatGroupMemberRole } from "@/features/group/utils/group-member";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function formatMemberStatus(status: AdminGroupMember["status"]): string {
  const labels: Record<AdminGroupMember["status"], string> = {
    ACTIVE: "Đang tham gia",
    PENDING: "Chờ duyệt",
    BLOCKED: "Đã chặn",
  };
  return labels[status] ?? status;
}

export default function AdminGroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<AdminGroupDetail | null>(null);
  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [membersPagination, setMembersPagination] = useState<Pagination | null>(
    null,
  );
  const [membersPage, setMembersPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await adminApi.getGroupDetail(Number(groupId));
        setGroup(res.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const res = await adminApi.getGroupMembers(Number(groupId), {
          page: membersPage,
        });
        setMembers(res.data.members);
        setMembersPagination(res.data.pagination);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, [groupId, membersPage]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteGroup(Number(groupId));
      toast.success("Đã xóa nhóm");
      navigate("/admin/groups");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!group) {
    return <p className="text-muted-foreground">Không tìm thấy nhóm.</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/groups">← Quay lại</Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            Chi tiết nhóm #{group.groupName}
          </h1>
        </div>
        {group.status !== "ARCHIVED" && (
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Xóa nhóm
          </Button>
        )}
      </div>

      {group.coverUrl && (
        <img
          src={group.coverUrl}
          alt={group.groupName}
          className="mb-4 h-40 w-full max-w-lg rounded-lg object-cover"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{group.groupName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Mô tả:</span>{" "}
            {group.description || "Không có"}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Loại:</span>
            <Badge
              variant={
                group.groupType === "PUBLIC"
                  ? "public"
                  : group.groupType === "PRIVATE"
                    ? "private"
                    : "department"
              }
            >
              {group.groupType === "PUBLIC"
                ? "Công khai"
                : group.groupType === "PRIVATE"
                  ? "Riêng tư"
                  : "Phòng ban"}
            </Badge>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Trạng thái:</span>
            <Badge variant={group.status === "ACTIVE" ? "active" : "inactive"}>
              {group.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">Người tạo:</span>{" "}
            {group.creator.fullName} ({group.creator.email})
          </p>
          <p>
            <span className="text-muted-foreground">Phòng ban:</span>{" "}
            {group.department?.name ?? "Không có"}
          </p>
          <p>
            <span className="text-muted-foreground">
              Thành viên / Bài viết:
            </span>{" "}
            {group._count.members} / {group._count.posts}
          </p>
          <p>
            <span className="text-muted-foreground">Ngày tạo:</span>{" "}
            {new Date(group.createdAt).toLocaleString("vi-VN")}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Thành viên nhóm</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nhóm chưa có thành viên nào.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.user.fullName}</TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatGroupMemberRole(member.memberRole)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "ACTIVE" ? "active" : "inactive"
                          }
                        >
                          {formatMemberStatus(member.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {membersPagination && (
                <AdminPagination
                  pagination={membersPagination}
                  onPageChange={setMembersPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa nhóm?"
        description="Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deleting}
        variant="danger"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
