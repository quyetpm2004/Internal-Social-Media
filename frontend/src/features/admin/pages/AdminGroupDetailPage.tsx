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
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unexpected error";
}

function formatMemberStatus(
  status: AdminGroupMember["status"],
  t: (key: string) => string,
): string {
  const labels: Record<AdminGroupMember["status"], string> = {
    ACTIVE: t("pages.admin.memberStatusActive"),
    PENDING: t("pages.admin.memberStatusPending"),
    BLOCKED: t("pages.admin.memberStatusBlocked"),
  };
  return labels[status] ?? status;
}

export default function AdminGroupDetailPage() {
  const { t } = useTranslation();
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
      toast.success(t("pages.admin.groupDeleted"));
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
    return <p className="text-muted-foreground">{t("pages.groups.notFound")}</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/groups">{`← ${t("common.back")}`}</Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            {t("pages.admin.groupDetailTitle", { name: group.groupName })}
          </h1>
        </div>
        {group.status !== "ARCHIVED" && (
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t("common.delete")}
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
            <span className="text-muted-foreground">{t("common.description")}:</span>{" "}
            {group.description || t("common.none")}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("common.type")}:</span>
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
                ? t("common.public")
                : group.groupType === "PRIVATE"
                  ? t("common.private")
                  : t("common.department")}
            </Badge>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("common.status")}:</span>
            <Badge variant={group.status === "ACTIVE" ? "active" : "inactive"}>
              {group.status === "ACTIVE" ? t("common.active") : t("common.locked")}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">{t("common.creator")}:</span>{" "}
            {group.creator.fullName} ({group.creator.email})
          </p>
          <p>
            <span className="text-muted-foreground">{t("common.department")}:</span>{" "}
            {group.department?.name ?? t("common.none")}
          </p>
          <p>
            <span className="text-muted-foreground">
              {t("common.members")} / {t("common.posts")}:
            </span>{" "}
            {group._count.members} / {group._count.posts}
          </p>
          <p>
            <span className="text-muted-foreground">{t("common.createdAt")}:</span>{" "}
            {new Date(group.createdAt).toLocaleString("vi-VN")}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("pages.admin.groupMembersTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("pages.admin.noGroupMembers")}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.fullName")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.role")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.joinedAt")}</TableHead>
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
                          {formatMemberStatus(member.status, t)}
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
        title={t("pages.admin.deleteGroupTitle")}
        description={t("pages.admin.deleteGroupDescription")}
        confirmText={t("common.delete")}
        loading={deleting}
        variant="danger"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
