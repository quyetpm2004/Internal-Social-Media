import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Textarea from "@/components/shared/Textarea";
import { projectApi } from "@/features/project/api/project.api";
import TaskPicker from "@/features/project/components/planning/TaskPicker";
import type {
  PhaseItem,
  PlanningTask,
  SavePhasePayload,
} from "@/features/project/types/planning.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type PhaseFormModalProps = {
  open: boolean;
  projectId: number;
  phase: PhaseItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: SavePhasePayload) => void;
};

export default function PhaseFormModal({
  open,
  projectId,
  phase,
  saving,
  onClose,
  onSubmit,
}: PhaseFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goal, setGoal] = useState("");
  const [taskIds, setTaskIds] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<PlanningTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(phase?.name ?? "");
    setStartDate(phase?.startDate ?? "");
    setEndDate(phase?.endDate ?? "");
    setGoal(phase?.goal ?? "");
    setTaskIds(phase?.tasks.map((task) => task.id) ?? []);
    setError("");
  }, [open, phase]);

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

  const choices = useMemo(
    () =>
      catalog.filter(
        (task) => task.phaseId == null || task.phaseId === phase?.id,
      ),
    [catalog, phase?.id],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("pages.projects.phases.nameRequired"));
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError(t("pages.projects.phases.dateOrder"));
      return;
    }
    onSubmit({
      name: name.trim(),
      goal: goal.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      taskIds,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        phase
          ? t("pages.projects.phases.editTitle")
          : t("pages.projects.phases.createTitle")
      }
      description={t("pages.projects.phases.subtitle")}
      formId="phase-form"
      confirmText={
        phase ? t("common.save") : t("pages.projects.phases.create")
      }
      loading={saving}
      size="xl"
      className="max-h-[min(92vh,52rem)] max-w-3xl"
    >
      <form id="phase-form" className="space-y-4" onSubmit={handleSubmit}>
        <Field label={t("pages.projects.phases.name")} htmlFor="phase-name" required>
          <Input
            id="phase-name"
            value={name}
            maxLength={150}
            placeholder={t("pages.projects.phases.namePlaceholder")}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("pages.projects.phases.startDate")} htmlFor="phase-start">
            <Input
              id="phase-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label={t("pages.projects.phases.endDate")} htmlFor="phase-end">
            <Input
              id="phase-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
        </div>
        <Field label={t("pages.projects.phases.goal")} htmlFor="phase-goal">
          <Textarea
            id="phase-goal"
            value={goal}
            maxLength={2000}
            placeholder={t("pages.projects.phases.goalPlaceholder")}
            onChange={(event) => setGoal(event.target.value)}
          />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">
            {t("pages.projects.phases.tasks")}
          </p>
          <p className="mb-2 text-xs text-slate-500">
            {t("pages.projects.phases.pickerHint")}
          </p>
          <TaskPicker
            tasks={choices}
            selectedIds={taskIds}
            onChange={setTaskIds}
            loading={loadingTasks}
            emptyLabel={
              catalog.length === 0
                ? t("pages.projects.phases.noCatalog")
                : t("pages.projects.phases.pickerEmpty")
            }
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
