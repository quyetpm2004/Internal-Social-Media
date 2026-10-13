import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Textarea from "@/components/shared/Textarea";
import { STATUS_KEY_REGEX } from "@/features/project/components/workflow/workflow-flow";
import type {
  CreateProjectRolePayload,
  ProjectMemberRole,
  SaveProjectRolePayload,
} from "@/features/project/types/project.type";

type RoleFormModalProps = {
  open: boolean;
  role: ProjectMemberRole | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (value: CreateProjectRolePayload | SaveProjectRolePayload) => void;
};

export default function RoleFormModal({
  open,
  role,
  submitting,
  onClose,
  onSubmit,
}: RoleFormModalProps) {
  const { t } = useTranslation();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setKey(role?.key ?? "");
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setSortOrder(String(role?.sortOrder ?? 0));
    setError("");
  }, [open, role]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const order = Number(sortOrder);
    if (!trimmedName) {
      setError(t("pages.projects.workflowPanel.nameRequired"));
      return;
    }
    if (!Number.isInteger(order) || order < 0) {
      setError(t("pages.projects.membersPanel.sortOrderInvalid"));
      return;
    }
    const payload: SaveProjectRolePayload = {
      name: trimmedName,
      description: description.trim() || null,
      sortOrder: order,
    };
    if (role) {
      onSubmit(payload);
      return;
    }
    const roleKey = key.trim();
    if (!STATUS_KEY_REGEX.test(roleKey)) {
      setError(t("pages.projects.workflowPanel.keyInvalid"));
      return;
    }
    onSubmit({ ...payload, key: roleKey });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        role
          ? t("pages.projects.membersPanel.editRole")
          : t("pages.projects.membersPanel.addRole")
      }
      formId="project-role-form"
      confirmText={t("common.save")}
      loading={submitting}
      size="lg"
    >
      <form id="project-role-form" className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label={t("pages.projects.workflowPanel.key")}
          htmlFor="project-role-key"
          required
          error={error}
        >
          <Input
            id="project-role-key"
            value={key}
            maxLength={50}
            disabled={Boolean(role) || submitting}
            onChange={(event) => setKey(event.target.value.toUpperCase())}
            required
          />
        </Field>
        <Field
          label={t("pages.projects.workflowPanel.name")}
          htmlFor="project-role-name"
          required
        >
          <Input
            id="project-role-name"
            value={name}
            maxLength={150}
            disabled={submitting}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>
        <Field
          label={t("common.description")}
          htmlFor="project-role-description"
        >
          <Textarea
            id="project-role-description"
            value={description}
            maxLength={2000}
            disabled={submitting}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field
          label={t("pages.projects.membersPanel.sortOrder")}
          htmlFor="project-role-sort"
        >
          <Input
            id="project-role-sort"
            type="number"
            min={0}
            value={sortOrder}
            disabled={submitting}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
