import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Field from "@/components/shared/Field";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import PaginationBar from "@/components/shared/Pagination";
import {
  FilterSelect,
  SearchField,
  SearchFilter,
  searchButtonClass,
} from "@/components/shared/SearchFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import { adminApi } from "@/features/admin/api/admin.api";
import type { AdminUser, Pagination } from "@/features/admin/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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

      <SearchFilter>
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
          <SearchField
            placeholder={t("pages.admin.searchUsersPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" className={searchButtonClass}>
            {t("common.search")}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={statusFilter}
            onChange={(e) =>
              handleStatusFilterChange(e.target.value as StatusFilter)
            }
          >
            <option value="">{t("pages.admin.allUserStatuses")}</option>
            <option value="ACTIVE">{t("common.active")}</option>
            <option value="PENDING">{t("common.pendingApproval")}</option>
            <option value="INACTIVE">{t("common.locked")}</option>
          </FilterSelect>

          <FilterSelect
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value as RoleFilter);
            }}
          >
            <option value="">{t("pages.admin.allRoles")}</option>
            <option value="EMPLOYEE">{t("common.roles.employee")}</option>
            <option value="MANAGER">{t("common.roles.manager")}</option>
            <option value="ADMIN">{t("common.roles.admin")}</option>
          </FilterSelect>
        </div>
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
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <Modal
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
        onClose={() => setConfirmUser(null)}
        onConfirm={handleConfirmToggleStatus}
      />

      <Modal
        open={approveUser !== null}
        title={t("pages.admin.approveUserTitle")}
        description={t("pages.admin.approveUserDescription", {
          name: approveUser?.fullName,
        })}
        confirmText={t("pages.admin.approve")}
        loading={actionId !== null}
        variant="primary"
        onClose={() => setApproveUser(null)}
        onConfirm={handleApproveUser}
      />

      <Modal
        open={rejectUser !== null}
        title={t("pages.admin.rejectUserTitle")}
        description={t("pages.admin.rejectUserDescription", {
          name: rejectUser?.fullName,
        })}
        confirmText={t("pages.admin.reject")}
        loading={actionId !== null}
        variant="danger"
        onClose={() => setRejectUser(null)}
        onConfirm={handleRejectUser}
      />

      <Modal
        open={roleUser !== null}
        title={t("pages.admin.changeRoleTitle")}
        description={t("pages.admin.changeRoleDescription", {
          name: roleUser?.fullName,
        })}
        confirmText={t("common.save")}
        loading={actionId !== null}
        variant="primary"
        onClose={() => setRoleUser(null)}
        onConfirm={handleConfirmRoleChange}
      >
        <Field label={t("pages.groups.newRole")} htmlFor="change-user-role">
          <Select
            id="change-user-role"
            value={nextRole}
            onChange={(e) =>
              setNextRole(e.target.value as AdminUser["role"])
            }
          >
            <option value="EMPLOYEE">{t("common.roles.employee")}</option>
            <option value="MANAGER">{t("common.roles.manager")}</option>
            <option value="ADMIN">{t("common.roles.admin")}</option>
          </Select>
        </Field>
      </Modal>
    </div>
  );
}
