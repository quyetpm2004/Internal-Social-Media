import { useState } from "react";
import {
  ClipboardList,
  Columns3,
  List,
  Plus,
  Repeat,
  Search,
  Settings2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import CreateTaskModal from "@/features/department/components/CreateTaskModal";
import TaskConfigModal from "@/features/department/components/TaskConfigModal";
import DepartmentPageHeader from "@/features/department/components/DepartmentPageHeader";
import FilterSelect from "@/features/department/components/FilterSelect";
import MemberAvatar from "@/features/department/components/MemberAvatar";
import { useDepartmentStore } from "@/features/department/store/department.store";
import type {
  DepartmentMember,
  DepartmentTask,
  TaskPriority,
} from "@/features/department/types/department.type";
import {
  PRIORITIES,
  formatDue,
  priorityTone,
  taskRules,
  type TaskRules,
} from "@/features/department/utils/department-task";

type ViewMode = "list" | "board";
type QuickFilter = "all" | "overdue" | "atRisk" | "recurring" | "unassigned";

const QUICK_FILTERS: QuickFilter[] = [
  "all",
  "overdue",
  "atRisk",
  "recurring",
  "unassigned",
];

function quickMatchersFor(
  rules: TaskRules,
): Record<QuickFilter, (task: DepartmentTask) => boolean> {
  return {
    all: () => true,
    overdue: rules.isOverdue,
    atRisk: rules.isAtRisk,
    recurring: (task) => task.recurrence !== "NONE",
    unassigned: (task) => task.assigneeIds.length === 0,
  };
}

function AssigneeStack({
  ids,
  members,
}: {
  ids: number[];
  members: DepartmentMember[];
}) {
  const { t } = useTranslation();
  const people = members.filter((member) => ids.includes(member.id));

  if (people.length === 0) {
    return (
      <span className="text-xs text-slate-400">
        {t("department.tasks.unassigned")}
      </span>
    );
  }

  return (
    <div className="flex -space-x-2">
      {people.slice(0, 3).map((member) => (
        <MemberAvatar
          key={member.id}
          id={member.id}
          name={member.name}
          className="size-7 text-[10px] ring-2 ring-white"
        />
      ))}
      {people.length > 3 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
          +{people.length - 3}
        </span>
      )}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-xs text-slate-500">{value}%</span>
    </div>
  );
}

export default function DepartmentTasksPage() {
  const { t } = useTranslation();
  const members = useDepartmentStore((state) => state.members);
  const tasks = useDepartmentStore((state) => state.tasks);
  const addTask = useDepartmentStore((state) => state.addTask);
  const updateStatus = useDepartmentStore((state) => state.updateStatus);
  const statuses = useDepartmentStore((state) => state.statuses);

  const [view, setView] = useState<ViewMode>("list");
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [creating, setCreating] = useState(false);
  const [configuring, setConfiguring] = useState(false);

  const rules = taskRules(statuses);
  const { isOverdue, isAtRisk } = rules;
  const quickMatchers = quickMatchersFor(rules);
  const keyword = query.trim().toLowerCase();
  const visible = tasks.filter(
    (task) =>
      quickMatchers[quick](task) &&
      (priority === "all" || task.priority === priority) &&
      (assignee === "all" || task.assigneeIds.includes(Number(assignee))) &&
      (!keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.code.toLowerCase().includes(keyword)),
  );

  const reviewerNames = (ids: number[]) =>
    members
      .filter((member) => ids.includes(member.id))
      .map((member) => member.name)
      .join(", ") || "—";

  const colorOf = (statusId: string) =>
    statuses.find((status) => status.id === statusId)?.color ?? "#94a3b8";

  const dueClass = (task: DepartmentTask) =>
    isOverdue(task)
      ? "font-medium text-rose-500"
      : isAtRisk(task)
        ? "font-medium text-amber-600"
        : "text-slate-500";

  const statusSelect = (task: DepartmentTask) => (
    <FilterSelect
      value={task.statusId}
      label={t("department.fields.status")}
      onChange={(value) => updateStatus(task.id, value)}
    >
      {statuses.map((status) => (
        <option key={status.id} value={status.id}>
          {status.name}
        </option>
      ))}
    </FilterSelect>
  );

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
              onClick={() => setConfiguring(true)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
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

      {visible.length === 0 ? (
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
              <TableHead>{t("department.fields.reviewer")}</TableHead>
              <TableHead>{t("department.fields.dueDate")}</TableHead>
              <TableHead>{t("department.tasks.columns.progress")}</TableHead>
              <TableHead>{t("department.fields.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="max-w-72">
                  <p className="truncate font-medium text-slate-800">
                    {task.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400">
                    {task.code}
                    {task.recurrence !== "NONE" && (
                      <span className="inline-flex items-center gap-1 text-violet-600">
                        <Repeat className="size-3" />
                        {t(`department.recurrence.${task.recurrence}`)}
                      </span>
                    )}
                    {task.project && <span>· {task.project}</span>}
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
                <TableCell>
                  <AssigneeStack ids={task.assigneeIds} members={members} />
                </TableCell>
                <TableCell className="text-slate-600">
                  {reviewerNames(task.reviewerIds)}
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
                <TableCell>
                  <ProgressBar value={task.progress} color={colorOf(task.statusId)} />
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
                    style={{ backgroundColor: status.color }}
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
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {task.title}
                        </p>
                        {task.recurrence !== "NONE" && (
                          <Repeat className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                        )}
                      </div>
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
                        <AssigneeStack
                          ids={task.assigneeIds}
                          members={members}
                        />
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

      <TaskConfigModal
        open={configuring}
        onClose={() => setConfiguring(false)}
      />

      <CreateTaskModal
        open={creating}
        members={members}
        onClose={() => setCreating(false)}
        onSubmit={addTask}
      />
    </main>
  );
}
