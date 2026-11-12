import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Field from "@/components/shared/Field";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { projectApi } from "@/features/project/api/project.api";
import type {
  DependencyGroup,
  DependencyLogic,
  DependencySelectionMode,
  TaskDependency,
  TaskDependencyView,
} from "@/features/project/types/dependency.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

const FORM_ID = "task-dependency-group-form";

type DependencyGroupFormModalProps = {
  open: boolean;
  projectId: number;
  taskId: number;
  dependencies: TaskDependency[];
  group: DependencyGroup | null;
  onClose: () => void;
  onSaved: (view: TaskDependencyView) => void;
};

export default function DependencyGroupFormModal({
  open,
  projectId,
  taskId,
  dependencies,
  group,
  onClose,
  onSaved,
}: DependencyGroupFormModalProps) {
  const { t } = useTranslation();
  const [logicType, setLogicType] = useState<DependencyLogic>("AND");
  const [selectionMode, setSelectionMode] =
    useState<DependencySelectionMode>("MANUAL");
  const [dependencyIds, setDependencyIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLogicType(group?.logicType ?? "OR");
    setSelectionMode(group?.selectionMode ?? "MANUAL");
    setDependencyIds([]);
    setSelectedId(group?.selectedDependencyId ?? null);
    setError("");
  }, [open, group]);

  const choosesManually = logicType === "OR" && selectionMode === "MANUAL";

  const toggleDependency = (id: number) => {
    setDependencyIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!group && dependencyIds.length === 0) {
      setError(t("pages.projects.tasks.dependencies.groupPickRequired"));
      return;
    }
    setSaving(true);
    try {
      const response = group
        ? await projectApi.updateDependencyGroup(projectId, taskId, group.id, {
            logicType,
            selectionMode,
            selectedDependencyId: choosesManually ? selectedId : null,
          })
        : await projectApi.createDependencyGroup(projectId, taskId, {
            logicType,
            selectionMode,
            dependencyIds,
          });
      toast.success(
        group
          ? t("pages.projects.tasks.dependencies.groupUpdated")
          : t("pages.projects.tasks.dependencies.groupCreated"),
      );
      onSaved(response.data);
      onClose();
    } catch (saveError) {
      toastApiError(saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        group
          ? t("pages.projects.tasks.dependencies.groupEditTitle")
          : t("pages.projects.tasks.dependencies.groupCreateTitle")
      }
      description={t("pages.projects.tasks.dependencies.groupHint")}
      formId={FORM_ID}
      confirmText={t("common.save")}
      loading={saving}
      size="lg"
    >
      <form
        id={FORM_ID}
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={t("pages.projects.tasks.dependencies.logicLabel")}
            htmlFor="dependency-group-logic"
          >
            <Select
              id="dependency-group-logic"
              value={logicType}
              onChange={(event) =>
                setLogicType(event.target.value as DependencyLogic)
              }
            >
              <option value="AND">
                {t("pages.projects.tasks.dependencies.logic.AND")}
              </option>
              <option value="OR">
                {t("pages.projects.tasks.dependencies.logic.OR")}
              </option>
            </Select>
          </Field>
          {logicType === "OR" && (
            <Field
              label={t("pages.projects.tasks.dependencies.modeLabel")}
              htmlFor="dependency-group-mode"
            >
              <Select
                id="dependency-group-mode"
                value={selectionMode}
                onChange={(event) =>
                  setSelectionMode(event.target.value as DependencySelectionMode)
                }
              >
                <option value="MANUAL">
                  {t("pages.projects.tasks.dependencies.mode.MANUAL")}
                </option>
                <option value="AUTO">
                  {t("pages.projects.tasks.dependencies.mode.AUTO")}
                </option>
              </Select>
            </Field>
          )}
        </div>

        {!group && (
          <Field label={t("pages.projects.tasks.dependencies.groupMembers")}>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {dependencies.map((dependency) => (
                <li key={dependency.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={dependencyIds.includes(dependency.id)}
                      onChange={() => toggleDependency(dependency.id)}
                      className="size-4 cursor-pointer accent-primary"
                    />
                    <span className="text-xs font-medium text-slate-400">
                      {dependency.predecessor.code}
                    </span>
                    <span className="min-w-0 truncate text-sm text-slate-800">
                      {dependency.predecessor.title}
                    </span>
                    <span className="ml-auto text-xs font-semibold text-slate-500">
                      {dependency.relationshipType}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Field>
        )}

        {group && choosesManually && (
          <Field label={t("pages.projects.tasks.dependencies.selectedLabel")}>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              <li>
                <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="dependency-selected"
                    checked={selectedId == null}
                    onChange={() => setSelectedId(null)}
                    className="size-4 cursor-pointer accent-primary"
                  />
                  <span className="text-sm text-slate-500">
                    {t("pages.projects.tasks.dependencies.noSelection")}
                  </span>
                </label>
              </li>
              {group.dependencies.map((dependency) => (
                <li key={dependency.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="dependency-selected"
                      checked={selectedId === dependency.id}
                      onChange={() => setSelectedId(dependency.id)}
                      className="size-4 cursor-pointer accent-primary"
                    />
                    <span className="text-xs font-medium text-slate-400">
                      {dependency.predecessor.code}
                    </span>
                    <span className="min-w-0 truncate text-sm text-slate-800">
                      {dependency.predecessor.title}
                    </span>
                    <span className="ml-auto text-xs font-semibold text-slate-500">
                      {dependency.relationshipType}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Field>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
