import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Columns3,
  List,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import { departmentTaskApi } from "@/features/department/api/department-task.api";
import DepartmentTaskDetailView from "@/features/department/components/DepartmentTaskDetailView";
import DepartmentTaskFormModal from "@/features/department/components/DepartmentTaskFormModal";
import TaskConfigModal from "@/features/department/components/TaskConfigModal";
import DepartmentPageHeader from "@/features/department/components/DepartmentPageHeader";
import FilterSelect from "@/features/department/components/FilterSelect";
import type { TaskPriority } from "@/features/department/types/department.type";
import type {
  DepartmentTaskConfig,
  DepartmentTaskDetail,
  DepartmentTaskItem,
  DepartmentTaskMember,
} from "@/features/department/types/department-task.type";
import {
  PRIORITIES,
  formatDue,
  priorityTone,
} from "@/features/department/utils/department-task";
import {
  departmentTaskRules,
  type DepartmentTaskRules,
} from "@/features/department/utils/department-task-rules";
import { taskStatusColor } from "@/features/project/components/tasks/task-display";
import { toastApiError } from "@/features/project-template/utils/api-error";

type ViewMode = "list" | "board";
type QuickFilter = "all" | "overdue" | "atRisk" | "unassigned";

const QUICK_FILTERS: QuickFilter[] = ["all", "overdue", "atRisk", "unassigned"];
const FALLBACK_COLOR = "#94a3b8";

function quickMatchersFor(
  rules: DepartmentTaskRules,
): Record<QuickFilter, (task: DepartmentTaskItem) => boolean> {
  return {
    all: () => true,
    overdue: rules.isOverdue,
    atRisk: rules.isAtRisk,
    unassigned: (task) => task.assignee === null,
  };
}

