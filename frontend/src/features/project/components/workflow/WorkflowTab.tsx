import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Modal from "@/components/shared/Modal";
import { projectApi } from "@/features/project/api/project.api";
import ApprovalRuleList from "@/features/project/components/workflow/ApprovalRuleList";
import StatusList from "@/features/project/components/workflow/StatusList";
import TaskTypeList from "@/features/project/components/workflow/TaskTypeList";
import TransitionList from "@/features/project/components/workflow/TransitionList";
import TransitionPreview from "@/features/project/components/workflow/TransitionPreview";
import WorkflowFormModal from "@/features/project/components/workflow/WorkflowFormModal";
import { pickWorkflowId } from "@/features/project/components/workflow/workflow-flow";
import type {
  ProjectWorkflow,
  ProjectWorkflowConfig,
  SaveProjectWorkflowPayload,
} from "@/features/project/types/project.type";
import {
  getApiErrorMessages,
  toastApiError,
} from "@/features/project-template/utils/api-error";
import { cn } from "@/lib/utils";

type WorkflowTabProps = {
  projectId: number;
  onProjectUpdated: () => Promise<void>;
};

export default function WorkflowTab({
  projectId,
  onProjectUpdated,
}: WorkflowTabProps) {
  const { t } = useTranslation();
  const preferId = useRef<number | null>(null);
  const [config, setConfig] = useState<ProjectWorkflowConfig | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectWorkflow | null>(null);
  const [removing, setRemoving] = useState<ProjectWorkflow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await projectApi.getWorkflows(projectId);
        const next: ProjectWorkflowConfig = {
          ...response.data,
          taskTypes: response.data.taskTypes ?? [],
        };
        setConfig(next);
        setSelectedId((current) =>
          pickWorkflowId(next.workflows, preferId.current ?? current),
        );
        preferId.current = null;
        setError("");
      } catch (loadError) {
        if (silent) {
          toastApiError(loadError);
          return;
        }
        const message = getApiErrorMessages(loadError)[0];
        setError(
          message && message !== "Unexpected error"
            ? message
            : t("pages.projects.workflowPanel.loadFailed"),
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId, t],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const afterWrite = async (nextId?: number) => {
    if (nextId != null) preferId.current = nextId;
    await load(true);
    try {
      await onProjectUpdated();
    } catch (updateError) {
      toastApiError(updateError);
    }
  };

  const selected =
    config?.workflows.find((workflow) => workflow.id === selectedId) ?? null;

  const handleSave = async (value: SaveProjectWorkflowPayload) => {
    setBusy(true);
    try {
      if (editing) {
        await projectApi.updateWorkflow(projectId, editing.id, value);
        toast.success(t("pages.projects.workflowPanel.workflowUpdated"));
        setFormOpen(false);
        setEditing(null);
        await afterWrite(editing.id);
      } else {
        const response = await projectApi.createWorkflow(projectId, value);
        toast.success(t("pages.projects.workflowPanel.workflowCreated"));
        setFormOpen(false);
        await afterWrite(response.data.id);
      }
    } catch (saveError) {
      toastApiError(saveError);
    } finally {
      setBusy(false);
    }
  };

  const handleSetDefault = async (workflowId: number) => {
    setBusy(true);
    try {
      await projectApi.updateWorkflow(projectId, workflowId, {
        isDefault: true,
      });
      toast.success(t("pages.projects.workflowPanel.defaultSet"));
      await afterWrite(workflowId);
    } catch (saveError) {
      toastApiError(saveError);
    } finally {
      setBusy(false);
    }
  };

  const linkedTaskTypes =
    removing == null
      ? []
      : (config?.taskTypes ?? []).filter(
          (taskType) => taskType.workflowId === removing.id,
        );
  const lastWorkflow = (config?.workflows.length ?? 0) <= 1;
  const defaultWorkflow = removing?.isDefault === true;
  const deleteBlocked =
    defaultWorkflow || linkedTaskTypes.length > 0 || lastWorkflow;

  const handleDelete = async () => {
    if (!removing || deleteBlocked) {
      setRemoving(null);
      return;
    }
    setBusy(true);
    try {
      await projectApi.deleteWorkflow(projectId, removing.id);
      toast.success(t("pages.projects.workflowPanel.workflowDeleted"));
      setRemoving(null);
      await afterWrite();
    } catch (deleteError) {
      toastApiError(deleteError);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !config) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  }

  if (!config) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-sm text-slate-600">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 cursor-pointer text-sm font-semibold text-primary"
        >
          {t("pages.projects.workflowPanel.retry")}
        </button>
      </div>
    );
  }

  const ruleCount = (workflow: ProjectWorkflow) =>
    workflow.transitions.reduce(
      (count, transition) => count + transition.approvalRules.length,
      0,
    );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {t("pages.projects.workflowPanel.title")}
          </h2>
          {config.canConfigure && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
            >
              {t("pages.projects.workflowPanel.addWorkflow")}
            </button>
          )}
        </div>

        {config.workflows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            {t("pages.projects.workflowPanel.empty")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs font-semibold text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-semibold">
                    {t("pages.projects.workflowPanel.name")}
                  </th>
                  <th className="py-2 pr-3 font-semibold">
                    {t("common.description")}
                  </th>
                  <th className="py-2 pr-3 font-semibold">
                    {t("common.status")}
                  </th>
                  {config.canConfigure && (
                    <th className="py-2 text-right font-semibold">
                      {t("common.actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {config.workflows.map((workflow) => (
                  <tr
                    key={workflow.id}
                    className={cn(
                      "border-t border-slate-100",
                      selectedId === workflow.id && "bg-primary/5",
                    )}
                  >
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(workflow.id)}
                        className="cursor-pointer text-left font-semibold text-slate-800 hover:underline"
                      >
                        {workflow.name}
                      </button>
                      {workflow.isDefault && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {t("pages.projects.workflowPanel.default")}
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate py-3 pr-3 text-slate-500">
                      {workflow.description || "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={
                          workflow.isActive
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
                        }
                      >
                        {workflow.isActive
                          ? t("pages.projects.workflowPanel.active")
                          : t("pages.projects.workflowPanel.inactive")}
                      </span>
                    </td>
                    {config.canConfigure && (
                      <td className="py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setEditing(workflow);
                            setFormOpen(true);
                          }}
                          className="cursor-pointer px-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                        >
                          {t("pages.projects.workflowPanel.edit")}
                        </button>
                        {!workflow.isDefault && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleSetDefault(workflow.id)}
                            className="cursor-pointer px-2 text-xs font-semibold text-slate-700 hover:underline disabled:opacity-50"
                          >
                            {t("pages.projects.workflowPanel.setDefault")}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setRemoving(workflow)}
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
      </section>

      <TaskTypeList
        projectId={projectId}
        taskTypes={config.taskTypes ?? []}
        workflows={config.workflows}
        canConfigure={config.canConfigure}
        onChanged={() => afterWrite(selected?.id)}
      />

      {selected && (
        <>
          <StatusList
            projectId={projectId}
            workflow={selected}
            canConfigure={config.canConfigure}
            onChanged={() => afterWrite(selected.id)}
          />
          <TransitionList
            projectId={projectId}
            workflow={selected}
            canConfigure={config.canConfigure}
            onChanged={() => afterWrite(selected.id)}
          />
          <TransitionPreview workflow={selected} />
          <ApprovalRuleList
            projectId={projectId}
            workflow={selected}
            roles={config.projectRoles}
            canConfigure={config.canConfigure}
            onChanged={() => afterWrite(selected.id)}
          />
        </>
      )}

      <WorkflowFormModal
        open={formOpen}
        workflow={editing}
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
        title={t("pages.projects.workflowPanel.deleteWorkflow")}
        description={
          defaultWorkflow
            ? t("pages.projects.workflowPanel.deleteDefault")
            : linkedTaskTypes.length > 0
              ? t("pages.projects.workflowPanel.deleteBlocked")
              : lastWorkflow
                ? t("pages.projects.workflowPanel.deleteLast")
                : t("pages.projects.workflowPanel.deleteCascade", {
                    statuses: removing?.statuses.length ?? 0,
                    transitions: removing?.transitions.length ?? 0,
                    rules: removing ? ruleCount(removing) : 0,
                  })
        }
        variant={deleteBlocked ? "primary" : "danger"}
        confirmText={
          deleteBlocked ? t("common.close") : t("common.delete")
        }
        hideCancel={deleteBlocked}
        loading={busy}
        onConfirm={handleDelete}
      >
        {!defaultWorkflow && linkedTaskTypes.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {linkedTaskTypes.map((taskType) => (
              <li key={taskType.id}>{taskType.name}</li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
