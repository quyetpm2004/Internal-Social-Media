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
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unexpected error";
}

export default function AdminGroupsPage() {
  const { t } = useTranslation();
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
      toast.success(t("pages.admin.groupDeleted"));
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
      <h1 className="mb-6 text-2xl font-semibold">{t("pages.admin.groupsTitle")}</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <Input
          placeholder={t("pages.admin.searchGroupsPlaceholder")}
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
                <TableHead>{t("common.groupName")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead>{t("common.members")}</TableHead>
                <TableHead>{t("common.posts")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                        ? t("common.public")
                        : group.groupType === "DEPARTMENT"
                          ? t("common.department")
                          : t("common.private")}
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
                      {group.status === "ACTIVE"
                        ? t("common.active")
                        : t("common.locked")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/groups/${group.id}`}>{t("common.details")}</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={
                          deletingId === group.id || group.status === "ARCHIVED"
                        }
                        onClick={() => setConfirmDeleteId(group.id)}
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
        title={t("pages.admin.deleteGroupTitle")}
        description={t("pages.admin.deleteGroupDescription")}
        confirmText={t("common.delete")}
        loading={deletingId !== null}
        variant="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
