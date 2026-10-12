import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "@/components/shared/Checkbox";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import { statusLabel } from "@/features/project/components/workflow/workflow-flow";
import type {
  ProjectWorkflowStatusDetail,
  ProjectWorkflowTransition,
} from "@/features/project/types/project.type";

type TransitionFormModalProps = {
  open: boolean;
  transition: ProjectWorkflowTransition | null;
  statuses: ProjectWorkflowStatusDetail[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (value: { name: string; isActive: boolean }) => void;
};

export default function TransitionFormModal({
  open,
  transition,
  statuses,
  submitting,
  onClose,
  onSubmit,
}: TransitionFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !transition) return;
    setName(transition.name);
    setIsActive(transition.isActive);
    setError("");
  }, [open, transition]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("pages.projects.workflowPanel.nameRequired"));
      return;
    }
    onSubmit({ name: trimmed, isActive });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.projects.workflowPanel.editTransition")}
      formId="project-transition-form"
      confirmText={t("common.save")}
      loading={submitting}
      confirmDisabled={!transition}
      size="lg"
    >
      {transition && (
        <form
          id="project-transition-form"
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          <p className="text-sm text-slate-600">
            {statusLabel(statuses, transition.fromStatusId)} →{" "}
            {statusLabel(statuses, transition.toStatusId)}
          </p>
          <Field
            label={t("pages.projects.workflowPanel.name")}
            htmlFor="transition-name"
            required
            error={error}
          >
            <Input
              id="transition-name"
              value={name}
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Checkbox
            label={t("pages.projects.workflowPanel.active")}
            checked={isActive}
            disabled={submitting}
            onChange={(event) => setIsActive(event.target.checked)}
          />
        </form>
      )}
    </Modal>
  );
}
