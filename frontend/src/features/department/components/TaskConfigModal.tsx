import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Settings2,
  Star,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Checkbox from "@/components/shared/Checkbox";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import { departmentTaskApi } from "@/features/department/api/department-task.api";
import type { StatusCategory } from "@/features/department/types/department.type";
import type {
  DepartmentTaskConfig,
  DepartmentTaskStatus,
  DepartmentTaskWorkflow,
} from "@/features/department/types/department-task.type";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { flagsForCategory } from "@/features/project/components/workflow/workflow-flow";
import { cn } from "@/lib/utils";

type ConfigTab = "workflow" | "statuses";

const TABS: ConfigTab[] = ["workflow", "statuses"];
const CATEGORIES: StatusCategory[] = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];
const DEFAULT_COLOR = "#3B82F6";

type DraftStatus = Pick<
  DepartmentTaskStatus,
  "name" | "category" | "isInitial" | "isFinal" | "taskCount"
> & {
  uid: string;
  id: number | null;
  color: string;
};

type TaskConfigModalProps = {
  open: boolean;
  config: DepartmentTaskConfig;
  onClose: () => void;
  onSaved: (config: DepartmentTaskConfig) => void;
};

function toDrafts(config: DepartmentTaskConfig): DraftStatus[] {
  return config.statuses.map((status) => ({
    uid: String(status.id),
    id: status.id,
    name: status.name,
    category: status.category,
    color: status.color ?? DEFAULT_COLOR,
    isInitial: status.isInitial,
    isFinal: status.isFinal,
    taskCount: status.taskCount,
  }));
}

