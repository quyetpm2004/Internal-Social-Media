import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import type {
  ProjectWorkflowApprovalRule,
  ProjectWorkflowRole,
  ProjectWorkflowStatusDetail,
  SaveProjectApprovalRulePayload,
  WorkflowApproverType,
  WorkflowTaskRole,
} from "@/features/project/types/project.type";

const TASK_ROLES: WorkflowTaskRole[] = ["ASSIGNEE", "REVIEWER", "REPORTER"];

type ApprovalRuleFormModalProps = {
  open: boolean;
  rule: ProjectWorkflowApprovalRule | null;
  roles: ProjectWorkflowRole[];
  statuses: ProjectWorkflowStatusDetail[];
  toStatusId: number;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (value: SaveProjectApprovalRulePayload) => void;
};

export default function ApprovalRuleFormModal({
  open,
  rule,
  roles,
  statuses,
  toStatusId,
  submitting,
  onClose,
  onSubmit,
}: ApprovalRuleFormModalProps) {
  const { t } = useTranslation();
  const [approverType, setApproverType] =
    useState<WorkflowApproverType>("PROJECT_ROLE");
  const [projectRoleId, setProjectRoleId] = useState("");
  const [taskRole, setTaskRole] = useState<WorkflowTaskRole>("ASSIGNEE");
  const [minApprovals, setMinApprovals] = useState("1");
  const [rejectStatusId, setRejectStatusId] = useState("");
  const [error, setError] = useState("");

  const rejectOptions = statuses.filter((status) => status.id !== toStatusId);

  useEffect(() => {
    if (!open || !rule) return;
    setApproverType(rule.approverType);
    setProjectRoleId(rule.projectRoleId ? String(rule.projectRoleId) : "");
    setTaskRole(rule.taskRole ?? "ASSIGNEE");
    setMinApprovals(String(rule.minApprovals));
    setRejectStatusId(String(rule.onRejectStatusId));
    setError("");
  }, [open, rule]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const min = Number(minApprovals);
    if (!Number.isInteger(min) || min < 1) {
      setError(t("pages.projects.workflowPanel.minApprovalsInvalid"));
      return;
    }
    if (!rejectStatusId) {
      setError(t("pages.projects.workflowPanel.rejectRequired"));
      return;
    }
    if (approverType === "PROJECT_ROLE" && !projectRoleId) {
      setError(t("pages.projects.workflowPanel.roleRequired"));
      return;
    }
    onSubmit({
      approverType,
      projectRoleId:
        approverType === "PROJECT_ROLE" ? Number(projectRoleId) : null,
      taskRole: approverType === "TASK_ROLE" ? taskRole : null,
      minApprovals: min,
      onRejectStatusId: Number(rejectStatusId),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.projects.workflowPanel.editRule")}
      formId="project-approval-rule-form"
      confirmText={t("common.save")}
      loading={submitting}
      confirmDisabled={!rule}
      size="lg"
    >
      {rule && (
        <form
          id="project-approval-rule-form"
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          <Field label={t("pages.projects.workflowPanel.approverType")}>
            <Select
              value={approverType}
              onChange={(event) => {
                setApproverType(event.target.value as WorkflowApproverType);
                setProjectRoleId("");
              }}
            >
              <option value="PROJECT_ROLE" disabled={roles.length === 0}>
                {t("pages.projects.workflowPanel.projectRole")}
              </option>
              <option value="TASK_ROLE">
                {t("pages.projects.workflowPanel.taskRole")}
              </option>
            </Select>
          </Field>
          {approverType === "PROJECT_ROLE" ? (
            <Field label={t("pages.projects.workflowPanel.role")}>
              <Select
                value={projectRoleId}
                onChange={(event) => setProjectRoleId(event.target.value)}
                required
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
            </Field>
          ) : (
            <Field label={t("pages.projects.workflowPanel.role")}>
              <Select
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
            </Field>
          )}
          <Field
            label={t("pages.projects.workflowPanel.minApprovals")}
            htmlFor="rule-min"
          >
            <Input
              id="rule-min"
              type="number"
              min={1}
              value={minApprovals}
              onChange={(event) => setMinApprovals(event.target.value)}
              required
            />
          </Field>
          <Field label={t("pages.projects.workflowPanel.rejectStatus")}>
            <Select
              value={rejectStatusId}
              onChange={(event) => setRejectStatusId(event.target.value)}
              required
            >
              <option value="">
                {t("pages.projects.workflowPanel.chooseStatus")}
              </option>
              {rejectOptions.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </Modal>
  );
}
