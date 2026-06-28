import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unexpected error";
}

type RoleFilter = "" | "EMPLOYEE" | "MANAGER" | "ADMIN";
type StatusFilter = "" | "ACTIVE" | "INACTIVE" | "PENDING";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "",
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [approveUser, setApproveUser] = useState<AdminUser | null>(null);
  const [rejectUser, setRejectUser] = useState<AdminUser | null>(null);
  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
  const [nextRole, setNextRole] = useState<AdminUser["role"]>("EMPLOYEE");

  const fetchUsers = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page: targetPage,
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
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
  }, [page, roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setPage(1);
    setStatusFilter(value);
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
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

  const handleApproveUser = async () => {
    if (!approveUser) return;

    setActionId(approveUser.id);
    try {
      await adminApi.updateUserStatus(approveUser.id, "ACTIVE");
      toast.success(t("pages.admin.userApproved"));
      setApproveUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const handleRejectUser = async () => {
    if (!rejectUser) return;

    setActionId(rejectUser.id);
    try {
      await adminApi.updateUserStatus(rejectUser.id, "INACTIVE");
      toast.success(t("pages.admin.userRejected"));
      setRejectUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const openRoleModal = (user: AdminUser) => {
    setRoleUser(user);
    setNextRole(user.role);
  };

  const handleConfirmRoleChange = async () => {
    if (!roleUser) return;

    setActionId(roleUser.id);
    try {
      await adminApi.updateUserRole(roleUser.id, nextRole);
      toast.success(t("pages.admin.roleUpdated"));
      setRoleUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const getRoleLabel = (role: AdminUser["role"]) => {
    if (role === "ADMIN") return t("common.roles.admin");
    if (role === "MANAGER") return t("common.roles.manager");
    return t("common.roles.employee");
  };

  const getStatusLabel = (status: AdminUser["status"]) => {
    if (status === "ACTIVE") return t("common.active");
    if (status === "PENDING") return t("common.pendingApproval");
    return t("common.locked");
  };

  const getStatusVariant = (status: AdminUser["status"]) => {
    if (status === "ACTIVE") return "active" as const;
    if (status === "PENDING") return "department" as const;
    return "inactive" as const;
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t("pages.admin.usersTitle")}</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
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

        <select
          value={statusFilter}
          onChange={(e) =>
            handleStatusFilterChange(e.target.value as StatusFilter)
          }
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          <option value="">{t("pages.admin.allUserStatuses")}</option>
          <option value="ACTIVE">{t("common.active")}</option>
          <option value="PENDING">{t("common.pendingApproval")}</option>
          <option value="INACTIVE">{t("common.locked")}</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value as RoleFilter);
          }}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
        >
          <option value="">{t("pages.admin.allRoles")}</option>
          <option value="EMPLOYEE">{t("common.roles.employee")}</option>
          <option value="MANAGER">{t("common.roles.manager")}</option>
          <option value="ADMIN">{t("common.roles.admin")}</option>
        </select>
      </div>

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
                    <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(user.status)}>
                      {getStatusLabel(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            className="text-white bg-primary hover:bg-primary/90"
                            disabled={
                              actionId === user.id || user.id === currentUser?.id
                            }
                            onClick={() => setApproveUser(user)}
                          >
                            {t("pages.admin.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="locked"
                            disabled={
                              actionId === user.id || user.id === currentUser?.id
                            }
                            onClick={() => setRejectUser(user)}
                          >
                            {t("pages.admin.reject")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={user.id === currentUser?.id}
                            onClick={() => openRoleModal(user)}
                          >
                            {t("pages.admin.changeRole")}
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              user.status === "ACTIVE" ? "locked" : "unlocked"
                            }
                            disabled={
                              actionId === user.id || user.id === currentUser?.id
                            }
                            onClick={() => setConfirmUser(user)}
                          >
                            {user.status === "ACTIVE"
                              ? t("common.lock")
                              : t("common.unlock")}
                          </Button>
                        </>
                      )}
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

      <ConfirmModal
        open={approveUser !== null}
        title={t("pages.admin.approveUserTitle")}
        description={t("pages.admin.approveUserDescription", {
          name: approveUser?.fullName,
        })}
        confirmText={t("pages.admin.approve")}
        loading={actionId !== null}
        variant="primary"
        onCancel={() => setApproveUser(null)}
        onConfirm={handleApproveUser}
      />

      <ConfirmModal
        open={rejectUser !== null}
        title={t("pages.admin.rejectUserTitle")}
        description={t("pages.admin.rejectUserDescription", {
          name: rejectUser?.fullName,
        })}
        confirmText={t("pages.admin.reject")}
        loading={actionId !== null}
        variant="danger"
        onCancel={() => setRejectUser(null)}
        onConfirm={handleRejectUser}
      />

      <ConfirmModal
        open={roleUser !== null}
        title={t("pages.admin.changeRoleTitle")}
        description={t("pages.admin.changeRoleDescription", {
          name: roleUser?.fullName,
        })}
        confirmText={t("common.save")}
        loading={actionId !== null}
        variant="primary"
        onCancel={() => setRoleUser(null)}
        onConfirm={handleConfirmRoleChange}
      >
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("pages.groups.newRole")}
          </label>
          <select
            value={nextRole}
            onChange={(e) =>
              setNextRole(e.target.value as AdminUser["role"])
            }
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
          >
            <option value="EMPLOYEE">{t("common.roles.employee")}</option>
            <option value="MANAGER">{t("common.roles.manager")}</option>
            <option value="ADMIN">{t("common.roles.admin")}</option>
          </select>
        </div>
      </ConfirmModal>
    </div>
  );
}
