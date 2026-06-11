import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "@/features/admin/api/admin.api";
import type { AdminGroupDetail } from "@/features/admin/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Đã xảy ra lỗi";
}

export default function AdminGroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<AdminGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa nhóm này?")) return;
    setDeleting(true);
    try {
      await adminApi.deleteGroup(Number(groupId));
      toast.success("Đã xóa nhóm");
      navigate("/admin/groups");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
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
          <h1 className="text-2xl font-semibold">Chi tiết nhóm #{group.id}</h1>
        </div>
        {group.status !== "ARCHIVED" && (
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
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
            <Badge variant="outline">{group.groupType}</Badge>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Trạng thái:</span>
            <Badge
              variant={group.status === "ACTIVE" ? "default" : "destructive"}
            >
              {group.status}
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
            <span className="text-muted-foreground">Thành viên / Bài viết:</span>{" "}
            {group._count.members} / {group._count.posts}
          </p>
          <p>
            <span className="text-muted-foreground">Ngày tạo:</span>{" "}
            {new Date(group.createdAt).toLocaleString("vi-VN")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