function ConfigForm({
  config,
  onClose,
  onSaved,
}: Omit<TaskConfigModalProps, "open">) {
  const { t } = useTranslation();
  const savedWorkflow = config.workflow;
  const savedStatuses = toDrafts(config);

  const [tab, setTab] = useState<ConfigTab>("workflow");
  const [workflow, setWorkflow] =
    useState<DepartmentTaskWorkflow>(savedWorkflow);
  const [statuses, setStatuses] = useState<DraftStatus[]>(savedStatuses);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<StatusCategory>("TODO");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState("");
  const counter = useRef(0);

  const dirty =
    JSON.stringify([workflow, statuses]) !==
    JSON.stringify([savedWorkflow, savedStatuses]);

  const patchStatus = (uid: string, partial: Partial<DraftStatus>) => {
    setError("");
    setStatuses((current) =>
      current.map((status) =>
        status.uid === uid ? { ...status, ...partial } : status,
      ),
    );
  };

  const changeCategory = (status: DraftStatus, next: StatusCategory) => {
    const flags = flagsForCategory(next, status);
    patchStatus(status.uid, flags);
  };

  const setInitial = (uid: string) => {
    setError("");
    setStatuses((current) =>
      current.map((status) => ({ ...status, isInitial: status.uid === uid })),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    setStatuses((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addStatus = () => {
    const name = newName.trim();
    if (!name) return;
    counter.current += 1;
    const flags = flagsForCategory(newCategory, {
      isInitial: false,
      isFinal: false,
    });
    setStatuses((current) => [
      ...current,
      {
        uid: `new-${counter.current}`,
        id: null,
        name,
        color: newColor,
        taskCount: 0,
        ...flags,
      },
    ]);
    setNewName("");
    setNewCategory("TODO");
    setNewColor(DEFAULT_COLOR);
    setError("");
  };

  const handleSave = async () => {
    if (!workflow.name.trim()) {
      setTab("workflow");
      setError(t("department.taskConfig.errors.workflowName"));
      return;
    }
    if (statuses.some((status) => !status.name.trim())) {
      setTab("statuses");
      setError(t("department.taskConfig.errors.statusName"));
      return;
    }
    if (statuses.filter((status) => status.isInitial).length !== 1) {
      setTab("statuses");
      setError(t("pages.projects.workflowPanel.needOneInitial"));
      return;
    }
    if (!statuses.some((status) => status.category === "DONE")) {
      setTab("statuses");
      setError(t("department.taskConfig.errors.needDone"));
      return;
    }
    setSaving(true);
    try {
      const response = await departmentTaskApi.saveConfig({
        name: workflow.name.trim(),
        description: workflow.description.trim(),
        statuses: statuses.map((status) => ({
          id: status.id,
          name: status.name.trim(),
          category: status.category,
          color: status.color,
          isInitial: status.isInitial,
          isFinal: status.isFinal,
        })),
      });
      toast.success(t("department.taskConfig.saved"));
      onSaved(response.data);
      onClose();
    } catch (saveError) {
      toastApiError(saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setWorkflow(savedWorkflow);
    setStatuses(savedStatuses);
    setError("");
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings2 className="size-5" />
          </span>
          <span>
            <span className="block">{t("department.taskConfig.title")}</span>
            <span className="block text-xs font-normal text-slate-500">
              {t("department.taskConfig.subtitle")}
            </span>
          </span>
        </span>
      }
      className="max-w-3xl"
      bodyClassName="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span
            className={cn(
              "text-xs",
              error ? "text-red-600" : "text-slate-400",
            )}
          >
            {error ||
              (dirty
                ? t("department.taskConfig.unsaved")
                : t("department.taskConfig.upToDate"))}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={handleDiscard}
              className="h-10 cursor-pointer rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("department.taskConfig.discard")}
            </button>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
              className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("department.taskConfig.save")}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex border-b border-slate-200">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 cursor-pointer border-b-2 px-3 pb-2.5 text-sm font-medium",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t(`department.taskConfig.tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "workflow" ? (
        <div className="space-y-5 pt-5">
          <Field
            label={t("department.taskConfig.workflowName")}
            htmlFor="department-workflow-name"
            required
          >
            <Input
              id="department-workflow-name"
              value={workflow.name}
              maxLength={150}
              onChange={(event) => {
                setError("");
                setWorkflow({ ...workflow, name: event.target.value });
              }}
            />
          </Field>
          <Field
            label={t("common.description")}
            htmlFor="department-workflow-description"
          >
            <Input
              id="department-workflow-description"
              value={workflow.description}
              maxLength={300}
              onChange={(event) =>
                setWorkflow({ ...workflow, description: event.target.value })
              }
            />
          </Field>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              {t("pages.projects.workflowPanel.transitionModeTitle")}
            </p>
            <div className="rounded-xl border border-primary bg-primary/5 px-4 py-3">
              <span className="block text-sm font-semibold text-slate-900">
                {t("pages.projects.workflowPanel.transitionModeFree")}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {t("pages.projects.workflowPanel.transitionModeFreeHint")}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {t("department.taskConfig.freeOnly")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-5">
          {statuses.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t("pages.projects.workflowPanel.noStatuses")}
            </p>
          ) : (
            <ul className="space-y-2">
              {statuses.map((status, index) => {
                const used = status.taskCount;
                const canDelete =
                  used === 0 && !status.isInitial && statuses.length > 2;
                return (
                  <li
                    key={status.uid}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={index === 0}
                        aria-label={t("pages.projects.workflowPanel.moveUp")}
                        onClick={() => move(index, -1)}
                        className="cursor-pointer text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === statuses.length - 1}
                        aria-label={t("pages.projects.workflowPanel.moveDown")}
                        onClick={() => move(index, 1)}
                        className="cursor-pointer text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                    <input
                      type="color"
                      aria-label={t("pages.projects.workflowPanel.color")}
                      value={status.color}
                      onChange={(event) =>
                        patchStatus(status.uid, { color: event.target.value })
                      }
                      className="size-8 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    />
                    <Input
                      value={status.name}
                      maxLength={150}
                      aria-label={t("pages.projects.workflowPanel.name")}
                      onChange={(event) =>
                        patchStatus(status.uid, { name: event.target.value })
                      }
                      className="min-w-40 flex-1"
                    />
                    <div className="w-36">
                      <Select
                        aria-label={t("pages.projects.workflowPanel.categoryLabel")}
                        value={status.category}
                        onChange={(event) =>
                          changeCategory(
                            status,
                            event.target.value as StatusCategory,
                          )
                        }
                      >
                        {CATEGORIES.map((item) => (
                          <option key={item} value={item}>
                            {t(`pages.projects.workflowPanel.category.${item}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Checkbox
                      label={t("pages.projects.workflowPanel.final")}
                      checked={status.isFinal}
                      disabled={
                        status.category === "TODO" ||
                        status.category === "IN_PROGRESS"
                      }
                      onChange={(event) =>
                        patchStatus(status.uid, { isFinal: event.target.checked })
                      }
                    />
                    <button
                      type="button"
                      disabled={status.category !== "TODO"}
                      title={t("pages.projects.workflowPanel.initial")}
                      aria-label={t("pages.projects.workflowPanel.initial")}
                      onClick={() => setInitial(status.uid)}
                      className={cn(
                        "cursor-pointer rounded-lg p-1.5 disabled:cursor-not-allowed disabled:opacity-30",
                        status.isInitial
                          ? "text-amber-500"
                          : "text-slate-400 hover:text-amber-500",
                      )}
                    >
                      <Star
                        className={cn(
                          "size-4",
                          status.isInitial && "fill-current",
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      disabled={!canDelete}
                      title={
                        used > 0
                          ? t("department.taskConfig.inUse", { count: used })
                          : undefined
                      }
                      aria-label={t("common.delete")}
                      onClick={() =>
                        setStatuses((current) =>
                          current.filter((item) => item.uid !== status.uid),
                        )
                      }
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              addStatus();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              type="color"
              aria-label={t("pages.projects.workflowPanel.color")}
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            />
            <Input
              value={newName}
              maxLength={150}
              placeholder={t("department.taskConfig.newStatus")}
              onChange={(event) => setNewName(event.target.value)}
              className="min-w-40 flex-1"
            />
            <div className="w-36">
              <Select
                aria-label={t("pages.projects.workflowPanel.categoryLabel")}
                value={newCategory}
                onChange={(event) =>
                  setNewCategory(event.target.value as StatusCategory)
                }
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {t(`pages.projects.workflowPanel.category.${item}`)}
                  </option>
                ))}
              </Select>
            </div>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" />
              {t("pages.projects.workflowPanel.add")}
            </button>
          </form>
          <p className="text-xs text-slate-400">
            {t("department.taskConfig.statusHint")}
          </p>
        </div>
      )}
    </Modal>
  );
}

export default function TaskConfigModal({
  open,
  ...rest
}: TaskConfigModalProps) {
  if (!open) return null;
  return <ConfigForm {...rest} />;
}
