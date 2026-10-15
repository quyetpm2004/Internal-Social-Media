import { useEffect, useRef, useState } from "react";
import { Check, Filter, LayoutGrid, LayoutList, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  ProjectMemberItem,
  ProjectWorkflow,
  ProjectWorkflowTaskType,
} from "@/features/project/types/project.type";
import type { TaskView } from "@/features/project/types/task.type";
import { cn } from "@/lib/utils";

type TaskFiltersProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  workflowId: number | null;
  onWorkflowChange: (value: number | null) => void;
  taskTypeId: number | null;
  onTaskTypeChange: (value: number | null) => void;
  statusIds: number[];
  assigneeId: number | null;
  reporterId: number | null;
  reviewerId: number | null;
  onAssigneeChange: (value: number | null) => void;
  onReporterChange: (value: number | null) => void;
  onReviewerChange: (value: number | null) => void;
  onClearPeople: () => void;
  date: string;
  onDateChange: (value: string) => void;
  view: TaskView;
  onViewChange: (value: TaskView) => void;
  workflows: ProjectWorkflow[];
  taskTypes: ProjectWorkflowTaskType[];
  members: ProjectMemberItem[];
};

function toId(value: string) {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(-2).map((part) => part[0] ?? "");
  return letters.join("").toUpperCase() || "?";
}

