import { useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { projectApi } from "@/features/project/api/project.api";
import StatusFormModal from "@/features/project/components/workflow/StatusFormModal";
import {
  STATUS_CATEGORIES,
  STATUS_KEY_REGEX,
  moveStatusIds,
} from "@/features/project/components/workflow/workflow-flow";
import type {
  ProjectWorkflow,
  ProjectWorkflowStatusDetail,
  SaveProjectWorkflowStatusPayload,
  WorkflowStatusCategory,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type StatusListProps = {
  projectId: number;
  workflow: ProjectWorkflow;
  canConfigure: boolean;
  onChanged: () => Promise<void>;
};

export default function StatusList({
  projectId,
  workflow,
  canConfigure,
  onChanged,
}: StatusListProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [category, setCategory] = useState<WorkflowStatusCategory>("TODO");
  const [color, setColor] = useState("#3B82F6");
  const [editing, setEditing] = useState<ProjectWorkflowStatusDetail | null>(
    null,
  );
  const [removing, setRemoving] = useState<ProjectWorkflowStatusDetail | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const resetAdd = () => {
    setName("");
    setKey("");
    setCategory("TODO");
    setColor("#3B82F6");
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    const statusKey = key.trim();
    if (!trimmed) return;
    if (!STATUS_KEY_REGEX.test(statusKey)) {
      toast.error(t("pages.projects.workflowPanel.keyInvalid"));
      return;
    }
    setBusy(true);
    try {
      await projectApi.createWorkflowStatus(projectId, workflow.id, {
        name: trimmed,
        key: statusKey,
        description: null,
        sortOrder: workflow.statuses.length,
        category,
        color,
        isInitial: false,
        isFinal: false,
      });
      toast.success(t("pages.projects.workflowPanel.statusCreated"));
      resetAdd();
      await onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (value: SaveProjectWorkflowStatusPayload) => {
    if (!editing) return;
    setBusy(true);
    try {
      await projectApi.updateWorkflowStatus(
        projectId,
        workflow.id,
        editing.id,
        value,
      );
      toast.success(t("pages.projects.workflowPanel.statusUpdated"));
      setEditing(null);
      await onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const statusIds = moveStatusIds(workflow.statuses, index, direction);
    if (!statusIds) return;
    setBusy(true);
    try {
      await projectApi.reorderWorkflowStatuses(
        projectId,
        workflow.id,
        statusIds,
      );
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
      await projectApi.deleteWorkflowStatus(
        projectId,
        workflow.id,
        removing.id,
      );
      toast.success(t("pages.projects.workflowPanel.statusDeleted"));
      setRemoving(null);
      await onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const removeTransitions = removing
    ? workflow.transitions.filter(
        (transition) =>
          transition.fromStatusId === removing.id ||
          transition.toStatusId === removing.id,
      ).length
    : 0;
  const removeRules = removing
    ? workflow.transitions.reduce(
        (count, transition) =>
          count +
          transition.approvalRules.filter(
            (rule) => rule.onRejectStatusId === removing.id,
          ).length,
        0,
      )
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        {t("pages.projects.workflowPanel.statuses")}
      </h3>

      {canConfigure && (
        <form
          onSubmit={handleAdd}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <input
            type="color"
            aria-label={t("pages.projects.workflowPanel.color")}
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
          />
          <Input
            value={name}
            maxLength={150}
            placeholder={t("pages.projects.workflowPanel.name")}
            onChange={(event) => setName(event.target.value)}
            className="max-w-48"
            required
          />
          <Input
            value={key}
            maxLength={50}
            placeholder={t("pages.projects.workflowPanel.key")}
            onChange={(event) => setKey(event.target.value.toUpperCase())}
            className="max-w-40"
            required
          />
          <div className="w-40">
            <Select
              aria-label={t("pages.projects.workflowPanel.categoryLabel")}
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as WorkflowStatusCategory)
              }
            >
              {STATUS_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {t(`pages.projects.workflowPanel.category.${item}`)}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {t("pages.projects.workflowPanel.add")}
          </button>
        </form>
      )}

      {workflow.statuses.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {t("pages.projects.workflowPanel.noStatuses")}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {workflow.statuses.map((status, index) => (
            <li
              key={status.id}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: status.color ?? "#94A3B8" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {status.name}
                </p>
                <p className="text-xs text-slate-500">{status.key}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {t(`pages.projects.workflowPanel.category.${status.category}`)}
              </span>
              {status.isInitial && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {t("pages.projects.workflowPanel.initial")}
                </span>
              )}
              {status.isFinal && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {t("pages.projects.workflowPanel.final")}
                </span>
              )}
              {canConfigure && (
                <div className="flex items-center gap-1">
                  {index > 0 && (
                    <IconButton
                      label={t("pages.projects.workflowPanel.moveUp")}
                      disabled={busy}
                      onClick={() => handleMove(index, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </IconButton>
                  )}
                  {index < workflow.statuses.length - 1 && (
                    <IconButton
                      label={t("pages.projects.workflowPanel.moveDown")}
                      disabled={busy}
                      onClick={() => handleMove(index, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </IconButton>
                  )}
                  <TextButton disabled={busy} onClick={() => setEditing(status)}>
                    {t("pages.projects.workflowPanel.edit")}
                  </TextButton>
                  <TextButton
                    danger
                    disabled={busy}
                    onClick={() => setRemoving(status)}
                  >
                    {t("common.delete")}
                  </TextButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <StatusFormModal
        open={editing != null}
        status={editing}
        otherInitial={workflow.statuses.some(
          (status) => status.isInitial && status.id !== editing?.id,
        )}
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
        title={t("pages.projects.workflowPanel.deleteStatus")}
        description={
          removing && (removeTransitions > 0 || removeRules > 0)
            ? t("pages.projects.workflowPanel.deleteStatusCascade", {
                transitions: removeTransitions,
                rules: removeRules,
              })
            : t("pages.projects.workflowPanel.deleteStatusPlain", {
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

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function TextButton({
  children,
  disabled,
  danger,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        danger
          ? "cursor-pointer px-2 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
          : "cursor-pointer px-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}
