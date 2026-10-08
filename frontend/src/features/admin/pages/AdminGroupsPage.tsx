import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Modal from "@/components/shared/Modal";
import PaginationBar from "@/components/shared/Pagination";
import {
  SearchField,
  SearchFilter,
  searchButtonClass,
} from "@/components/shared/SearchFilter";
import { adminApi } from "@/features/admin/api/admin.api";
import type { AdminGroup, Pagination } from "@/features/admin/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
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

      <SearchFilter>
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
          <SearchField
            placeholder={t("pages.admin.searchGroupsPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" className={searchButtonClass}>
            {t("common.search")}
          </Button>
        </form>
      </SearchFilter>

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
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <Modal
        open={confirmDeleteId !== null}
        title={t("pages.admin.deleteGroupTitle")}
        description={t("pages.admin.deleteGroupDescription")}
        confirmText={t("common.delete")}
        loading={deletingId !== null}
        variant="danger"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
