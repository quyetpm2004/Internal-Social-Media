import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Modal from "@/components/shared/Modal";
import { projectApi } from "@/features/project/api/project.api";
import TaskTypeFormModal from "@/features/project/components/workflow/TaskTypeFormModal";
import type {
  CreateProjectTaskTypePayload,
  ProjectWorkflow,
  ProjectWorkflowTaskType,
  SaveProjectTaskTypePayload,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type TaskTypeListProps = {
  projectId: number;
  taskTypes: ProjectWorkflowTaskType[];
  workflows: ProjectWorkflow[];
  canConfigure: boolean;
  onChanged: () => Promise<void>;
};

export default function TaskTypeList({
  projectId,
  taskTypes,
  workflows,
  canConfigure,
  onChanged,
}: TaskTypeListProps) {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectWorkflowTaskType | null>(null);
  const [removing, setRemoving] = useState<ProjectWorkflowTaskType | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const workflowName = (workflowId: number | null) => {
    if (workflowId == null) {
      return t("pages.projects.workflowPanel.defaultWorkflow");
    }
    return (
      workflows.find((workflow) => workflow.id === workflowId)?.name ??
      `#${workflowId}`
    );
  };

  const handleSave = async (
    value: CreateProjectTaskTypePayload | SaveProjectTaskTypePayload,
  ) => {
    setBusy(true);
    try {
      if (editing) {
        await projectApi.updateTaskType(projectId, editing.id, value);
        toast.success(t("pages.projects.workflowPanel.taskTypeUpdated"));
      } else {
        await projectApi.createTaskType(
          projectId,
          value as CreateProjectTaskTypePayload,
        );
        toast.success(t("pages.projects.workflowPanel.taskTypeCreated"));
      }
      setFormOpen(false);
      setEditing(null);
      await onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await projectApi.deleteTaskType(projectId, removing.id);
      toast.success(t("pages.projects.workflowPanel.taskTypeDeleted"));
      setRemoving(null);
      await onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t("pages.projects.workflowPanel.taskTypes")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("pages.projects.workflowPanel.taskTypeHint")}
          </p>
        </div>
        {canConfigure && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            {t("pages.projects.workflowPanel.addTaskType")}
          </button>
        )}
      </div>

      {taskTypes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {t("pages.projects.workflowPanel.noTaskTypes")}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs font-semibold text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.workflowPanel.key")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.workflowPanel.name")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.workflowPanel.workflow")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("common.status")}
                </th>
                {canConfigure && (
                  <th className="py-2 text-right font-semibold">
                    {t("common.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {taskTypes.map((taskType) => (
                <tr key={taskType.id} className="border-t border-slate-100">
                  <td className="py-3 pr-3 font-medium text-slate-700">
                    {taskType.key}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="font-semibold text-slate-800">
                      {taskType.name}
                    </div>
                    {taskType.description && (
                      <div className="max-w-xs truncate text-slate-500">
                        {taskType.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {workflowName(taskType.workflowId)}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={
                        taskType.isActive
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
                      }
                    >
                      {taskType.isActive
                        ? t("pages.projects.workflowPanel.active")
                        : t("pages.projects.workflowPanel.inactive")}
                    </span>
                  </td>
                  {canConfigure && (
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditing(taskType);
                          setFormOpen(true);
                        }}
                        className="cursor-pointer px-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {t("pages.projects.workflowPanel.edit")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRemoving(taskType)}
                        className="cursor-pointer px-2 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskTypeFormModal
        open={formOpen}
        taskType={editing}
        workflows={workflows}
        submitting={busy}
        onClose={() => {
          if (busy) return;
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
      />
      <Modal
        open={removing != null}
        onClose={() => {
          if (!busy) setRemoving(null);
        }}
        title={t("pages.projects.workflowPanel.deleteTaskType")}
        description={
          removing
            ? t("pages.projects.workflowPanel.deleteTaskTypePlain", {
                name: removing.name,
              })
            : undefined
        }
        variant="danger"
        confirmText={t("common.delete")}
        loading={busy}
        onConfirm={handleDelete}
      />
    </section>
  );
}
