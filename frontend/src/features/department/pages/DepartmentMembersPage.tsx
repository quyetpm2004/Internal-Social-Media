import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import DashboardCard from "@/components/shared/dashboard/DashboardCard";
import Pagination, {
  type PaginationData,
} from "@/components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import Modal from "@/components/shared/Modal";
import { departmentMemberApi } from "@/features/department/api/department-member.api";
import MemberFormModal from "@/features/department/components/MemberFormModal";
import DepartmentPageHeader from "@/features/department/components/DepartmentPageHeader";
import FilterSelect from "@/features/department/components/FilterSelect";
import MemberAvatar from "@/features/department/components/MemberAvatar";
import type {
  AddMemberPayload,
  DepartmentMemberItem,
  DepartmentMemberTask,
  DepartmentProjectOption,
  MemberPosition,
  MemberSortDirection,
  MemberSortKey,
} from "@/features/department/types/department-member.type";
import { loadTone } from "@/features/department/utils/department-metrics";
import {
  formatDue,
  priorityTone,
  scoreBadge,
} from "@/features/department/utils/department-task";

type ViewMode = "table" | "cards";

const SORT_KEYS: MemberSortKey[] = ["default", "kpi", "load", "overdue"];
const PAGE_SIZE = 10;
const TASK_PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 400;

