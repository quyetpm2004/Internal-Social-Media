import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Field from "@/components/shared/Field";
import Modal from "@/components/shared/Modal";
import { projectApi } from "@/features/project/api/project.api";
import ProjectManagerPicker, {
  type PickedManager,
} from "@/features/project/components/ProjectManagerPicker";
import { toastApiError } from "@/features/project-template/utils/api-error";

type ReassignManagerModalProps = {
  open: boolean;
  projectId: number;
  onClose: () => void;
  onDone: () => void;
};

export default function ReassignManagerModal({
  open,
  projectId,
  onClose,
  onDone,
}: ReassignManagerModalProps) {
  const { t } = useTranslation();
  const [manager, setManager] = useState<PickedManager | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setManager(null);
  }, [open]);

  const submit = async () => {
    if (!manager) return;
    setSaving(true);
    try {
      await projectApi.reassignManager(projectId, manager.id);
      toast.success(
        t("pages.projects.reassignDone", { name: manager.fullName }),
      );
      onDone();
      onClose();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.projects.reassignTitle")}
      description={t("pages.projects.reassignDescription")}
      confirmText={t("common.save")}
      confirmDisabled={!manager}
      loading={saving}
      onConfirm={() => void submit()}
      variant="primary"
    >
      <Field label={t("pages.projects.manager")}>
        <ProjectManagerPicker value={manager} onChange={setManager} />
      </Field>
    </Modal>
  );
}
