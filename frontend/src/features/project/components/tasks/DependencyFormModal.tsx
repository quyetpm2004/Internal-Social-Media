import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { projectApi } from "@/features/project/api/project.api";
import type {
  DependencyGroup,
  DependencyLagUnit,
  DependencyType,
  TaskDependency,
  TaskDependencyView,
} from "@/features/project/types/dependency.type";
import type { PlanningTask } from "@/features/project/types/planning.type";
import { LAG_LIMIT, parseLag } from "@/features/project/utils/dependency-draft";
import { toastApiError } from "@/features/project-template/utils/api-error";

const FORM_ID = "task-dependency-form";
const TYPES: DependencyType[] = ["FS", "SS", "FF", "SF"];

type DependencyFormModalProps = {
  open: boolean;
  projectId: number;
  taskId: number;
  groups: DependencyGroup[];
  dependency: TaskDependency | null;
  currentGroupId: number | null;
  excludedTaskIds: number[];
  onClose: () => void;
  onSaved: (view: TaskDependencyView) => void;
};

export default function DependencyFormModal({
  open,
  projectId,
  taskId,
  groups,
  dependency,
  currentGroupId,
  excludedTaskIds,
  onClose,
  onSaved,
}: DependencyFormModalProps) {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState<PlanningTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [predecessorId, setPredecessorId] = useState("");
  const [relationshipType, setRelationshipType] = useState<DependencyType>("FS");
  const [lag, setLag] = useState("0");
  const [lagUnit, setLagUnit] = useState<DependencyLagUnit>("DAY");
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKeyword("");
    setPredecessorId(dependency ? String(dependency.predecessor.id) : "");
    setRelationshipType(dependency?.relationshipType ?? "FS");
    setLag(dependency ? String(dependency.lag) : "0");
    setLagUnit(dependency?.lagUnit ?? "DAY");
    setGroupId(currentGroupId != null ? String(currentGroupId) : "");
    setError("");
  }, [open, dependency, currentGroupId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoadingTasks(true);
      try {
        const response = await projectApi.getPlanningTasks(projectId);
        if (!cancelled) setCatalog(response.data.tasks);
      } catch (loadError) {
        if (!cancelled) toastApiError(loadError);
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const options = useMemo(() => {
    const excluded = new Set(excludedTaskIds);
    const query = keyword.trim().toLowerCase();
    return catalog.filter((task) => {
      if (String(task.id) === predecessorId) return true;
      if (excluded.has(task.id)) return false;
      if (!query) return true;
      return (
        task.code.toLowerCase().includes(query) ||
        task.title.toLowerCase().includes(query)
      );
    });
  }, [catalog, excludedTaskIds, keyword, predecessorId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!predecessorId) {
      setError(t("pages.projects.tasks.dependencies.predecessorRequired"));
      return;
    }
    const lagValue = parseLag(lag);
    if (lagValue === null) {
      setError(t("pages.projects.tasks.dependencies.lagInvalid"));
      return;
    }

    const payload = {
      predecessorTaskId: Number(predecessorId),
      relationshipType,
      lag: lagValue,
      lagUnit,
      groupId: groupId ? Number(groupId) : null,
    };
    setSaving(true);
    try {
      const response = dependency
        ? await projectApi.updateTaskDependency(
            projectId,
            taskId,
            dependency.id,
            payload,
          )
        : await projectApi.createTaskDependency(projectId, taskId, payload);
      toast.success(
        dependency
          ? t("pages.projects.tasks.dependencies.updated")
          : t("pages.projects.tasks.dependencies.created"),
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
        dependency
          ? t("pages.projects.tasks.dependencies.editTitle")
          : t("pages.projects.tasks.dependencies.createTitle")
      }
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
        <Field
          label={t("pages.projects.tasks.dependencies.predecessor")}
          htmlFor="dependency-predecessor"
          required
        >
          <div className="space-y-2">
            <Input
              value={keyword}
              placeholder={t("pages.projects.tasks.dependencies.searchTask")}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              id="dependency-predecessor"
              value={predecessorId}
              disabled={loadingTasks}
              onChange={(event) => setPredecessorId(event.target.value)}
            >
              <option value="">
                {loadingTasks
                  ? t("common.processing")
                  : t("pages.projects.tasks.dependencies.pickPredecessor")}
              </option>
              {options.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.code} · {task.title}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        <Field label={t("pages.projects.tasks.dependencies.type")}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TYPES.map((type) => (
              <label
                key={type}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${
                  relationshipType === type
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="dependency-type"
                  checked={relationshipType === type}
                  onChange={() => setRelationshipType(type)}
                  className="mt-1 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">
                    {type} · {t(`pages.projects.tasks.dependencies.types.${type}`)}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {t(`pages.projects.tasks.dependencies.typeHints.${type}`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={t("pages.projects.tasks.dependencies.lag")}
            htmlFor="dependency-lag"
            hint={t("pages.projects.tasks.dependencies.lagHint")}
          >
            <Input
              id="dependency-lag"
              type="number"
              step={0.25}
              min={-LAG_LIMIT}
              max={LAG_LIMIT}
              value={lag}
              onChange={(event) => setLag(event.target.value)}
            />
          </Field>
          <Field
            label={t("pages.projects.tasks.dependencies.lagUnit")}
            htmlFor="dependency-lag-unit"
          >
            <Select
              id="dependency-lag-unit"
              value={lagUnit}
              onChange={(event) =>
                setLagUnit(event.target.value as DependencyLagUnit)
              }
            >
              <option value="DAY">
                {t("pages.projects.tasks.dependencies.units.DAY")}
              </option>
              <option value="HOUR">
                {t("pages.projects.tasks.dependencies.units.HOUR")}
              </option>
            </Select>
          </Field>
        </div>

        <Field
          label={t("pages.projects.tasks.dependencies.group")}
          htmlFor="dependency-group"
        >
          <Select
            id="dependency-group"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">
              {t("pages.projects.tasks.dependencies.newGroup")}
            </option>
            {groups.map((group, index) => (
              <option key={group.id} value={group.id}>
                {t("pages.projects.tasks.dependencies.groupName", {
                  index: index + 1,
                })}{" "}
                · {t(`pages.projects.tasks.dependencies.logic.${group.logicType}`)}
              </option>
            ))}
          </Select>
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
