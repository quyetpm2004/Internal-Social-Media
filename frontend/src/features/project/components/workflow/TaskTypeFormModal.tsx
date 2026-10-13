import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "@/components/shared/Checkbox";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import Textarea from "@/components/shared/Textarea";
import { STATUS_KEY_REGEX } from "@/features/project/components/workflow/workflow-flow";
import type {
  CreateProjectTaskTypePayload,
  ProjectWorkflow,
  ProjectWorkflowTaskType,
  SaveProjectTaskTypePayload,
} from "@/features/project/types/project.type";

type TaskTypeFormModalProps = {
  open: boolean;
  taskType: ProjectWorkflowTaskType | null;
  workflows: ProjectWorkflow[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (
    value: CreateProjectTaskTypePayload | SaveProjectTaskTypePayload,
  ) => void;
};

export default function TaskTypeFormModal({
  open,
  taskType,
  workflows,
  submitting,
  onClose,
  onSubmit,
}: TaskTypeFormModalProps) {
  const { t } = useTranslation();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [workflowId, setWorkflowId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setKey(taskType?.key ?? "");
    setName(taskType?.name ?? "");
    setDescription(taskType?.description ?? "");
    setSortOrder(String(taskType?.sortOrder ?? 0));
    setIsActive(taskType ? taskType.isActive : true);
    setWorkflowId(taskType?.workflowId ? String(taskType.workflowId) : "");
    setError("");
  }, [open, taskType]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const order = Number(sortOrder);
    if (!trimmedName) {
      setError(t("pages.projects.workflowPanel.nameRequired"));
      return;
    }
    if (!Number.isInteger(order) || order < 0) {
      setError(t("pages.projects.workflowPanel.sortOrderInvalid"));
      return;
    }
    const payload: SaveProjectTaskTypePayload = {
      name: trimmedName,
      description: description.trim() || null,
      sortOrder: order,
      isActive,
      workflowId: workflowId ? Number(workflowId) : null,
    };
    if (taskType) {
      onSubmit(payload);
      return;
    }
    const taskKey = key.trim();
    if (!STATUS_KEY_REGEX.test(taskKey)) {
      setError(t("pages.projects.workflowPanel.keyInvalid"));
      return;
    }
    onSubmit({ ...payload, key: taskKey });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        taskType
          ? t("pages.projects.workflowPanel.editTaskType")
          : t("pages.projects.workflowPanel.addTaskType")
      }
      formId="project-task-type-form"
      confirmText={t("common.save")}
      loading={submitting}
      size="lg"
    >
      <form
        id="project-task-type-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <Field
          label={t("pages.projects.workflowPanel.key")}
          htmlFor="project-task-type-key"
          required
          error={error}
        >
          <Input
            id="project-task-type-key"
            value={key}
            maxLength={50}
            disabled={Boolean(taskType) || submitting}
            onChange={(event) => setKey(event.target.value.toUpperCase())}
            required
          />
        </Field>
        <Field
          label={t("pages.projects.workflowPanel.name")}
          htmlFor="project-task-type-name"
          required
        >
          <Input
            id="project-task-type-name"
            value={name}
            maxLength={150}
            disabled={submitting}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>
        <Field
          label={t("common.description")}
          htmlFor="project-task-type-description"
        >
          <Textarea
            id="project-task-type-description"
            value={description}
            maxLength={2000}
            disabled={submitting}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field
          label={t("pages.projects.workflowPanel.sortOrder")}
          htmlFor="project-task-type-sort"
        >
          <Input
            id="project-task-type-sort"
            type="number"
            min={0}
            value={sortOrder}
            disabled={submitting}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </Field>
        <Field
          label={t("pages.projects.workflowPanel.workflow")}
          htmlFor="project-task-type-workflow"
          hint={t("pages.projects.workflowPanel.taskTypeWorkflowHint")}
        >
          <Select
            id="project-task-type-workflow"
            value={workflowId}
            disabled={submitting}
            onChange={(event) => setWorkflowId(event.target.value)}
          >
            <option value="">
              {t("pages.projects.workflowPanel.defaultWorkflow")}
            </option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox
          id="project-task-type-active"
          label={t("pages.projects.workflowPanel.active")}
          checked={isActive}
          disabled={submitting}
          onChange={(event) => setIsActive(event.target.checked)}
        />
      </form>
    </Modal>
  );
}
