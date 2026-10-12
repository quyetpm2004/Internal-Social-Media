import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { projectApi } from "@/features/project/api/project.api";
import TransitionFormModal from "@/features/project/components/workflow/TransitionFormModal";
import { statusLabel } from "@/features/project/components/workflow/workflow-flow";
import type {
  ProjectWorkflow,
  ProjectWorkflowTransition,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type TransitionListProps = {
  projectId: number;
  workflow: ProjectWorkflow;
  canConfigure: boolean;
  onChanged: () => Promise<void>;
};

export default function TransitionList({
  projectId,
  workflow,
  canConfigure,
  onChanged,
}: TransitionListProps) {
  const { t } = useTranslation();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ProjectWorkflowTransition | null>(
    null,
  );
  const [removing, setRemoving] = useState<ProjectWorkflowTransition | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const duplicate =
    fromId !== "" &&
    toId !== "" &&
    workflow.transitions.some(
      (transition) =>
        transition.fromStatusId === Number(fromId) &&
        transition.toStatusId === Number(toId),
    );

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!fromId || !toId || duplicate) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await projectApi.createWorkflowTransition(projectId, workflow.id, {
        fromStatusId: Number(fromId),
        toStatusId: Number(toId),
        name: trimmed,
      });
      toast.success(t("pages.projects.workflowPanel.transitionCreated"));
      setFromId("");
      setToId("");
      setName("");
      await onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (value: { name: string; isActive: boolean }) => {
    if (!editing) return;
    setBusy(true);
    try {
      await projectApi.updateWorkflowTransition(
        projectId,
        workflow.id,
        editing.id,
        value,
      );
      toast.success(t("pages.projects.workflowPanel.transitionUpdated"));
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
      await projectApi.deleteWorkflowTransition(
        projectId,
        workflow.id,
        removing.id,
      );
      toast.success(t("pages.projects.workflowPanel.transitionDeleted"));
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
      <h3 className="text-base font-semibold text-slate-900">
        {t("pages.projects.workflowPanel.transitions")}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {t("pages.projects.workflowPanel.transitionHint")}
      </p>

      {canConfigure && workflow.statuses.length < 2 && (
        <p className="mt-3 text-sm text-slate-500">
          {t("pages.projects.workflowPanel.needTwoStatuses")}
        </p>
      )}

      {canConfigure && workflow.statuses.length >= 2 && (
        <form
          onSubmit={handleAdd}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <div className="w-44">
            <Select
              aria-label={t("pages.projects.workflowPanel.from")}
              value={fromId}
              onChange={(event) => {
                const value = event.target.value;
                setFromId(value);
                if (value === toId) setToId("");
              }}
              required
            >
              <option value="">{t("pages.projects.workflowPanel.from")}</option>
              {workflow.statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select
              aria-label={t("pages.projects.workflowPanel.to")}
              value={toId}
              onChange={(event) => setToId(event.target.value)}
              required
            >
              <option value="">{t("pages.projects.workflowPanel.to")}</option>
              {workflow.statuses
                .filter((status) => String(status.id) !== fromId)
                .map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
            </Select>
          </div>
          <Input
            value={name}
            maxLength={150}
            placeholder={t("pages.projects.workflowPanel.name")}
            onChange={(event) => setName(event.target.value)}
            className="max-w-52"
            required
          />
          <button
            type="submit"
            disabled={busy || duplicate}
            className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {t("pages.projects.workflowPanel.add")}
          </button>
          {duplicate && (
            <p className="text-sm text-amber-700">
              {t("pages.projects.workflowPanel.duplicateTransition")}
            </p>
          )}
        </form>
      )}

      {workflow.transitions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {t("pages.projects.workflowPanel.noTransitions")}
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
                  {t("pages.projects.workflowPanel.from")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.workflowPanel.to")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("common.status")}
                </th>
                <th className="py-2 pr-3 font-semibold">
                  {t("pages.projects.workflowPanel.rules")}
                </th>
                {canConfigure && (
                  <th className="py-2 text-right font-semibold">
                    {t("common.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {workflow.transitions.map((transition) => (
                <tr key={transition.id} className="border-t border-slate-100">
                  <td className="py-3 pr-3 font-medium text-slate-800">
                    {transition.name}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {statusLabel(workflow.statuses, transition.fromStatusId)}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {statusLabel(workflow.statuses, transition.toStatusId)}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={
                        transition.isActive
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
                      }
                    >
                      {transition.isActive
                        ? t("pages.projects.workflowPanel.active")
                        : t("pages.projects.workflowPanel.inactive")}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {transition.approvalRules.length}
                  </td>
                  {canConfigure && (
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEditing(transition)}
                        className="cursor-pointer px-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {t("pages.projects.workflowPanel.edit")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRemoving(transition)}
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

      <TransitionFormModal
        open={editing != null}
        transition={editing}
        statuses={workflow.statuses}
        submitting={busy}
        onClose={() => {
          if (!busy) setEditing(null);
        }}
        onSubmit={handleSave}
      />

      <Modal
        open={removing != null}
        onClose={() => {
          if (!busy) setRemoving(null);
        }}
        title={t("pages.projects.workflowPanel.deleteTransition")}
        description={
          removing && removing.approvalRules.length > 0
            ? t("pages.projects.workflowPanel.deleteTransitionCascade", {
                count: removing.approvalRules.length,
              })
            : t("pages.projects.workflowPanel.deleteTransitionPlain", {
                name: removing?.name ?? "",
              })
        }
        variant="danger"
        confirmText={t("common.delete")}
        loading={busy}
        onConfirm={handleDelete}
      />
    </section>
  );
}