function errorMessageOf(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

function LoadBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, percent)}%`,
            backgroundColor: loadTone(percent),
          }}
        />
      </div>
      <span className="w-9 text-xs text-slate-500">{percent}%</span>
    </div>
  );
}

export default function DepartmentMembersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [members, setMembers] = useState<DepartmentMemberItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [departmentName, setDepartmentName] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [positions, setPositions] = useState<MemberPosition[]>([]);
  const [projects, setProjects] = useState<DepartmentProjectOption[]>([]);

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sortKey, setSortKey] = useState<MemberSortKey>("default");
  const [sortDirection, setSortDirection] =
    useState<MemberSortDirection>("desc");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");

  const [selected, setSelected] = useState<DepartmentMemberItem | null>(null);
  const [tasks, setTasks] = useState<DepartmentMemberTask[]>([]);
  const [taskPagination, setTaskPagination] = useState<PaginationData | null>(
    null,
  );
  const [taskPage, setTaskPage] = useState(1);
  const [loadedTasksKey, setLoadedTasksKey] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentMemberItem | null>(null);
  const [removing, setRemoving] = useState<DepartmentMemberItem | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    departmentMemberApi
      .listPositions()
      .then((res) => setPositions(res.data))
      .catch(() => setPositions([]));
  }, []);

  useEffect(() => {
    departmentMemberApi
      .listProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
  }, [reloadKey]);

  const listKey = [
    page,
    search,
    projectId,
    sortKey,
    sortDirection,
    reloadKey,
  ].join("|");
  const loading = loadedKey !== listKey;

  useEffect(() => {
    let cancelled = false;
    departmentMemberApi
      .list({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        projectId: projectId ? Number(projectId) : undefined,
        sort: sortKey,
        direction: sortDirection,
      })
      .then((res) => {
        if (cancelled) return;
        setMembers(res.data.items);
        setPagination(res.data.pagination);
        setDepartmentName(res.data.department.name);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            errorMessageOf(error, t("department.members.loadFailed")),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(listKey);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, projectId, sortKey, sortDirection, reloadKey, listKey, t]);

  const selectedId = selected?.id ?? null;
  const tasksKey = [selectedId, taskPage, projectId, reloadKey].join("|");
  const tasksLoading = selectedId !== null && loadedTasksKey !== tasksKey;

  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    departmentMemberApi
      .listTasks(selectedId, {
        page: taskPage,
        limit: TASK_PAGE_SIZE,
        projectId: projectId ? Number(projectId) : undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setTasks(res.data.items);
        setTaskPagination(res.data.pagination);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            errorMessageOf(error, t("department.members.loadFailed")),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedTasksKey(tasksKey);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, taskPage, projectId, reloadKey, tasksKey, t]);

  const selectMember = (member: DepartmentMemberItem | null) => {
    setSelected(member);
    setTaskPage(1);
    setTasks([]);
    setTaskPagination(null);
  };

  const changeProject = (value: string) => {
    setProjectId(value);
    setPage(1);
    setTaskPage(1);
  };

  const changeSort = (value: MemberSortKey) => {
    setSortKey(value);
    setPage(1);
  };

  const toggleDirection = () => {
    setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (member: DepartmentMemberItem) => {
    setEditing(member);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: AddMemberPayload) => {
    try {
      if (editing) {
        await departmentMemberApi.update(editing.id, {
          positionId: payload.positionId,
        });
        toast.success(t("department.memberForm.updated"));
      } else {
        await departmentMemberApi.add(payload);
        toast.success(t("department.memberForm.added"));
      }
      setFormOpen(false);
      reload();
    } catch (error) {
      toast.error(errorMessageOf(error, t("department.members.actionFailed")));
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await departmentMemberApi.remove(removing.id);
      if (selectedId === removing.id) selectMember(null);
      if (members.length === 1 && page > 1) setPage(page - 1);
      toast.success(t("department.memberForm.removed"));
      setRemoving(null);
      reload();
    } catch (error) {
      toast.error(errorMessageOf(error, t("department.members.actionFailed")));
    }
  };

  const renderActions = (member: DepartmentMemberItem) => (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        title={t("department.members.edit")}
        aria-label={t("department.members.edit")}
        onClick={(event) => {
          event.stopPropagation();
          openEdit(member);
        }}
        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        disabled={member.isLeader}
        title={
          member.isLeader
            ? t("department.members.leaderLocked")
            : t("department.members.remove")
        }
        aria-label={t("department.members.remove")}
        onClick={(event) => {
          event.stopPropagation();
          setRemoving(member);
        }}
        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );

  const renderScore = (member: DepartmentMemberItem) =>
    member.score === null ? (
      "—"
    ) : (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          scoreBadge(member.score),
        )}
      >
        {member.score}
      </span>
    );

  return (
    <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <DepartmentPageHeader
        icon={Users}
        title={t("department.members.title")}
        subtitle={t("department.members.subtitle", {
          name: departmentName,
          count: pagination?.total ?? 0,
        })}
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {t("department.members.add")}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 sm:max-w-xs">
          <Search className="size-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("department.members.search")}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
        <FilterSelect
          value={projectId}
          label={t("department.members.projectFilter")}
          showLabel
          onChange={changeProject}
        >
          <option value="">{t("department.members.allProjects")}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={sortKey}
          label={t("department.members.sortBy")}
          showLabel
          onChange={(value) => changeSort(value as MemberSortKey)}
        >
          {SORT_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`department.members.sort.${key}`)}
            </option>
          ))}
        </FilterSelect>
        {sortKey !== "default" && (
          <button
            type="button"
            title={t(`department.members.direction.${sortDirection}`)}
            aria-label={t(`department.members.direction.${sortDirection}`)}
            onClick={toggleDirection}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            {sortDirection === "desc" ? (
              <ArrowDownWideNarrow className="size-4" />
            ) : (
              <ArrowUpNarrowWide className="size-4" />
            )}
            {t(`department.members.direction.${sortDirection}`)}
          </button>
        )}
        <div className="ml-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(
            [
              ["table", List],
              ["cards", LayoutGrid],
            ] as const
          ).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-label={t(`department.members.view.${key}`)}
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

      <div
        className={cn(
          "grid gap-4",
          selected && "@4xl:grid-cols-[minmax(0,1fr)_20rem]",
        )}
      >
        <div className={cn("min-w-0", loading && "opacity-60")}>
          {members.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
              {loading ? t("common.loading") : t("department.members.empty")}
            </p>
          ) : view === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("department.members.columns.member")}
                  </TableHead>
                  <TableHead>{t("department.members.columns.role")}</TableHead>
                  <TableHead className="text-right">
                    {t("department.members.columns.open")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("department.members.columns.overdue")}
                  </TableHead>
                  <TableHead>{t("department.members.columns.load")}</TableHead>
                  <TableHead className="text-right">
                    {t("department.members.columns.kpi")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("department.members.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    onClick={() => selectMember(member)}
                    className={cn(
                      "cursor-pointer",
                      selectedId === member.id && "bg-primary/5",
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar id={member.id} name={member.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {member.position?.name ?? "—"}
                      {member.isLeader && (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          {t("department.role.LEADER")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {member.workload.open}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        member.workload.overdue > 0
                          ? "font-semibold text-rose-600"
                          : "text-slate-600",
                      )}
                    >
                      {member.workload.overdue}
                    </TableCell>
                    <TableCell>
                      <LoadBar percent={member.workload.loadPercent} />
                    </TableCell>
                    <TableCell className="text-right">
                      {renderScore(member)}
                    </TableCell>
                    <TableCell>{renderActions(member)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => selectMember(member)}
                  className={cn(
                    "cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/40",
                    selectedId === member.id
                      ? "border-primary"
                      : "border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <MemberAvatar
                      id={member.id}
                      name={member.name}
                      className="size-10 text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {member.position?.name ?? "—"}
                      </p>
                    </div>
                    {member.isLeader && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {t("department.role.LEADER")}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {member.workload.open}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t("department.members.columns.open")}
                      </p>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-lg font-bold",
                          member.workload.overdue > 0
                            ? "text-rose-600"
                            : "text-slate-900",
                        )}
                      >
                        {member.workload.overdue}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t("department.members.columns.overdue")}
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {member.score ?? "—"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t("department.members.columns.kpi")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <LoadBar percent={member.workload.loadPercent} />
                    {renderActions(member)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {pagination && pagination.total > 0 && (
            <Pagination pagination={pagination} onPageChange={setPage} />
          )}
        </div>

        {selected && (
          <DashboardCard
            title={selected.name}
            className="h-fit"
            extra={
              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => selectMember(null)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            }
          >
            <p className="text-xs text-slate-500">
              {selected.position?.name ?? "—"} · {selected.email}
            </p>
            {selected.workload.projects.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {selected.workload.projects.map((project) => (
                  <li
                    key={project.id}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                  >
                    {project.name} · {project.open}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {t("department.members.currentTasks", {
                count: taskPagination?.total ?? selected.workload.open,
              })}
            </p>
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                {tasksLoading
                  ? t("common.loading")
                  : t("department.members.noTasks")}
              </p>
            ) : (
              <ul
                className={cn(
                  "mt-2 divide-y divide-slate-100",
                  tasksLoading && "opacity-60",
                )}
              >
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    onClick={() =>
                      navigate(
                        task.project
                          ? `/projects/${task.project.id}?tab=tasks&task=${task.id}`
                          : `/work/department/tasks?task=${task.id}`,
                      )
                    }
                    className="-mx-2 cursor-pointer rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <p className="truncate text-sm font-medium text-slate-800">
                      {task.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {task.code}
                      {task.project ? ` · ${task.project.name}` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-semibold",
                          priorityTone[task.priority],
                        )}
                      >
                        {t(`pages.projects.tasks.priority.${task.priority}`)}
                      </span>
                      <span
                        className={
                          task.isOverdue
                            ? "font-medium text-rose-500"
                            : "text-slate-400"
                        }
                      >
                        {formatDue(task.dueDate)}
                      </span>
                      <span className="ml-auto truncate text-slate-400">
                        {task.status.name}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {taskPagination && taskPagination.totalPages > 1 && (
              <div className="mt-3 flex items-center justify-end gap-1">
                <button
                  type="button"
                  disabled={taskPagination.page <= 1}
                  onClick={() => setTaskPage(taskPagination.page - 1)}
                  aria-label={t("common.pagination.previous")}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from(
                  { length: taskPagination.totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-label={t("common.pagination.page", {
                      page: pageNumber,
                    })}
                    aria-current={
                      pageNumber === taskPagination.page ? "page" : undefined
                    }
                    onClick={() => setTaskPage(pageNumber)}
                    className={cn(
                      "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                      pageNumber === taskPagination.page
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={taskPagination.page >= taskPagination.totalPages}
                  onClick={() => setTaskPage(taskPagination.page + 1)}
                  aria-label={t("common.pagination.next")}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </DashboardCard>
        )}
      </div>

      <MemberFormModal
        open={formOpen}
        member={editing}
        positions={positions}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={t("department.members.removeTitle")}
        description={t("department.members.removeDescription", {
          name: removing?.name ?? "",
        })}
        variant="danger"
        confirmText={t("common.delete")}
        onConfirm={handleRemove}
      />
    </main>
  );
}
