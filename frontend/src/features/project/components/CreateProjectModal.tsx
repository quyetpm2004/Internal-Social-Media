import { useEffect, useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import Textarea from "@/components/shared/Textarea";
import { projectApi } from "@/features/project/api/project.api";
import {
  UrgentSwitch,
  VisibilityPicker,
} from "@/features/project/components/ProjectFields";
import type {
  CreateProjectPayload,
  ProjectPriority,
  ProjectTemplateOption,
  ProjectVisibility,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { cn } from "@/lib/utils";

const FORM_ID = "create-project";

const PRIORITIES: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type FormState = {
  name: string;
  description: string;
  visibility: ProjectVisibility;
  priority: ProjectPriority;
  isUrgent: boolean;
  startDate: string;
  endDate: string;
  templateId: number | null;
};

const initialForm = (): FormState => ({
  name: "",
  description: "",
  visibility: "PRIVATE",
  priority: "MEDIUM",
  isUrgent: false,
  startDate: "",
  endDate: "",
  templateId: null,
});

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectPayload) => Promise<void>;
  submitting?: boolean;
};

export default function CreateProjectModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}: CreateProjectModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<ProjectTemplateOption[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(initialForm());
    setErrors({});
    let cancelled = false;

    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await projectApi.getTemplateOptions();
        if (cancelled) return;
        const options = response.data;
        setTemplates(options);
        if (options.length === 1) {
          setForm((current) => ({ ...current, templateId: options[0].id }));
        }
      } catch (error) {
        if (!cancelled) {
          setTemplates([]);
          toastApiError(error);
        }
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const priorityLabel = (priority: ProjectPriority) =>
    t(`pages.projects.priorities.${priority}`);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t("pages.projects.nameRequired");
    if (!form.startDate) next.startDate = t("pages.projects.dateRequired");
    if (!form.endDate) next.endDate = t("pages.projects.dateRequired");
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = t("pages.projects.dateOrder");
    }
    if (!form.templateId)
      next.templateId = t("pages.projects.templateRequired");
    return next;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !form.templateId) return;

    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      visibility: form.visibility,
      priority: form.priority,
      isUrgent: form.isUrgent,
      startDate: form.startDate,
      endDate: form.endDate,
      templateId: form.templateId,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      className="max-h-[min(92vh,56rem)] max-w-4xl"
      formId={FORM_ID}
      loading={submitting}
      confirmText={t("pages.projects.create")}
      title={
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
            <Sparkles className="size-4" />
          </span>
          {t("pages.projects.createTitle")}
        </span>
      }
      description={t("pages.projects.createDescription")}
    >
      <form id={FORM_ID} className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            className="md:col-span-2"
            label={t("pages.projects.name")}
            htmlFor="project-name"
            required
            error={errors.name}
          >
            <Input
              id="project-name"
              value={form.name}
              maxLength={150}
              placeholder={t("pages.projects.namePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>

          <Field
            className="md:col-span-2"
            label={t("pages.projects.descriptionLabel")}
            htmlFor="project-description"
          >
            <Textarea
              id="project-description"
              value={form.description}
              maxLength={2000}
              placeholder={t("pages.projects.descriptionPlaceholder")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </Field>

          <Field
            className="md:col-span-2"
            label={t("pages.projects.visibility")}
          >
            <VisibilityPicker
              value={form.visibility}
              onChange={(visibility) =>
                setForm((current) => ({ ...current, visibility }))
              }
            />
          </Field>

          <Field
            label={t("pages.projects.startDate")}
            htmlFor="project-start"
            required
            error={errors.startDate}
          >
            <Input
              id="project-start"
              type="date"
              value={form.startDate}
              aria-invalid={Boolean(errors.startDate)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
            />
          </Field>

          <Field
            label={t("pages.projects.endDate")}
            htmlFor="project-end"
            required
            error={errors.endDate}
          >
            <Input
              id="project-end"
              type="date"
              value={form.endDate}
              aria-invalid={Boolean(errors.endDate)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
            />
          </Field>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {t("pages.projects.classification")}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <UrgentSwitch
              checked={form.isUrgent}
              onChange={(isUrgent) =>
                setForm((current) => ({ ...current, isUrgent }))
              }
            />
            <Field
              label={t("pages.projects.priority")}
              htmlFor="project-priority"
            >
              <Select
                id="project-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as ProjectPriority,
                  }))
                }
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabel(priority)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <Field
          label={t("pages.projects.template")}
          hint={t("pages.projects.templateHint")}
          error={errors.templateId}
        >
          {loadingTemplates ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              {t("pages.projects.noTemplates")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {templates.map((template) => {
                const selected = form.templateId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        templateId: template.id,
                      }))
                    }
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {template.name}
                      </span>
                      {selected && (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] text-white">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-primary">
                      {template.workflowName}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-slate-500">
                      {template.statusFlow.length > 0
                        ? template.statusFlow.join(" → ")
                        : template.description || template.key}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Field>
      </form>
    </Modal>
  );
}
