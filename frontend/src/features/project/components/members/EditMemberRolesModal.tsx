import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Modal from "@/components/shared/Modal";
import { projectApi } from "@/features/project/api/project.api";
import RoleChecklist from "@/features/project/components/members/RoleChecklist";
import type {
  ProjectMemberItem,
  ProjectMemberRole,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

const FORM_ID = "edit-project-member-roles";

type EditMemberRolesModalProps = {
  projectId: number;
  member: ProjectMemberItem | null;
  roles: ProjectMemberRole[];
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditMemberRolesModal({
  projectId,
  member,
  roles,
  onClose,
  onUpdated,
}: EditMemberRolesModalProps) {
  const { t } = useTranslation();
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRoleIds(member?.roles.map((role) => role.id) ?? []);
  }, [member]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!member || roleIds.length === 0) return;

    setSaving(true);
    try {
      await projectApi.updateMemberRoles(projectId, member.userId, roleIds);
      toast.success(t("pages.projects.membersPanel.rolesUpdated"));
      onUpdated();
      onClose();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={member !== null}
      onClose={onClose}
      title={t("pages.projects.membersPanel.editTitle")}
      description={
        member
          ? t("pages.projects.membersPanel.editDescription", {
              name: member.fullName,
            })
          : undefined
      }
      formId={FORM_ID}
      loading={saving}
      confirmText={t("common.save")}
      confirmDisabled={roleIds.length === 0}
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <RoleChecklist roles={roles} selectedIds={roleIds} onChange={setRoleIds} />
      </form>
    </Modal>
  );
}
