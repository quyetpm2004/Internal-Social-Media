import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { projectTemplateApi } from "@/features/project-template/api/project-template.api";
import type { TemplateDetail } from "@/features/project-template/types/project-template.type";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { Button } from "@/components/ui/button";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/Textarea";

type TemplateMetaFormProps = {
  template: TemplateDetail;
  isDraft: boolean;
  onSaved: () => void;
};

export default function TemplateMetaForm({
  template,
  isDraft,
  onSaved,
}: TemplateMetaFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(template.name);
    setDescription(template.description ?? "");
  }, [template]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectTemplateApi.updateTemplate(template.id, {
        name,
        description: description || undefined,
      });
      toast.success(t("pages.admin.projectTemplateMetaSaved"));
      onSaved();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
      <h2 className="mb-3 text-lg font-semibold">
        {t("pages.admin.projectTemplateMetaTitle")}
      </h2>
      <form onSubmit={handleSave} className="space-y-4">
        <Field
          label={t("pages.admin.projectTemplateKey")}
          htmlFor="template-meta-key"
        >
          <Input id="template-meta-key" value={template.key} disabled />
        </Field>
        <Field
          label={t("pages.admin.projectTemplateName")}
          htmlFor="template-meta-name"
        >
          <Input
            id="template-meta-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isDraft}
          />
        </Field>
        <Field
          label={t("pages.admin.projectTemplateDescription")}
          htmlFor="template-meta-description"
        >
          <Textarea
            id="template-meta-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isDraft}
            className="min-h-20"
          />
        </Field>
        {isDraft && (
          <Button
            type="submit"
            disabled={saving}
            className="cursor-pointer text-white bg-primary hover:bg-primary/90"
          >
            {saving ? t("common.processing") : t("common.save")}
          </Button>
        )}
      </form>
    </div>
  );
}
