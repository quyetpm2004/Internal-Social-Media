import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { projectApi } from "@/features/project/api/project.api";
import ApprovalRuleFormModal from "@/features/project/components/workflow/ApprovalRuleFormModal";
import { statusLabel } from "@/features/project/components/workflow/workflow-flow";
import type {
  ProjectWorkflow,
  ProjectWorkflowApprovalRule,
  ProjectWorkflowRole,
  ProjectWorkflowTransition,
  SaveProjectApprovalRulePayload,
  WorkflowApproverType,
  WorkflowTaskRole,
} from "@/features/project/types/project.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

const TASK_ROLES: WorkflowTaskRole[] = ["ASSIGNEE", "REVIEWER", "REPORTER"];

type ApprovalRuleListProps = {
  projectId: number;
  workflow: ProjectWorkflow;
  roles: ProjectWorkflowRole[];
  canConfigure: boolean;
  onChanged: () => Promise<void>;
};

export default function ApprovalRuleList({
  projectId,
  workflow,
  roles,
  canConfigure,
  onChanged,
}: ApprovalRuleListProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<{
    transition: ProjectWorkflowTransition;
    rule: ProjectWorkflowApprovalRule;
  } | null>(null);
  const [removing, setRemoving] = useState<{
    transition: ProjectWorkflowTransition;
    rule: ProjectWorkflowApprovalRule;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const approverLabel = (rule: ProjectWorkflowApprovalRule) => {
    if (rule.approverType === "PROJECT_ROLE") {
      return (
        roles.find((role) => role.id === rule.projectRoleId)?.name ??
        t("pages.projects.workflowPanel.roleFallback", {
          id: rule.projectRoleId ?? "",
        })
      );
    }
    return rule.taskRole
      ? t(`pages.projects.workflowPanel.taskRoles.${rule.taskRole}`)
      : "";
  };

  const handleSave = async (value: SaveProjectApprovalRulePayload) => {
    if (!editing) return;
    setBusy(true);
    try {
      await projectApi.updateApprovalRule(
        projectId,
        workflow.id,
        editing.transition.id,
        editing.rule.id,
        value,
      );
      toast.success(t("pages.projects.workflowPanel.ruleUpdated"));
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
      await projectApi.deleteApprovalRule(
        projectId,
        workflow.id,
        removing.transition.id,
        removing.rule.id,
      );
      toast.success(t("pages.projects.workflowPanel.ruleDeleted"));
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
        {t("pages.projects.workflowPanel.rules")}
      </h3>
      {workflow.transitions.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          {t("pages.projects.workflowPanel.noTransitions")}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {workflow.transitions.map((transition) => (
            <RuleGroup
              key={transition.id}
              projectId={projectId}
              workflow={workflow}
              transition={transition}
              roles={roles}
              canConfigure={canConfigure}
              busy={busy}
              setBusy={setBusy}
              approverLabel={approverLabel}
              onChanged={onChanged}
              onEdit={(rule) => setEditing({ transition, rule })}
              onDelete={(rule) => setRemoving({ transition, rule })}
            />
          ))}
        </div>
      )}

      <ApprovalRuleFormModal
        open={editing != null}
        rule={editing?.rule ?? null}
        roles={roles}
        statuses={workflow.statuses}
        toStatusId={editing?.transition.toStatusId ?? -1}
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
        title={t("pages.projects.workflowPanel.deleteRule")}
        description={t("pages.projects.workflowPanel.deleteRulePlain")}
        variant="danger"
        confirmText={t("common.delete")}
        loading={busy}
        onConfirm={handleDelete}
      />
    </section>
  );
}

function RuleGroup({
  projectId,
  workflow,
  transition,
  roles,
  canConfigure,
  busy,
  setBusy,
  approverLabel,
  onChanged,
  onEdit,
  onDelete,
}: {
  projectId: number;
  workflow: ProjectWorkflow;
  transition: ProjectWorkflowTransition;
  roles: ProjectWorkflowRole[];
  canConfigure: boolean;
  busy: boolean;
  setBusy: (value: boolean) => void;
  approverLabel: (rule: ProjectWorkflowApprovalRule) => string;
  onChanged: () => Promise<void>;
  onEdit: (rule: ProjectWorkflowApprovalRule) => void;
  onDelete: (rule: ProjectWorkflowApprovalRule) => void;
}) {
  const { t } = useTranslation();
  const [approverType, setApproverType] = useState<WorkflowApproverType>(
    roles.length > 0 ? "PROJECT_ROLE" : "TASK_ROLE",
  );
  const [projectRoleId, setProjectRoleId] = useState("");
  const [taskRole, setTaskRole] = useState<WorkflowTaskRole>("REVIEWER");
  const [minApprovals, setMinApprovals] = useState("1");
  const [rejectStatusId, setRejectStatusId] = useState("");

  const rejectOptions = workflow.statuses.filter(
    (status) => status.id !== transition.toStatusId,
  );
  const projectRoleLocked = roles.length === 0;

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (approverType === "PROJECT_ROLE" && projectRoleLocked) return;
    const min = Number(minApprovals);
    if (!Number.isInteger(min) || min < 1 || !rejectStatusId) return;
    if (approverType === "PROJECT_ROLE" && !projectRoleId) return;
    setBusy(true);
    try {
      await projectApi.createApprovalRule(
        projectId,
        workflow.id,
        transition.id,
        {
          approverType,
          projectRoleId:
            approverType === "PROJECT_ROLE" ? Number(projectRoleId) : null,
          taskRole: approverType === "TASK_ROLE" ? taskRole : null,
          minApprovals: min,
          onRejectStatusId: Number(rejectStatusId),
        },
      );
      toast.success(t("pages.projects.workflowPanel.ruleCreated"));
      setProjectRoleId("");
      setMinApprovals("1");
      setRejectStatusId("");
      await onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">{transition.name}</p>
      <p className="text-xs text-slate-500">
        {statusLabel(workflow.statuses, transition.fromStatusId)} →{" "}
        {statusLabel(workflow.statuses, transition.toStatusId)}
      </p>
      {transition.approvalRules.length >= 2 && (
        <p className="mt-2 text-xs text-slate-500">
          {t("pages.projects.workflowPanel.rulesAnd")}
        </p>
      )}
      {transition.approvalRules.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          {t("pages.projects.workflowPanel.noRules")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {transition.approvalRules.map((rule) => (
            <li
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700"
            >
              <span>
                {approverLabel(rule)} ·{" "}
                {t("pages.projects.workflowPanel.minShort", {
                  count: rule.minApprovals,
                })}{" "}
                ·{" "}
                {t("pages.projects.workflowPanel.rejectShort", {
                  status: statusLabel(
                    workflow.statuses,
                    rule.onRejectStatusId,
                  ),
                })}
              </span>
              {canConfigure && (
                <span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onEdit(rule)}
                    className="cursor-pointer px-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {t("pages.projects.workflowPanel.edit")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(rule)}
                    className="cursor-pointer px-2 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                  >
                    {t("common.delete")}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canConfigure && (
        <form
          onSubmit={handleAdd}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <div className="w-40">
            <Select
              aria-label={t("pages.projects.workflowPanel.approverType")}
              value={approverType}
              onChange={(event) => {
                setApproverType(event.target.value as WorkflowApproverType);
                setProjectRoleId("");
              }}
            >
              <option value="PROJECT_ROLE" disabled={projectRoleLocked}>
                {t("pages.projects.workflowPanel.projectRole")}
              </option>
              <option value="TASK_ROLE">
                {t("pages.projects.workflowPanel.taskRole")}
              </option>
            </Select>
          </div>
          {approverType === "PROJECT_ROLE" ? (
            <div className="w-44">
              <Select
                aria-label={t("pages.projects.workflowPanel.role")}
                value={projectRoleId}
                onChange={(event) => setProjectRoleId(event.target.value)}
                required
                disabled={projectRoleLocked}
              >
                <option value="">
                  {t("pages.projects.workflowPanel.chooseRole")}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="w-44">
              <Select
                aria-label={t("pages.projects.workflowPanel.role")}
                value={taskRole}
                onChange={(event) =>
                  setTaskRole(event.target.value as WorkflowTaskRole)
                }
              >
                {TASK_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`pages.projects.workflowPanel.taskRoles.${role}`)}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <Input
            type="number"
            min={1}
            value={minApprovals}
            aria-label={t("pages.projects.workflowPanel.minApprovals")}
            onChange={(event) => setMinApprovals(event.target.value)}
            className="w-24"
            required
          />
          <div className="w-44">
            <Select
              aria-label={t("pages.projects.workflowPanel.rejectStatus")}
              value={rejectStatusId}
              onChange={(event) => setRejectStatusId(event.target.value)}
              required
            >
              <option value="">
                {t("pages.projects.workflowPanel.rejectStatus")}
              </option>
              {rejectOptions.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            disabled={
              busy ||
              (approverType === "PROJECT_ROLE" && projectRoleLocked) ||
              rejectOptions.length === 0
            }
            className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {t("pages.projects.workflowPanel.add")}
          </button>
          {approverType === "PROJECT_ROLE" && projectRoleLocked && (
            <p className="text-sm text-slate-500">
              {t("pages.projects.workflowPanel.noProjectRoles")}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
