import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Modal from "@/components/shared/Modal";
import { projectApi } from "@/features/project/api/project.api";
import RoleFormModal from "@/features/project/components/members/RoleFormModal";
import { sortRoles } from "@/features/project/components/members/member-style";
import type {
  CreateProjectRolePayload,
  ProjectMemberRole,
  SaveProjectRolePayload,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type RoleCatalogProps = {
  projectId: number;
  roles: ProjectMemberRole[];
  canManage: boolean;
  onChanged: () => void;
};

export default function RoleCatalog({
  projectId,
  roles,
  canManage,
  onChanged,
}: RoleCatalogProps) {
  const { t } = useTranslation();
  const ordered = sortRoles(roles);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectMemberRole | null>(null);
  const [removing, setRemoving] = useState<ProjectMemberRole | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSave = async (
    value: CreateProjectRolePayload | SaveProjectRolePayload,
  ) => {
    setBusy(true);
    try {
      if (editing) {
        await projectApi.updateRole(projectId, editing.id, value);
        toast.success(t("pages.projects.membersPanel.roleUpdated"));
      } else {
        await projectApi.createRole(
          projectId,
          value as CreateProjectRolePayload,
        );
        toast.success(t("pages.projects.membersPanel.roleCreated"));
      }
      setFormOpen(false);
      setEditing(null);
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await projectApi.deleteRole(projectId, removing.id);
      toast.success(t("pages.projects.membersPanel.roleDeleted"));
      setRemoving(null);
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {t("pages.projects.membersPanel.roleCatalog")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("pages.projects.membersPanel.roleCatalogHint")}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            {t("pages.projects.membersPanel.addRole")}
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {t("pages.projects.membersPanel.noRoles")}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs font-semibold text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.workflowPanel.key")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.workflowPanel.name")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("common.description")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.membersPanel.sortOrder")}
                </th>
                {canManage && (
                  <th className="py-2 text-right font-semibold">
                    {t("common.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {ordered.map((role) => (
                <tr key={role.id} className="border-t border-slate-100">
                  <td className="py-3 pr-3 font-medium text-slate-700">
                    {role.key}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-slate-800">
                    {role.name}
                  </td>
                  <td className="max-w-xs truncate py-3 pr-3 text-slate-500">
                    {role.description || "—"}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {role.sortOrder ?? 0}
                  </td>
                  {canManage && (
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditing(role);
                          setFormOpen(true);
                        }}
                        className="cursor-pointer px-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {t("pages.projects.workflowPanel.edit")}
                      </button>
                      {role.key !== "PROJECT_MANAGER" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setRemoving(role)}
                          className="cursor-pointer px-2 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                        >
                          {t("common.delete")}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoleFormModal
        open={formOpen}
        role={editing}
        submitting={busy}
        onClose={() => {
          if (busy) return;
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
      />
      <Modal
        open={removing != null}
        onClose={() => {
          if (!busy) setRemoving(null);
        }}
        title={t("pages.projects.membersPanel.deleteRole")}
        description={
          removing
            ? t("pages.projects.membersPanel.deleteRolePlain", {
                name: removing.name,
              })
            : undefined
        }
        variant="danger"
        confirmText={t("common.delete")}
        loading={busy}
        onConfirm={handleDelete}
      />
    </section>
  );
}
