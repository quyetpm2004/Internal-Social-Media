import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import Textarea from "@/components/shared/Textarea";
import { projectApi } from "@/features/project/api/project.api";
import TaskPicker from "@/features/project/components/planning/TaskPicker";
import type {
  MilestoneItem,
  PlanningTask,
  SaveMilestonePayload,
} from "@/features/project/types/planning.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type PhaseOption = { id: number; name: string };

type MilestoneFormModalProps = {
  open: boolean;
  projectId: number;
  milestone: MilestoneItem | null;
  phases: PhaseOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: SaveMilestonePayload) => void;
};

export default function MilestoneFormModal({
  open,
  projectId,
  milestone,
  phases,
  saving,
  onClose,
  onSubmit,
}: MilestoneFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [taskIds, setTaskIds] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<PlanningTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(milestone?.name ?? "");
    setDueDate(milestone?.dueDate ?? "");
    setDescription(milestone?.description ?? "");
    setPhaseId(milestone?.phase ? String(milestone.phase.id) : "");
    setTaskIds(milestone?.tasks.map((task) => task.id) ?? []);
    setError("");
  }, [open, milestone]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoadingTasks(true);
      try {
        const response = await projectApi.getPlanningTasks(projectId);
        if (!cancelled) setCatalog(response.data.tasks);
      } catch (loadError) {
        if (!cancelled) toastApiError(loadError);
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const addPhaseTasks = () => {
    const id = Number(phaseId);
    if (!id) return;
    const extra = catalog
      .filter((task) => task.phaseId === id)
      .map((task) => task.id);
    setTaskIds((current) => [...new Set([...current, ...extra])]);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("pages.projects.milestones.nameRequired"));
      return;
    }
    if (!dueDate) {
      setError(t("pages.projects.milestones.dateRequired"));
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      dueDate,
      phaseId: phaseId ? Number(phaseId) : null,
      taskIds,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        milestone
          ? t("pages.projects.milestones.editTitle")
          : t("pages.projects.milestones.createTitle")
      }
      description={t("pages.projects.milestones.subtitle")}
      formId="milestone-form"
      confirmText={
        milestone ? t("common.save") : t("pages.projects.milestones.create")
      }
      loading={saving}
      size="xl"
      className="max-h-[min(92vh,52rem)] max-w-3xl"
    >
      <form id="milestone-form" className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label={t("pages.projects.milestones.name")}
          htmlFor="milestone-name"
          required
        >
          <Input
            id="milestone-name"
            value={name}
            maxLength={150}
            placeholder={t("pages.projects.milestones.namePlaceholder")}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={t("pages.projects.milestones.dueDate")}
            htmlFor="milestone-due"
            required
          >
            <Input
              id="milestone-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
          <Field
            label={t("pages.projects.milestones.phase")}
            htmlFor="milestone-phase"
          >
            <Select
              id="milestone-phase"
              value={phaseId}
              onChange={(event) => setPhaseId(event.target.value)}
            >
              <option value="">{t("pages.projects.milestones.noPhase")}</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label={t("pages.projects.milestones.description")}
          htmlFor="milestone-description"
        >
          <Textarea
            id="milestone-description"
            value={description}
            maxLength={2000}
            placeholder={t("pages.projects.milestones.descriptionPlaceholder")}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">
              {t("pages.projects.milestones.tasks")}
            </p>
            <button
              type="button"
              disabled={!phaseId}
              onClick={addPhaseTasks}
              className="cursor-pointer text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {t("pages.projects.milestones.usePhaseTasks")}
            </button>
          </div>
          <TaskPicker
            tasks={catalog}
            selectedIds={taskIds}
            onChange={setTaskIds}
            loading={loadingTasks}
            emptyLabel={t("pages.projects.phases.noCatalog")}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