export default function TaskFilters({
  keyword,
  onKeywordChange,
  workflowId,
  onWorkflowChange,
  taskTypeId,
  onTaskTypeChange,
  statusIds,
  assigneeId,
  reporterId,
  reviewerId,
  onAssigneeChange,
  onReporterChange,
  onReviewerChange,
  onClearPeople,
  date,
  onDateChange,
  view,
  onViewChange,
  workflows,
  taskTypes,
  members,
}: TaskFiltersProps) {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const activeWorkflows = workflows.filter((workflow) => workflow.isActive);
  const activeTypes = taskTypes.filter((taskType) => taskType.isActive);
  const visibleTypes = workflowId
    ? activeTypes.filter((taskType) => taskType.workflowId === workflowId)
    : activeTypes;

  const typeGroups = activeWorkflows
    .map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      types: activeTypes.filter((taskType) => taskType.workflowId === workflow.id),
    }))
    .filter((group) => group.types.length > 0);
  const ungroupedTypes = activeTypes.filter((taskType) => taskType.workflowId == null);

  const selectedWorkflow = activeWorkflows.find((workflow) => workflow.id === workflowId);
  const statusNames = (selectedWorkflow?.statuses ?? [])
    .filter((status) => statusIds.includes(status.id))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((status) => status.name);

  const selectedPeople = [
    assigneeId != null
      ? {
          id: "assignee",
          name: memberName(members, assigneeId),
          role: t("pages.projects.tasks.assignee"),
          onRemove: () => onAssigneeChange(null),
        }
      : null,
    reporterId != null
      ? {
          id: "reporter",
          name: memberName(members, reporterId),
          role: t("pages.projects.tasks.reporter"),
          onRemove: () => onReporterChange(null),
        }
      : null,
    reviewerId != null
      ? {
          id: "reviewer",
          name: memberName(members, reviewerId),
          role: t("pages.projects.tasks.reviewer"),
          onRemove: () => onReviewerChange(null),
        }
      : null,
  ].filter((item) => item != null);

  const conditionCount = selectedPeople.length + statusNames.length;

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filterOpen]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[220px] flex-1 space-y-1">
          <span className="sr-only">{t("pages.projects.tasks.search")}</span>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={t("pages.projects.tasks.search")}
              className="pl-9"
            />
          </div>
        </label>

        <label className="w-full space-y-1 sm:w-52">
          <span className="text-xs font-medium text-slate-500">
            {t("pages.projects.tasks.form.workflow")}
          </span>
          <Select
            value={workflowId ?? ""}
            onChange={(event) => onWorkflowChange(toId(event.target.value))}
          >
            <option value="">{t("pages.projects.tasks.allWorkflows")}</option>
            {activeWorkflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="w-full space-y-1 sm:w-52">
          <span className="text-xs font-medium text-slate-500">
            {t("pages.projects.tasks.form.taskType")}
          </span>
          <Select
            value={taskTypeId ?? ""}
            onChange={(event) => onTaskTypeChange(toId(event.target.value))}
          >
            <option value="">{t("pages.projects.tasks.allTypes")}</option>
            {workflowId ? (
              visibleTypes.map((taskType) => (
                <option key={taskType.id} value={taskType.id}>
                  {taskType.name}
                </option>
              ))
            ) : (
              <>
                {typeGroups.map((group) => (
                  <optgroup key={group.id} label={group.name}>
                    {group.types.map((taskType) => (
                      <option key={taskType.id} value={taskType.id}>
                        {taskType.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {ungroupedTypes.length > 0 && (
                  <optgroup label={t("pages.projects.tasks.ungroupedTypes")}>
                    {ungroupedTypes.map((taskType) => (
                      <option key={taskType.id} value={taskType.id}>
                        {taskType.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </>
            )}
          </Select>
        </label>

        <label className="w-full space-y-1 sm:w-40">
          <span className="text-xs font-medium text-slate-500">
            {t("pages.projects.tasks.date")}
          </span>
          <Input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </label>

        <div className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            aria-pressed={view === "table"}
            aria-label={t("pages.projects.tasks.tableView")}
            title={t("pages.projects.tasks.tableView")}
            onClick={() => onViewChange("table")}
            className={cn(
              "inline-flex size-8 cursor-pointer items-center justify-center rounded-md",
              view === "table"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            type="button"
            aria-pressed={view === "grid"}
            aria-label={t("pages.projects.tasks.gridView")}
            title={t("pages.projects.tasks.gridView")}
            onClick={() => onViewChange("grid")}
            className={cn(
              "inline-flex size-8 cursor-pointer items-center justify-center rounded-md",
              view === "grid"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div ref={filterRef} className="relative">
          <button
            type="button"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border bg-white px-3 text-sm font-medium",
              filterOpen || conditionCount > 0
                ? "border-primary text-primary"
                : "border-slate-200 text-slate-700 hover:bg-slate-50",
            )}
          >
            <Filter className="size-4" />
            {t("pages.projects.tasks.filter")}
            {conditionCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                {conditionCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute top-full left-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  {t("pages.projects.tasks.filterTitle")}
                </p>
                <button
                  type="button"
                  disabled={selectedPeople.length === 0}
                  onClick={onClearPeople}
                  className="cursor-pointer text-sm font-medium text-primary disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {t("pages.projects.tasks.clearAll")}
                </button>
              </div>
              <div className="mt-3 space-y-4">
                <PersonSection
                  label={t("pages.projects.tasks.assignee")}
                  value={assigneeId}
                  members={members}
                  onChange={onAssigneeChange}
                />
                <PersonSection
                  label={t("pages.projects.tasks.reporter")}
                  value={reporterId}
                  members={members}
                  onChange={onReporterChange}
                />
                <PersonSection
                  label={t("pages.projects.tasks.reviewer")}
                  value={reviewerId}
                  members={members}
                  onChange={onReviewerChange}
                />
              </div>
            </div>
          )}
        </div>

        {selectedPeople.map((person) => (
          <span
            key={person.id}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            {person.name}
            <span className="text-slate-400">({person.role})</span>
            <button
              type="button"
              aria-label={person.role}
              onClick={person.onRemove}
              className="cursor-pointer rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function memberName(members: ProjectMemberItem[], userId: number) {
  return members.find((member) => member.userId === userId)?.fullName ?? `#${userId}`;
}

function PersonSection({
  label,
  value,
  members,
  onChange,
}: {
  label: string;
  value: number | null;
  members: ProjectMemberItem[];
  onChange: (value: number | null) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? members.filter((member) => member.fullName.toLowerCase().includes(needle))
    : members;

  return (
    <section>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("pages.projects.tasks.searchMember")}
          className="h-9 pl-9"
        />
      </div>
      <ul className="mt-1 max-h-[6.75rem] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((member) => {
          const selected = value === member.userId;
          return (
            <li key={member.userId}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(selected ? null : member.userId)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                  selected ? "bg-primary/5 text-slate-900" : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <Avatar size="sm">
                  {member.avatarUrl ? (
                    <AvatarImage src={member.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback>{initials(member.fullName)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate">{member.fullName}</span>
                {selected && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="px-2 py-2 text-sm text-slate-400">
            {t("pages.projects.tasks.noMember")}
          </li>
        )}
      </ul>
    </section>
  );
}
