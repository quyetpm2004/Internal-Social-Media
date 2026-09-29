import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { projectTemplateApi } from "@/features/project-template/api/project-template.api";
import type {
  ApproverType,
  ProjectRole,
  StatusCategory,
  TaskRole,
  Workflow,
} from "@/features/project-template/types/project-template.type";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type WorkflowPanelProps = {
  templateId: number;
  workflows: Workflow[];
  projectRoles: ProjectRole[];
  isDraft: boolean;
  onChanged: () => void;
};

const selectClass =
  "h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none";

export default function WorkflowPanel({
  templateId,
  workflows,
  projectRoles,
  isDraft,
  onChanged,
}: WorkflowPanelProps) {
  const { t } = useTranslation();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(
    workflows[0]?.id ?? null,
  );
  const [submitting, setSubmitting] = useState(false);

  const [wfName, setWfName] = useState("");
  const [wfDescription, setWfDescription] = useState("");
  const [wfIsDefault, setWfIsDefault] = useState(false);
  const [wfIsActive, setWfIsActive] = useState(true);

  const [stName, setStName] = useState("");
  const [stKey, setStKey] = useState("");
  const [stCategory, setStCategory] = useState<StatusCategory>("TODO");
  const [stSortOrder, setStSortOrder] = useState("");
  const [stColor, setStColor] = useState("");
  const [stIsInitial, setStIsInitial] = useState(false);
  const [stIsFinal, setStIsFinal] = useState(false);

  const [trFromStatusId, setTrFromStatusId] = useState("");
  const [trToStatusId, setTrToStatusId] = useState("");
  const [trName, setTrName] = useState("");

  const [ruleTransitionId, setRuleTransitionId] = useState("");
  const [ruleApproverType, setRuleApproverType] =
    useState<ApproverType>("PROJECT_ROLE");
  const [ruleProjectRoleId, setRuleProjectRoleId] = useState("");
  const [ruleTaskRole, setRuleTaskRole] = useState<TaskRole>("ASSIGNEE");
  const [ruleMinApprovals, setRuleMinApprovals] = useState("1");
  const [ruleRejectStatusId, setRuleRejectStatusId] = useState("");

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);

  const getStatusName = (statusId: number) => {
    const status = selectedWorkflow?.statuses.find((s) => s.id === statusId);
    return status?.name ?? `#${statusId}`;
  };

  const getApproverLabel = (
    approverType: ApproverType,
    projectRoleId: number | null,
    taskRole: TaskRole | null,
  ) => {
    if (approverType === "PROJECT_ROLE") {
      const role = projectRoles.find((r) => r.id === projectRoleId);
      return role?.name ?? t("pages.admin.projectTemplateProjectRole");
    }
    return taskRole ?? "";
  };

  const handleAddWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await projectTemplateApi.createWorkflow(templateId, {
        name: wfName,
        description: wfDescription || undefined,
        isDefault: wfIsDefault,
        isActive: wfIsActive,
      });
      toast.success(t("pages.admin.projectTemplateWorkflowCreated"));
      setWfName("");
      setWfDescription("");
      setWfIsDefault(false);
      setWfIsActive(true);
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (workflowId: number) => {
    setSubmitting(true);
    try {
      await projectTemplateApi.updateWorkflow(templateId, workflowId, {
        isDefault: true,
      });
      toast.success(t("pages.admin.projectTemplateWorkflowDefaultSet"));
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    setSubmitting(true);
    try {
      await projectTemplateApi.deleteWorkflow(templateId, workflowId);
      toast.success(t("pages.admin.projectTemplateWorkflowDeleted"));
      if (selectedWorkflowId === workflowId) {
        setSelectedWorkflowId(null);
      }
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowId) return;
    setSubmitting(true);
    try {
      await projectTemplateApi.createWorkflowStatus(
        templateId,
        selectedWorkflowId,
        {
          name: stName,
          key: stKey,
          category: stCategory,
          sortOrder: stSortOrder ? Number(stSortOrder) : undefined,
          color: stColor || undefined,
          isInitial: stIsInitial,
          isFinal: stIsFinal,
        },
      );
      toast.success(t("pages.admin.projectTemplateStatusCreated"));
      setStName("");
      setStKey("");
      setStSortOrder("");
      setStColor("");
      setStIsInitial(false);
      setStIsFinal(false);
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStatus = async (statusId: number) => {
    if (!selectedWorkflowId) return;
    setSubmitting(true);
    try {
      await projectTemplateApi.deleteWorkflowStatus(
        templateId,
        selectedWorkflowId,
        statusId,
      );
      toast.success(t("pages.admin.projectTemplateStatusDeleted"));
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowId || !trFromStatusId || !trToStatusId) return;
    setSubmitting(true);
    try {
      await projectTemplateApi.createWorkflowTransition(
        templateId,
        selectedWorkflowId,
        {
          fromStatusId: Number(trFromStatusId),
          toStatusId: Number(trToStatusId),
          name: trName,
        },
      );
      toast.success(t("pages.admin.projectTemplateTransitionCreated"));
      setTrFromStatusId("");
      setTrToStatusId("");
      setTrName("");
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransition = async (transitionId: number) => {
    if (!selectedWorkflowId) return;
    setSubmitting(true);
    try {
      await projectTemplateApi.deleteWorkflowTransition(
        templateId,
        selectedWorkflowId,
        transitionId,
      );
      toast.success(t("pages.admin.projectTemplateTransitionDeleted"));
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddApprovalRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowId || !ruleTransitionId || !ruleRejectStatusId) return;
    setSubmitting(true);
    try {
      await projectTemplateApi.createApprovalRule(
        templateId,
        selectedWorkflowId,
        Number(ruleTransitionId),
        {
          approverType: ruleApproverType,
          projectRoleId:
            ruleApproverType === "PROJECT_ROLE"
              ? Number(ruleProjectRoleId)
              : undefined,
          taskRole: ruleApproverType === "TASK_ROLE" ? ruleTaskRole : undefined,
          minApprovals: Number(ruleMinApprovals),
          onRejectStatusId: Number(ruleRejectStatusId),
        },
      );
      toast.success(t("pages.admin.projectTemplateApprovalRuleCreated"));
      setRuleTransitionId("");
      setRuleProjectRoleId("");
      setRuleMinApprovals("1");
      setRuleRejectStatusId("");
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApprovalRule = async (
    transitionId: number,
    ruleId: number,
  ) => {
    if (!selectedWorkflowId) return;
    setSubmitting(true);
    try {
      await projectTemplateApi.deleteApprovalRule(
        templateId,
        selectedWorkflowId,
        transitionId,
        ruleId,
      );
      toast.success(t("pages.admin.projectTemplateApprovalRuleDeleted"));
      onChanged();
    } catch (error) {
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
      <h2 className="mb-3 text-lg font-semibold">
        {t("pages.admin.projectTemplateWorkflowsTitle")}
      </h2>

      {workflows.length === 0 ? (
        <p className="mb-4 text-sm text-gray-500">
          {t("pages.admin.projectTemplateNoWorkflows")}
        </p>
      ) : (
        <Table className="mb-4">
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.admin.projectTemplateName")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-right">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((wf) => (
              <TableRow
                key={wf.id}
                className={
                  selectedWorkflowId === wf.id ? "bg-primary/5" : undefined
                }
              >
                <TableCell>
                  <button
                    type="button"
                    className="cursor-pointer text-left font-medium hover:underline"
                    onClick={() => setSelectedWorkflowId(wf.id)}
                  >
                    {wf.name}
                  </button>
                  {wf.isDefault && (
                    <Badge variant="active" className="ml-2">
                      {t("pages.admin.projectTemplateDefault")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={wf.isActive ? "active" : "inactive"}>
                    {wf.isActive
                      ? t("common.active")
                      : t("pages.admin.projectTemplateInactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!wf.isDefault && isDraft && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => handleSetDefault(wf.id)}
                      >
                        {t("pages.admin.projectTemplateSetDefault")}
                      </Button>
                    )}
                    {isDraft && (
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={submitting}
                        onClick={() => handleDeleteWorkflow(wf.id)}
                      >
                        {t("common.delete")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {isDraft && (
        <form
          onSubmit={handleAddWorkflow}
          className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3"
        >
          <p className="mb-2 text-sm font-medium">
            {t("pages.admin.projectTemplateAddWorkflow")}
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Input
              placeholder={t("pages.admin.projectTemplateName")}
              value={wfName}
              onChange={(e) => setWfName(e.target.value)}
              className="max-w-xs"
              required
            />
            <Input
              placeholder={t("pages.admin.projectTemplateDescription")}
              value={wfDescription}
              onChange={(e) => setWfDescription(e.target.value)}
              className="max-w-xs"
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={wfIsDefault}
                onChange={(e) => setWfIsDefault(e.target.checked)}
              />
              {t("pages.admin.projectTemplateDefault")}
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={wfIsActive}
                onChange={(e) => setWfIsActive(e.target.checked)}
              />
              {t("common.active")}
            </label>
            <Button
              type="submit"
              disabled={submitting}
              className="cursor-pointer text-white bg-primary hover:bg-primary/90"
            >
              {t("pages.admin.projectTemplateAdd")}
            </Button>
          </div>
        </form>
      )}

      {selectedWorkflow && (
        <div className="space-y-4 border-t border-gray-100 pt-4">
          <h3 className="text-base font-semibold">
            {selectedWorkflow.name} — {t("pages.admin.projectTemplateStatuses")}
          </h3>

          {isDraft && (
            <form
              onSubmit={handleAddStatus}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Input
                  placeholder={t("pages.admin.projectTemplateName")}
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                  className="max-w-[140px]"
                  required
                />
                <Input
                  placeholder={t("pages.admin.projectTemplateKey")}
                  value={stKey}
                  onChange={(e) => setStKey(e.target.value)}
                  className="max-w-[140px]"
                  required
                />
                <select
                  value={stCategory}
                  onChange={(e) =>
                    setStCategory(e.target.value as StatusCategory)
                  }
                  className={selectClass}
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <Input
                  placeholder={t("pages.admin.projectTemplateSortOrder")}
                  value={stSortOrder}
                  onChange={(e) => setStSortOrder(e.target.value)}
                  className="max-w-[100px]"
                  type="number"
                />
                <Input
                  placeholder={t("pages.admin.projectTemplateColor")}
                  value={stColor}
                  onChange={(e) => setStColor(e.target.value)}
                  className="max-w-[100px]"
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={stIsInitial}
                    onChange={(e) => setStIsInitial(e.target.checked)}
                  />
                  {t("pages.admin.projectTemplateIsInitial")}
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={stIsFinal}
                    onChange={(e) => setStIsFinal(e.target.checked)}
                  />
                  {t("pages.admin.projectTemplateIsFinal")}
                </label>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer text-white bg-primary hover:bg-primary/90"
                >
                  {t("pages.admin.projectTemplateAdd")}
                </Button>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.admin.projectTemplateName")}</TableHead>
                <TableHead>{t("pages.admin.projectTemplateKey")}</TableHead>
                <TableHead>
                  {t("pages.admin.projectTemplateCategory")}
                </TableHead>
                <TableHead>
                  {t("pages.admin.projectTemplateSortOrder")}
                </TableHead>
                <TableHead>{t("pages.admin.projectTemplateColor")}</TableHead>
                <TableHead>
                  {t("pages.admin.projectTemplateIsInitial")}
                </TableHead>
                <TableHead>{t("pages.admin.projectTemplateIsFinal")}</TableHead>
                {isDraft && (
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedWorkflow.statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell>{status.name}</TableCell>
                  <TableCell>{status.key}</TableCell>
                  <TableCell>{status.category}</TableCell>
                  <TableCell>{status.sortOrder}</TableCell>
                  <TableCell>{status.color ?? "—"}</TableCell>
                  <TableCell>{status.isInitial ? "✓" : "—"}</TableCell>
                  <TableCell>{status.isFinal ? "✓" : "—"}</TableCell>
                  {isDraft && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={submitting}
                        onClick={() => handleDeleteStatus(status.id)}
                      >
                        {t("common.delete")}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <h3 className="text-base font-semibold">
            {t("pages.admin.projectTemplateTransitions")}
          </h3>

          {isDraft && selectedWorkflow.statuses.length >= 2 && (
            <form
              onSubmit={handleAddTransition}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <select
                  value={trFromStatusId}
                  onChange={(e) => setTrFromStatusId(e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">
                    {t("pages.admin.projectTemplateFromStatus")}
                  </option>
                  {selectedWorkflow.statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={trToStatusId}
                  onChange={(e) => setTrToStatusId(e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">
                    {t("pages.admin.projectTemplateToStatus")}
                  </option>
                  {selectedWorkflow.statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder={t("pages.admin.projectTemplateName")}
                  value={trName}
                  onChange={(e) => setTrName(e.target.value)}
                  className="max-w-xs"
                  required
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer text-white bg-primary hover:bg-primary/90"
                >
                  {t("pages.admin.projectTemplateAdd")}
                </Button>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.admin.projectTemplateName")}</TableHead>
                <TableHead>
                  {t("pages.admin.projectTemplateFromStatus")}
                </TableHead>
                <TableHead>
                  {t("pages.admin.projectTemplateToStatus")}
                </TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>
                  {t("pages.admin.projectTemplateApprovalRules")}
                </TableHead>
                {isDraft && (
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedWorkflow.transitions.map((tr) => (
                <TableRow key={tr.id}>
                  <TableCell>{tr.name}</TableCell>
                  <TableCell>{getStatusName(tr.fromStatusId)}</TableCell>
                  <TableCell>{getStatusName(tr.toStatusId)}</TableCell>
                  <TableCell>
                    <Badge variant={tr.isActive ? "active" : "inactive"}>
                      {tr.isActive
                        ? t("common.active")
                        : t("pages.admin.projectTemplateInactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tr.approvalRules.length === 0 ? (
                      "—"
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {tr.approvalRules.map((rule) => (
                          <li key={rule.id} className="flex items-center gap-2">
                            <span>
                              {getApproverLabel(
                                rule.approverType,
                                rule.projectRoleId,
                                rule.taskRole,
                              )}{" "}
                              · min {rule.minApprovals} · reject:{" "}
                              {getStatusName(rule.onRejectStatusId)}
                            </span>
                            {isDraft && (
                              <Button
                                size="sm"
                                variant="locked"
                                disabled={submitting}
                                onClick={() =>
                                  handleDeleteApprovalRule(tr.id, rule.id)
                                }
                              >
                                {t("common.delete")}
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  {isDraft && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="locked"
                        disabled={submitting}
                        onClick={() => handleDeleteTransition(tr.id)}
                      >
                        {t("common.delete")}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {isDraft && selectedWorkflow.transitions.length > 0 && (
            <form
              onSubmit={handleAddApprovalRule}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <p className="mb-2 text-sm font-medium">
                {t("pages.admin.projectTemplateAddApprovalRule")}
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                <select
                  value={ruleTransitionId}
                  onChange={(e) => setRuleTransitionId(e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">
                    {t("pages.admin.projectTemplateTransition")}
                  </option>
                  {selectedWorkflow.transitions.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </select>
                <select
                  value={ruleApproverType}
                  onChange={(e) =>
                    setRuleApproverType(e.target.value as ApproverType)
                  }
                  className={selectClass}
                >
                  <option value="PROJECT_ROLE">
                    {t("pages.admin.projectTemplateProjectRole")}
                  </option>
                  <option value="TASK_ROLE">
                    {t("pages.admin.projectTemplateTaskRole")}
                  </option>
                </select>
                {ruleApproverType === "PROJECT_ROLE" ? (
                  <select
                    value={ruleProjectRoleId}
                    onChange={(e) => setRuleProjectRoleId(e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value="">
                      {t("pages.admin.projectTemplateSelectProjectRole")}
                    </option>
                    {projectRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={ruleTaskRole}
                    onChange={(e) =>
                      setRuleTaskRole(e.target.value as TaskRole)
                    }
                    className={selectClass}
                  >
                    <option value="ASSIGNEE">ASSIGNEE</option>
                    <option value="REVIEWER">REVIEWER</option>
                    <option value="REPORTER">REPORTER</option>
                  </select>
                )}
                <Input
                  type="number"
                  min={1}
                  placeholder={t("pages.admin.projectTemplateMinApprovals")}
                  value={ruleMinApprovals}
                  onChange={(e) => setRuleMinApprovals(e.target.value)}
                  className="max-w-[100px]"
                  required
                />
                <select
                  value={ruleRejectStatusId}
                  onChange={(e) => setRuleRejectStatusId(e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">
                    {t("pages.admin.projectTemplateRejectStatus")}
                  </option>
                  {selectedWorkflow.statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer text-white bg-primary hover:bg-primary/90"
                >
                  {t("pages.admin.projectTemplateAdd")}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
