import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import { projectApi } from "@/features/project/api/project.api";
import type {
  DependencyLagUnit,
  DependencyType,
} from "@/features/project/types/dependency.type";
import type { PlanningTask } from "@/features/project/types/planning.type";
import {
  LAG_LIMIT,
  newDependencyDraft,
  type DependencyDraft,
} from "@/features/project/utils/dependency-draft";
import { toastApiError } from "@/features/project-template/utils/api-error";

const TYPES: DependencyType[] = ["FS", "SS", "FF", "SF"];

type DependencyDraftEditorProps = {
  projectId: number;
  value: DependencyDraft[];
  error?: string;
  onChange: (value: DependencyDraft[]) => void;
};

export default function DependencyDraftEditor({
  projectId,
  value,
  error,
  onChange,
}: DependencyDraftEditorProps) {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState<PlanningTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await projectApi.getPlanningTasks(projectId);
        if (!cancelled) setCatalog(response.data.tasks);
      } catch (loadError) {
        if (!cancelled) toastApiError(loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const patchRow = (key: string, partial: Partial<DependencyDraft>) => {
    onChange(
      value.map((row) => (row.key === key ? { ...row, ...partial } : row)),
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-700">
            {t("pages.projects.tasks.dependencies.sectionTitle")}
          </p>
          <p className="text-xs text-slate-500">
            {t("pages.projects.tasks.dependencies.sectionHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...value, newDependencyDraft()])}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary"
        >
          <Plus className="size-4" />
          {t("pages.projects.tasks.dependencies.add")}
        </button>
      </div>

      {value.map((row) => {
        const taken = new Set(
          value
            .filter((other) => other.key !== row.key)
            .map((other) => other.predecessorId),
        );
        return (
          <div
            key={row.key}
            className="space-y-2 rounded-lg border border-slate-200 p-3"
          >
            <div className="flex items-end gap-2">
              <Field
                label={t("pages.projects.tasks.dependencies.predecessor")}
                htmlFor={`${row.key}-predecessor`}
                required
                className="min-w-0 flex-1"
              >
                <Select
                  id={`${row.key}-predecessor`}
                  value={row.predecessorId}
                  disabled={loading}
                  onChange={(event) =>
                    patchRow(row.key, { predecessorId: event.target.value })
                  }
                >
                  <option value="">
                    {loading
                      ? t("common.processing")
                      : t("pages.projects.tasks.dependencies.pickPredecessor")}
                  </option>
                  {catalog
                    .filter((task) => !taken.has(String(task.id)))
                    .map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.code} · {task.title}
                      </option>
                    ))}
                </Select>
              </Field>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item.key !== row.key))}
                aria-label={t("pages.projects.tasks.dependencies.delete")}
                className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]">
              <Field
                label={t("pages.projects.tasks.dependencies.type")}
                htmlFor={`${row.key}-type`}
              >
                <Select
                  id={`${row.key}-type`}
                  value={row.relationshipType}
                  onChange={(event) =>
                    patchRow(row.key, {
                      relationshipType: event.target.value as DependencyType,
                    })
                  }
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type} · {t(`pages.projects.tasks.dependencies.types.${type}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label={t("pages.projects.tasks.dependencies.lag")}
                htmlFor={`${row.key}-lag`}
              >
                <Input
                  id={`${row.key}-lag`}
                  type="number"
                  step={0.25}
                  min={-LAG_LIMIT}
                  max={LAG_LIMIT}
                  value={row.lag}
                  onChange={(event) =>
                    patchRow(row.key, { lag: event.target.value })
                  }
                />
              </Field>
              <Field
                label={t("pages.projects.tasks.dependencies.lagUnit")}
                htmlFor={`${row.key}-unit`}
              >
                <Select
                  id={`${row.key}-unit`}
                  value={row.lagUnit}
                  onChange={(event) =>
                    patchRow(row.key, {
                      lagUnit: event.target.value as DependencyLagUnit,
                    })
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
            <p className="text-xs text-slate-500">
              {t("pages.projects.tasks.dependencies.lagHint")}
            </p>
          </div>
        );
      })}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
