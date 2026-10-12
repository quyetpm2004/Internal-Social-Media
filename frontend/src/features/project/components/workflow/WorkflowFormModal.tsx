import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "@/components/shared/Checkbox";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Textarea from "@/components/shared/Textarea";
import type { ProjectWorkflow } from "@/features/project/types/project.type";

type WorkflowFormModalProps = {
  open: boolean;
  workflow: ProjectWorkflow | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (value: {
    name: string;
    description: string | null;
    isDefault: boolean;
    isActive: boolean;
  }) => void;
};

export default function WorkflowFormModal({
  open,
  workflow,
  submitting,
  onClose,
  onSubmit,
}: WorkflowFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(workflow?.name ?? "");
    setDescription(workflow?.description ?? "");
    setIsDefault(workflow?.isDefault ?? false);
    setIsActive(workflow ? workflow.isActive : true);
    setError("");
  }, [open, workflow]);

  const lockActive = isDefault;
  const lockDefault = Boolean(workflow?.isDefault);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("pages.projects.workflowPanel.nameRequired"));
      return;
    }
    onSubmit({
      name: trimmed,
      description: description.trim() || null,
      isDefault,
      isActive: isDefault ? true : isActive,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        workflow
          ? t("pages.projects.workflowPanel.editWorkflow")
          : t("pages.projects.workflowPanel.addWorkflow")
      }
      formId="project-workflow-form"
      confirmText={t("common.save")}
      loading={submitting}
      size="lg"
    >
      <form
        id="project-workflow-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <Field
          label={t("pages.projects.workflowPanel.name")}
          htmlFor="workflow-name"
          required
          error={error}
        >
          <Input
            id="workflow-name"
            value={name}
            maxLength={150}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>
        <Field
          label={t("common.description")}
          htmlFor="workflow-description"
        >
          <Textarea
            id="workflow-description"
            value={description}
            maxLength={2000}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <Checkbox
            label={t("pages.projects.workflowPanel.default")}
            checked={isDefault}
            disabled={lockDefault || submitting}
            onChange={(event) => {
              const checked = event.target.checked;
              setIsDefault(checked);
              if (checked) setIsActive(true);
            }}
          />
          <Checkbox
            label={t("pages.projects.workflowPanel.active")}
            checked={lockActive ? true : isActive}
            disabled={lockActive || submitting}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          {lockActive && (
            <p className="text-xs text-slate-500">
              {t("pages.projects.workflowPanel.defaultMustStayActive")}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
