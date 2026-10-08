import { useMemo, useState, type FormEvent } from "react";
import type { Member } from "@/features/group/types/group.type";
import type { GroupMemberRole } from "@/features/group/utils/group-member";
import {
  formatGroupMemberRole,
  getAssignableRoles,
  GROUP_MEMBER_ROLE_OPTIONS,
} from "@/features/group/utils/group-member";
import { useTranslation } from "react-i18next";
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Select from "@/components/shared/Select";

type EditMemberRoleModalProps = {
  open: boolean;
  loading?: boolean;
  member: Member | null;
  actorRole: GroupMemberRole;
  onClose: () => void;
  onSubmit: (memberRole: GroupMemberRole) => void;
};

const FORM_ID = "edit-member-role";

export const EditMemberRoleModal = ({
  open,
  loading = false,
  member,
  actorRole,
  onClose,
  onSubmit,
}: EditMemberRoleModalProps) => {
  const { t } = useTranslation();
  const assignableRoles = useMemo(
    () => getAssignableRoles(actorRole),
    [actorRole],
  );

  const [selectedRole, setSelectedRole] = useState<GroupMemberRole>(() => {
    if (!member) return "MEMBER";
    return assignableRoles.includes(member.memberRole)
      ? member.memberRole
      : (assignableRoles[0] ?? "MEMBER");
  });

  if (!member) return null;

  const roleOptions = GROUP_MEMBER_ROLE_OPTIONS.filter((opt) =>
    assignableRoles.includes(opt.value),
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(selectedRole);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.groups.editRole")}
      containerClassName="z-60"
      formId={FORM_ID}
      confirmText={t("pages.groups.saveChanges")}
      loading={loading}
      confirmDisabled={selectedRole === member.memberRole}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">
          {t("common.members")}:{" "}
          <span className="font-semibold text-slate-800">{member.fullName}</span>
        </p>
        <p className="text-sm text-slate-500">
          {t("pages.groups.currentRole")}:{" "}
          {formatGroupMemberRole(member.memberRole)}
        </p>
        <Field label={t("pages.groups.newRole")}>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as GroupMemberRole)}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
};
