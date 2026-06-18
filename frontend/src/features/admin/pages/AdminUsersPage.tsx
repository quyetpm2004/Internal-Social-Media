import { useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { adminApi } from "@/features/admin/api/admin.api";
import AdminPagination from "@/features/admin/components/AdminPagination";
import type { AdminUser, Pagination } from "@/features/admin/types/admin.type";
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

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);

  const fetchUsers = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ page: targetPage, search });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmUser) return;
    const newStatus = confirmUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionId(confirmUser.id);
    try {
      await adminApi.updateUserStatus(confirmUser.id, newStatus);
      toast.success(
        newStatus === "ACTIVE"
          ? t("pages.admin.userUnlocked")
          : t("pages.admin.userLocked"),
      );
      setConfirmUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t("pages.admin.usersTitle")}</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <Input
          placeholder={t("pages.admin.searchUsersPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm outline-none"
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
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.fullName")}</TableHead>
                <TableHead>{t("common.email")}</TableHead>
                <TableHead>{t("common.role")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "ACTIVE" ? "active" : "inactive"}
                    >
                      {user.status === "ACTIVE"
                        ? t("common.active")
                        : t("common.locked")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={user.status === "ACTIVE" ? "locked" : "unlocked"}
                      disabled={actionId === user.id}
                      onClick={() => setConfirmUser(user)}
                    >
                      {user.status === "ACTIVE"
                        ? t("common.lock")
                        : t("common.unlock")}
                    </Button>
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
        open={confirmUser !== null}
        title={
          confirmUser?.status === "ACTIVE"
            ? t("pages.admin.lockUserTitle")
            : t("pages.admin.unlockUserTitle")
        }
        description={
          confirmUser?.status === "ACTIVE"
            ? t("pages.admin.lockUserDescription", { name: confirmUser.fullName })
            : t("pages.admin.unlockUserDescription", { name: confirmUser?.fullName })
        }
        confirmText={
          confirmUser?.status === "ACTIVE" ? t("common.lock") : t("common.unlock")
        }
        loading={actionId !== null}
        variant={confirmUser?.status === "ACTIVE" ? "danger" : "primary"}
        onCancel={() => setConfirmUser(null)}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
}
