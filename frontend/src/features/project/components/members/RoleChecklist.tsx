import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { sortRoles } from "@/features/project/components/members/member-style";
import type { ProjectMemberRole } from "@/features/project/types/project.type";

type RoleChecklistProps = {
  roles: ProjectMemberRole[];
  selectedIds: number[];
  onChange: (roleIds: number[]) => void;
};

export default function RoleChecklist({
  roles,
  selectedIds,
  onChange,
}: RoleChecklistProps) {
  const { t } = useTranslation();
  const ordered = sortRoles(roles);

  const toggle = (roleId: number, checked: boolean) => {
    onChange(
      checked
        ? [...selectedIds, roleId]
        : selectedIds.filter((id) => id !== roleId),
    );
  };

  if (ordered.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {t("pages.projects.membersPanel.noRoles")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">
        {t("pages.projects.membersPanel.roles")}
      </p>
      <ul className="space-y-1">
        {ordered.map((role) => {
          const checked = selectedIds.includes(role.id);
          return (
            <li key={role.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggle(role.id, value === true)}
                />
                <span className="text-sm text-slate-800">{role.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {selectedIds.length === 0 && (
        <p className="text-xs text-amber-700">
          {t("pages.projects.membersPanel.rolesRequired")}
        </p>
      )}
    </div>
  );
}