export default function DepartmentTasksPage() {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<DepartmentTaskItem[]>([]);
  const [members, setMembers] = useState<DepartmentTaskMember[]>([]);
  const [config, setConfig] = useState<DepartmentTaskConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [detail, setDetail] = useState<DepartmentTaskDetail | null>(null);

  const rawTaskId = Number(searchParams.get("task"));
  const taskId =
    Number.isInteger(rawTaskId) && rawTaskId > 0 ? rawTaskId : null;
  const detailLoading = taskId !== null && detail?.id !== taskId;

  const load = useCallback(async () => {
    try {
      const [list, nextConfig] = await Promise.all([
        departmentTaskApi.list(),
        departmentTaskApi.getConfig(),
      ]);
      setTasks(list.data.tasks);
      setMembers(list.data.members);
      setConfig(nextConfig.data);
    } catch (error) {
      toastApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fetchDetail = useCallback(
    async (id: number) => {
      try {
        const response = await departmentTaskApi.get(id);
        setDetail(response.data);
      } catch (error) {
        toastApiError(error);
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (taskId === null || detail?.id === taskId) return;
    void fetchDetail(taskId);
  }, [taskId, detail?.id, fetchDetail]);

  const openTask = (id: number) => setSearchParams({ task: String(id) });

  const closeDetail = () => {
    setSearchParams({});
    void load();
  };

  const statuses = config?.statuses ?? [];
  const rules = departmentTaskRules(statuses);
  const { isOverdue, isAtRisk } = rules;
  const quickMatchers = quickMatchersFor(rules);
  const keyword = query.trim().toLowerCase();
  const visible = tasks.filter(
    (task) =>
      quickMatchers[quick](task) &&
      (priority === "all" || task.priority === priority) &&
      (assignee === "all" || task.assignee?.id === Number(assignee)) &&
      (!keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.code.toLowerCase().includes(keyword)),
  );

  const dueClass = (task: DepartmentTaskItem) =>
    isOverdue(task)
      ? "font-medium text-rose-500"
      : isAtRisk(task)
        ? "font-medium text-amber-600"
        : "text-slate-500";

  const changeStatus = async (task: DepartmentTaskItem, value: string) => {
    const statusId = Number(value);
    if (statusId === task.statusId) return;
    try {
      await departmentTaskApi.updateStatus(task.id, statusId);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, statusId } : item,
        ),
      );
    } catch (error) {
      toastApiError(error);
    }
  };

  const assigneeName = (task: DepartmentTaskItem) =>
    task.assignee?.name ?? null;

  const statusSelect = (task: DepartmentTaskItem) => {
    const current = statuses.find((status) => status.id === task.statusId);
    return (
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: current ? taskStatusColor(current) : FALLBACK_COLOR,
          }}
        />
        <FilterSelect
          value={String(task.statusId)}
          label={t("department.fields.status")}
          onChange={(value) => void changeStatus(task, value)}
        >
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </FilterSelect>
      </div>
    );
  };

  if (taskId !== null) {
    return (
      <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <DepartmentTaskDetailView
          task={detail?.id === taskId ? detail : null}
          loading={detailLoading}
          onBack={closeDetail}
          onEdit={() => setEditing(true)}
          onOpenTask={openTask}
          onDeleted={closeDetail}
          onUpdated={setDetail}
        />
        {detail && (
          <DepartmentTaskFormModal
            open={editing}
            task={detail}
            onClose={() => setEditing(false)}
            onSaved={() => {
              void fetchDetail(detail.id);
              void load();
            }}
          />
        )}
      </main>
    );
  }

  return (
    <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <DepartmentPageHeader
        icon={ClipboardList}
        title={t("department.tasks.title")}
        subtitle={t("department.tasks.subtitle")}
        actions={
          <>
            <button
              type="button"
              disabled={!config}
              onClick={() => setConfiguring(true)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Settings2 className="size-4" />
              {t("department.taskConfig.button")}
            </button>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="size-4" />
              {t("department.createTask.button")}
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_FILTERS.map((key) => {
          const count = tasks.filter(quickMatchers[key]).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setQuick(key)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
                quick === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {t(`department.tasks.quick.${key}`)}
              <span className="text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 sm:max-w-xs">
          <Search className="size-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("department.tasks.search")}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
        <FilterSelect
          value={assignee}
          label={t("department.tasks.allAssignees")}
          onChange={setAssignee}
        >
          <option value="all">{t("department.tasks.allAssignees")}</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={priority}
          label={t("department.tasks.allPriorities")}
          onChange={(value) => setPriority(value as "all" | TaskPriority)}
        >
          <option value="all">{t("department.tasks.allPriorities")}</option>
          {PRIORITIES.map((key) => (
            <option key={key} value={key}>
              {t(`pages.projects.tasks.priority.${key}`)}
            </option>
          ))}
        </FilterSelect>
        <div className="ml-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(
            [
              ["list", List],
              ["board", Columns3],
            ] as const
          ).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-label={t(`department.tasks.view.${key}`)}
              onClick={() => setView(key)}
              className={cn(
                "cursor-pointer rounded-md p-1.5",
                view === key
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:text-slate-700",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          {t("common.loading")}
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          {t("department.tasks.empty")}
        </p>
      ) : view === "list" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("department.tasks.columns.task")}</TableHead>
              <TableHead>{t("department.fields.priority")}</TableHead>
              <TableHead>{t("department.fields.assignees")}</TableHead>
              <TableHead>{t("pages.projects.tasks.form.startDate")}</TableHead>
              <TableHead>{t("department.fields.dueDate")}</TableHead>
              <TableHead>{t("department.fields.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="max-w-72">
                  <button
                    type="button"
                    onClick={() => openTask(task.id)}
                    className="block max-w-full cursor-pointer truncate text-left font-medium text-slate-800 hover:text-primary"
                  >
                    {task.title}
                  </button>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {task.code}
                  </p>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      priorityTone[task.priority],
                    )}
                  >
                    {t(`pages.projects.tasks.priority.${task.priority}`)}
                  </span>
                </TableCell>
                <TableCell className="text-slate-600">
                  {assigneeName(task) ?? (
                    <span className="text-xs text-slate-400">
                      {t("department.tasks.unassigned")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-slate-500">
                  {formatDue(task.startDate)}
                </TableCell>
                <TableCell className={dueClass(task)}>
                  {formatDue(task.dueDate)}
                  {isOverdue(task) && (
                    <span className="ml-1.5 text-[11px]">
                      {t("department.tasks.overdue")}
                    </span>
                  )}
                  {isAtRisk(task) && (
                    <span className="ml-1.5 text-[11px]">
                      {t("department.tasks.atRisk")}
                    </span>
                  )}
                </TableCell>
                <TableCell>{statusSelect(task)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {statuses.map((status) => {
            const column = visible.filter((task) => task.statusId === status.id);
            return (
              <section
                key={status.id}
                className="rounded-2xl bg-slate-100/70 p-3"
              >
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: status.color ?? FALLBACK_COLOR }}
                  />
                  {status.name}
                  <span className="text-xs font-medium text-slate-400">
                    {column.length}
                  </span>
                </h3>
                <ul className="space-y-2">
                  {column.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => openTask(task.id)}
                        className="cursor-pointer text-left text-sm font-medium text-slate-800 hover:text-primary"
                      >
                        {task.title}
                      </button>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-semibold",
                            priorityTone[task.priority],
                          )}
                        >
                          {t(`pages.projects.tasks.priority.${task.priority}`)}
                        </span>
                        <span className={dueClass(task)}>
                          {formatDue(task.dueDate)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-600">
                          {assigneeName(task) ?? t("department.tasks.unassigned")}
                        </span>
                        {statusSelect(task)}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {config && (
        <TaskConfigModal
          open={configuring}
          config={config}
          onClose={() => setConfiguring(false)}
          onSaved={(next) => {
            setConfig(next);
            void load();
          }}
        />
      )}

      <DepartmentTaskFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => void load()}
      />
    </main>
  );
}
