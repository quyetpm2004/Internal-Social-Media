import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "@/components/shared/Checkbox";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import Textarea from "@/components/shared/Textarea";
import {
  STATUS_CATEGORIES,
  flagsForCategory,
} from "@/features/project/components/workflow/workflow-flow";
import type {
  ProjectWorkflowStatusDetail,
  WorkflowStatusCategory,
} from "@/features/project/types/project.type";

type StatusFormModalProps = {
  open: boolean;
  status: ProjectWorkflowStatusDetail | null;
  otherInitial: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (value: {
    name: string;
    description: string | null;
    category: WorkflowStatusCategory;
    color: string | null;
    isInitial: boolean;
    isFinal: boolean;
  }) => void;
};

export default function StatusFormModal({
  open,
  status,
  otherInitial,
  submitting,
  onClose,
  onSubmit,
}: StatusFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string | null>("#3B82F6");
  const [category, setCategory] = useState<WorkflowStatusCategory>("TODO");
  const [isInitial, setIsInitial] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !status) return;
    setName(status.name);
    setDescription(status.description ?? "");
    setColor(status.color);
    setCategory(status.category);
    setIsInitial(status.isInitial);
    setIsFinal(status.isFinal);
    setError("");
  }, [open, status]);

  const handleCategory = (next: WorkflowStatusCategory) => {
    const flags = flagsForCategory(next, { isInitial, isFinal });
    setCategory(flags.category);
    setIsInitial(flags.isInitial);
    setIsFinal(flags.isFinal);
  };

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
      category,
      color,
      isInitial,
      isFinal,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.projects.workflowPanel.editStatus")}
      formId="project-status-form"
      confirmText={t("common.save")}
      loading={submitting}
      confirmDisabled={!status}
      size="lg"
    >
      {status && (
        <form
          id="project-status-form"
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          <Field label={t("pages.projects.workflowPanel.key")}>
            <Input value={status.key} readOnly />
          </Field>
          <Field
            label={t("pages.projects.workflowPanel.name")}
            htmlFor="status-name"
            required
            error={error}
          >
            <Input
              id="status-name"
              value={name}
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Field
            label={t("common.description")}
            htmlFor="status-description"
          >
            <Textarea
              id="status-description"
              value={description}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("pages.projects.workflowPanel.color")}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={t("pages.projects.workflowPanel.color")}
                  value={color ?? "#94A3B8"}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                />
                <button
                  type="button"
                  disabled={color == null}
                  onClick={() => setColor(null)}
                  className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("pages.projects.workflowPanel.clearColor")}
                </button>
              </div>
            </Field>
            <Field
              label={t("pages.projects.workflowPanel.categoryLabel")}
              htmlFor="status-category"
            >
              <Select
                id="status-category"
                value={category}
                onChange={(event) =>
                  handleCategory(event.target.value as WorkflowStatusCategory)
                }
              >
                {STATUS_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {t(`pages.projects.workflowPanel.category.${item}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <Checkbox
              label={t("pages.projects.workflowPanel.initial")}
              checked={isInitial}
              disabled={category !== "TODO" || submitting}
              onChange={(event) => {
                const checked = event.target.checked;
                setIsInitial(checked);
                if (checked) {
                  setIsFinal(false);
                  setCategory("TODO");
                }
              }}
            />
            <Checkbox
              label={t("pages.projects.workflowPanel.final")}
              checked={isFinal}
              disabled={
                category === "TODO" || category === "IN_PROGRESS" || submitting
              }
              onChange={(event) => setIsFinal(event.target.checked)}
            />
            {isInitial && otherInitial && (
              <p className="text-xs text-amber-700">
                {t("pages.projects.workflowPanel.initialReplaced")}
              </p>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
