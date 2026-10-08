import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Checkbox from "@/components/shared/Checkbox";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import Textarea from "@/components/shared/Textarea";
import { projectTemplateApi } from "@/features/project-template/api/project-template.api";
import SimpleRecordSection from "@/features/project-template/components/SimpleRecordSection";
import TemplateMetaForm from "@/features/project-template/components/TemplateMetaForm";
import WorkflowPanel from "@/features/project-template/components/WorkflowPanel";
import type {
  ProjectRole,
  TaskType,
  TemplateDetail,
} from "@/features/project-template/types/project-template.type";
import {
  getApiErrorMessages,
  toastApiError,
} from "@/features/project-template/utils/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function extractActivateErrors(error: unknown): string[] {
  return getApiErrorMessages(error);
}

export default function ProjectTemplateDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const id = Number(templateId);

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activateErrors, setActivateErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [dupKey, setDupKey] = useState("");
  const [dupName, setDupName] = useState("");
  const [dupDescription, setDupDescription] = useState("");

  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleSortOrder, setRoleSortOrder] = useState("");
  const [editRole, setEditRole] = useState<ProjectRole | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [editRoleSortOrder, setEditRoleSortOrder] = useState("");

  const [ttKey, setTtKey] = useState("");
  const [ttName, setTtName] = useState("");
  const [ttDescription, setTtDescription] = useState("");
  const [ttSortOrder, setTtSortOrder] = useState("");
  const [ttIsActive, setTtIsActive] = useState(true);
  const [ttWorkflowId, setTtWorkflowId] = useState<string>("");
  const [editTaskType, setEditTaskType] = useState<TaskType | null>(null);
  const [editTtName, setEditTtName] = useState("");
  const [editTtDescription, setEditTtDescription] = useState("");
  const [editTtSortOrder, setEditTtSortOrder] = useState("");
  const [editTtIsActive, setEditTtIsActive] = useState(true);
  const [editTtWorkflowId, setEditTtWorkflowId] = useState<string>("");

  const fetchTemplate = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    try {
      const res = await projectTemplateApi.getTemplate(id);
      setTemplate(res.data);
    } catch (error) {
      toastApiError(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const isDraft = template?.status === "DRAFT";

  const handleActivate = async () => {
    if (!template) return;
    setActionLoading(true);
    setActivateErrors([]);
    try {
      await projectTemplateApi.activateTemplate(template.id);
      toast.success(t("pages.admin.projectTemplateActivated"));
      fetchTemplate();
    } catch (error) {
      const errors = extractActivateErrors(error);
      if (errors.length > 0) {
        setActivateErrors(errors);
      } else {
        toastApiError(error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!template) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.archiveTemplate(template.id);
      toast.success(t("pages.admin.projectTemplateArchived"));
      fetchTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.deleteTemplate(template.id);
      toast.success(t("pages.admin.projectTemplateDeleted"));
      navigate("/admin/project-templates");
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
      setConfirmDelete(false);
    }
  };

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    setActionLoading(true);
    try {
      const res = await projectTemplateApi.duplicateTemplate(template.id, {
        key: dupKey,
        name: dupName,
        description: dupDescription || undefined,
      });
      toast.success(t("pages.admin.projectTemplateDuplicated"));
      setDuplicateOpen(false);
      navigate(`/admin/project-templates/${res.data.id}`);
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.createProjectRole(template.id, {
        key: roleKey,
        name: roleName,
        description: roleDescription || undefined,
        sortOrder: roleSortOrder ? Number(roleSortOrder) : undefined,
      });
      toast.success(t("pages.admin.projectTemplateRoleCreated"));
      setRoleKey("");
      setRoleName("");
      setRoleDescription("");
      setRoleSortOrder("");
      fetchTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !editRole) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.updateProjectRole(template.id, editRole.id, {
        name: editRoleName,
        description: editRoleDescription || undefined,
        sortOrder: editRoleSortOrder ? Number(editRoleSortOrder) : undefined,
      });
      toast.success(t("pages.admin.projectTemplateRoleUpdated"));
      setEditRole(null);
      fetchTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!template) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.deleteProjectRole(template.id, roleId);
      toast.success(t("pages.admin.projectTemplateRoleDeleted"));
      fetchTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTaskType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.createTaskType(template.id, {
        key: ttKey,
        name: ttName,
        description: ttDescription || undefined,
        sortOrder: ttSortOrder ? Number(ttSortOrder) : undefined,
        isActive: ttIsActive,
        workflowId: ttWorkflowId ? Number(ttWorkflowId) : null,
      });
      toast.success(t("pages.admin.projectTemplateTaskTypeCreated"));
      setTtKey("");
      setTtName("");
      setTtDescription("");
      setTtSortOrder("");
      setTtIsActive(true);
      setTtWorkflowId("");
      fetchTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTaskType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !editTaskType) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.updateTaskType(template.id, editTaskType.id, {
        name: editTtName,
        description: editTtDescription || undefined,
        sortOrder: editTtSortOrder ? Number(editTtSortOrder) : undefined,
        isActive: editTtIsActive,
        workflowId: editTtWorkflowId ? Number(editTtWorkflowId) : null,
      });
      toast.success(t("pages.admin.projectTemplateTaskTypeUpdated"));
      setEditTaskType(null);
      fetchTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTaskType = async (taskTypeId: number) => {
    if (!template) return;
    setActionLoading(true);
    try {
      await projectTemplateApi.deleteTaskType(template.id, taskTypeId);
      toast.success(t("pages.admin.projectTemplateTaskTypeDeleted"));
      fetchTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditRole = (role: ProjectRole) => {
    setEditRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description ?? "");
    setEditRoleSortOrder(String(role.sortOrder));
  };

  const openEditTaskType = (tt: TaskType) => {
    setEditTaskType(tt);
    setEditTtName(tt.name);
    setEditTtDescription(tt.description ?? "");
    setEditTtSortOrder(String(tt.sortOrder));
    setEditTtIsActive(tt.isActive);
    setEditTtWorkflowId(tt.workflowId ? String(tt.workflowId) : "");
  };

  const getWorkflowName = (workflowId: number | null) => {
    if (!workflowId || !template) {
      return t("pages.admin.projectTemplateDefaultWorkflow");
    }
    return (
      template.workflows.find((w) => w.id === workflowId)?.name ??
      `#${workflowId}`
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-sm text-gray-500">
        {t("pages.admin.projectTemplateNotFound")}
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/project-templates"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← {t("pages.admin.projectTemplateBackToList")}
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{template.name}</h1>
            <Badge
              variant={
                template.status === "ACTIVE"
                  ? "active"
                  : template.status === "ARCHIVED"
                    ? "inactive"
                    : "outline"
              }
            >
              {template.status === "DRAFT"
                ? t("pages.admin.projectTemplateStatusDraft")
                : template.status === "ACTIVE"
                  ? t("pages.admin.projectTemplateStatusActive")
                  : t("pages.admin.projectTemplateStatusArchived")}
            </Badge>
            <span className="text-sm text-gray-500">
              {t("pages.admin.projectTemplateVersion")} v{template.version}
            </span>
          </div>
          {activateErrors.length > 0 && (
            <ul className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {activateErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {template.status === "DRAFT" && (
            <>
              <Button
                disabled={actionLoading}
                onClick={handleActivate}
                className="cursor-pointer text-white bg-primary hover:bg-primary/90"
              >
                {t("pages.admin.projectTemplateActivate")}
              </Button>
              <Button
                variant="locked"
                disabled={actionLoading}
                onClick={() => setConfirmDelete(true)}
              >
                {t("common.delete")}
              </Button>
            </>
          )}
          {template.status === "ACTIVE" && (
            <>
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={handleArchive}
              >
                {t("pages.admin.projectTemplateArchive")}
              </Button>
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => setDuplicateOpen(true)}
              >
                {t("pages.admin.projectTemplateDuplicate")}
              </Button>
            </>
          )}
          {template.status === "ARCHIVED" && (
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() => setDuplicateOpen(true)}
            >
              {t("pages.admin.projectTemplateDuplicate")}
            </Button>
          )}
        </div>
      </div>

      {!isDraft && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {t("pages.admin.projectTemplateLockedNote")}
        </p>
      )}

      <TemplateMetaForm
        template={template}
        isDraft={isDraft}
        onSaved={fetchTemplate}
      />

      <SimpleRecordSection
        title={t("pages.admin.projectTemplateProjectRolesTitle")}
        records={template.projectRoles}
        isDraft={isDraft}
        emptyMessage={t("pages.admin.projectTemplateNoProjectRoles")}
        onDelete={handleDeleteRole}
        onEdit={openEditRole}
        columns={[
          { key: "key", label: t("pages.admin.projectTemplateKey") },
          { key: "name", label: t("pages.admin.projectTemplateName") },
          {
            key: "description",
            label: t("pages.admin.projectTemplateDescription"),
            render: (r) => r.description ?? "—",
          },
          {
            key: "sortOrder",
            label: t("pages.admin.projectTemplateSortOrder"),
          },
        ]}
        addForm={
          <form onSubmit={handleAddRole} className="flex flex-wrap items-center gap-2">
            <Input
              placeholder={t("pages.admin.projectTemplateKey")}
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value.toUpperCase())}
              className="max-w-[140px]"
              required
            />
            <Input
              placeholder={t("pages.admin.projectTemplateName")}
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="max-w-[160px]"
              required
            />
            <Input
              placeholder={t("pages.admin.projectTemplateDescription")}
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              className="max-w-[180px]"
            />
            <Input
              placeholder={t("pages.admin.projectTemplateSortOrder")}
              value={roleSortOrder}
              onChange={(e) => setRoleSortOrder(e.target.value)}
              className="w-36 shrink-0"
              type="number"
            />
            <Button
              type="submit"
              disabled={actionLoading}
              className="h-10 cursor-pointer bg-primary text-white hover:bg-primary/90"
            >
              {t("pages.admin.projectTemplateAdd")}
            </Button>
          </form>
        }
      />

      <SimpleRecordSection
        title={t("pages.admin.projectTemplateTaskTypesTitle")}
        records={template.taskTypes}
        isDraft={isDraft}
        emptyMessage={t("pages.admin.projectTemplateNoTaskTypes")}
        onDelete={handleDeleteTaskType}
        onEdit={openEditTaskType}
        columns={[
          { key: "key", label: t("pages.admin.projectTemplateKey") },
          { key: "name", label: t("pages.admin.projectTemplateName") },
          {
            key: "description",
            label: t("pages.admin.projectTemplateDescription"),
            render: (r) => r.description ?? "—",
          },
          {
            key: "sortOrder",
            label: t("pages.admin.projectTemplateSortOrder"),
          },
          {
            key: "isActive",
            label: t("common.status"),
            render: (r) =>
              r.isActive
                ? t("common.active")
                : t("pages.admin.projectTemplateInactive"),
          },
          {
            key: "workflowId",
            label: t("pages.admin.projectTemplateWorkflow"),
            render: (r) => getWorkflowName(r.workflowId),
          },
        ]}
        addForm={
          <form onSubmit={handleAddTaskType} className="flex flex-wrap items-center gap-2">
            <Input
              placeholder={t("pages.admin.projectTemplateKey")}
              value={ttKey}
              onChange={(e) => setTtKey(e.target.value.toUpperCase())}
              className="max-w-[140px]"
              required
            />
            <Input
              placeholder={t("pages.admin.projectTemplateName")}
              value={ttName}
              onChange={(e) => setTtName(e.target.value)}
              className="max-w-[160px]"
              required
            />
            <Input
              placeholder={t("pages.admin.projectTemplateDescription")}
              value={ttDescription}
              onChange={(e) => setTtDescription(e.target.value)}
              className="max-w-[180px]"
            />
            <Input
              placeholder={t("pages.admin.projectTemplateSortOrder")}
              value={ttSortOrder}
              onChange={(e) => setTtSortOrder(e.target.value)}
              className="w-36 shrink-0"
              type="number"
            />
            <label className="flex h-10 items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={ttIsActive}
                onChange={(e) => setTtIsActive(e.target.checked)}
              />
              {t("common.active")}
            </label>
            <select
              value={ttWorkflowId}
              onChange={(e) => setTtWorkflowId(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="">
                {t("pages.admin.projectTemplateDefaultWorkflow")}
              </option>
              {template.workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              disabled={actionLoading}
              className="h-10 cursor-pointer bg-primary text-white hover:bg-primary/90"
            >
              {t("pages.admin.projectTemplateAdd")}
            </Button>
          </form>
        }
      />

      <WorkflowPanel
        templateId={template.id}
        workflows={template.workflows}
        projectRoles={template.projectRoles}
        isDraft={isDraft}
        onChanged={fetchTemplate}
      />

      <Modal
        open={editRole !== null}
        title={t("pages.admin.projectTemplateEditRole")}
        onClose={() => {
          if (!actionLoading) setEditRole(null);
        }}
        formId="edit-project-role"
        confirmText={t("common.save")}
        loading={actionLoading}
      >
        {editRole && (
          <form
            id="edit-project-role"
            onSubmit={handleUpdateRole}
            className="space-y-4"
          >
            <Field
              label={t("pages.admin.projectTemplateKey")}
              htmlFor="edit-role-key"
            >
              <Input id="edit-role-key" value={editRole.key} disabled />
            </Field>
            <Field
              label={t("pages.admin.projectTemplateName")}
              htmlFor="edit-role-name"
              required
            >
              <Input
                id="edit-role-name"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                required
              />
            </Field>
            <Field
              label={t("pages.admin.projectTemplateDescription")}
              htmlFor="edit-role-description"
            >
              <Textarea
                id="edit-role-description"
                value={editRoleDescription}
                onChange={(e) => setEditRoleDescription(e.target.value)}
                className="min-h-20"
              />
            </Field>
            <Field
              label={t("pages.admin.projectTemplateSortOrder")}
              htmlFor="edit-role-sort"
            >
              <Input
                id="edit-role-sort"
                value={editRoleSortOrder}
                onChange={(e) => setEditRoleSortOrder(e.target.value)}
                type="number"
              />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={editTaskType !== null}
        title={t("pages.admin.projectTemplateEditTaskType")}
        onClose={() => {
          if (!actionLoading) setEditTaskType(null);
        }}
        formId="edit-task-type"
        confirmText={t("common.save")}
        loading={actionLoading}
      >
        {editTaskType && (
          <form
            id="edit-task-type"
            onSubmit={handleUpdateTaskType}
            className="space-y-4"
          >
            <Field
              label={t("pages.admin.projectTemplateKey")}
              htmlFor="edit-task-type-key"
            >
              <Input id="edit-task-type-key" value={editTaskType.key} disabled />
            </Field>
            <Field
              label={t("pages.admin.projectTemplateName")}
              htmlFor="edit-task-type-name"
              required
            >
              <Input
                id="edit-task-type-name"
                value={editTtName}
                onChange={(e) => setEditTtName(e.target.value)}
                required
              />
            </Field>
            <Field
              label={t("pages.admin.projectTemplateDescription")}
              htmlFor="edit-task-type-description"
            >
              <Textarea
                id="edit-task-type-description"
                value={editTtDescription}
                onChange={(e) => setEditTtDescription(e.target.value)}
                className="min-h-20"
              />
            </Field>
            <Field
              label={t("pages.admin.projectTemplateSortOrder")}
              htmlFor="edit-task-type-sort"
            >
              <Input
                id="edit-task-type-sort"
                value={editTtSortOrder}
                onChange={(e) => setEditTtSortOrder(e.target.value)}
                type="number"
              />
            </Field>
            <Checkbox
              id="edit-task-type-active"
              label={t("common.active")}
              checked={editTtIsActive}
              onChange={(e) => setEditTtIsActive(e.target.checked)}
            />
            <Field
              label={t("pages.admin.projectTemplateWorkflow")}
              htmlFor="edit-task-type-workflow"
            >
              <Select
                id="edit-task-type-workflow"
                value={editTtWorkflowId}
                onChange={(e) => setEditTtWorkflowId(e.target.value)}
              >
                <option value="">
                  {t("pages.admin.projectTemplateDefaultWorkflow")}
                </option>
                {template.workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={duplicateOpen}
        title={t("pages.admin.projectTemplateDuplicate")}
        onClose={() => {
          if (!actionLoading) setDuplicateOpen(false);
        }}
        formId="duplicate-project-template"
        confirmText={t("pages.admin.projectTemplateDuplicate")}
        loading={actionLoading}
      >
        <form
          id="duplicate-project-template"
          onSubmit={handleDuplicate}
          className="space-y-4"
        >
          <Field
            label={t("pages.admin.projectTemplateKey")}
            htmlFor="duplicate-template-key"
            required
          >
            <Input
              id="duplicate-template-key"
              value={dupKey}
              onChange={(e) => setDupKey(e.target.value.toUpperCase())}
              required
            />
          </Field>
          <Field
            label={t("pages.admin.projectTemplateName")}
            htmlFor="duplicate-template-name"
            required
          >
            <Input
              id="duplicate-template-name"
              value={dupName}
              onChange={(e) => setDupName(e.target.value)}
              required
            />
          </Field>
          <Field
            label={t("pages.admin.projectTemplateDescription")}
            htmlFor="duplicate-template-description"
          >
            <Textarea
              id="duplicate-template-description"
              value={dupDescription}
              onChange={(e) => setDupDescription(e.target.value)}
              className="min-h-20"
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={confirmDelete}
        title={t("pages.admin.projectTemplateDeleteTitle")}
        description={t("pages.admin.projectTemplateDeleteDescription")}
        confirmText={t("common.delete")}
        loading={actionLoading}
        variant="danger"
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
