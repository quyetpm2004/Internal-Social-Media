import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Pagination from "@/components/shared/Pagination";
import { projectApi } from "@/features/project/api/project.api";
import TaskDetailView from "@/features/project/components/tasks/TaskDetailView";
import TaskFilters from "@/features/project/components/tasks/TaskFilters";
import TaskFormModal from "@/features/project/components/tasks/TaskFormModal";
import TaskGrid from "@/features/project/components/tasks/TaskGrid";
import TaskStatusBar from "@/features/project/components/tasks/TaskStatusBar";
import TaskTable from "@/features/project/components/tasks/TaskTable";
import type {
  ProjectMemberItem,
  ProjectWorkflow,
  ProjectWorkflowRole,
  ProjectWorkflowTaskType,
} from "@/features/project/types/project.type";
import type {
  TaskDetail,
  TaskListItem,
  TaskListSummary,
  TaskView,
} from "@/features/project/types/task.type";
import type { Pagination as PaginationData } from "@/features/admin/types/admin.type";
import {
  getApiErrorMessages,
  toastApiError,
} from "@/features/project-template/utils/api-error";
import { taskTypeMatchesWorkflow } from "@/features/project/utils/task-type-workflow";
import { useAuthStore } from "@/features/auth/store/auth.store";

type ProjectTasksPanelProps = {
  projectId: number;
  createSignal: number;
};

type Filters = {
  workflowId: number | null;
  taskTypeId: number | null;
  statusIds: number[];
  assigneeId: number | null;
  reporterId: number | null;
  reviewerId: number | null;
  date: string;
};

const EMPTY_FILTERS: Filters = {
  workflowId: null,
  taskTypeId: null,
  statusIds: [],
  assigneeId: null,
  reporterId: null,
  reviewerId: null,
  date: "",
};

export default function ProjectTasksPanel({
  projectId,
  createSignal,
}: ProjectTasksPanelProps) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const taskParam = Number(searchParams.get("task"));
  const taskFromUrl =
    Number.isInteger(taskParam) && taskParam > 0 ? taskParam : null;
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<TaskView>("table");
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [summary, setSummary] = useState<TaskListSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [workflows, setWorkflows] = useState<ProjectWorkflow[]>([]);
  const [taskTypes, setTaskTypes] = useState<ProjectWorkflowTaskType[]>([]);
  const [roles, setRoles] = useState<ProjectWorkflowRole[]>([]);
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);

  const [viewingId, setViewingId] = useState<number | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [editor, setEditor] = useState<number | "create" | null>(null);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const seenSignal = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = keywordInput.trim();
      setKeyword((current) => (current === next ? current : next));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    const loadContext = async () => {
      setContextLoading(true);
      try {
        const [workflowResponse, memberResponse] = await Promise.all([
          projectApi.getWorkflows(projectId),
          projectApi.getMembers(projectId, { limit: 50 }),
        ]);
        if (cancelled) return;
        setWorkflows(workflowResponse.data.workflows);
        setTaskTypes(workflowResponse.data.taskTypes ?? []);
        setRoles(workflowResponse.data.projectRoles);
        setMembers(memberResponse.data.members);
        setCanCreate(memberResponse.data.myRoles.length > 0);
      } catch (error) {
        if (!cancelled) toastApiError(error);
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    };
    loadContext();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    const loadTasks = async () => {
      setLoading(true);
      try {
        const response = await projectApi.getTasks(projectId, {
          page,
          limit: 10,
          keyword: keyword || undefined,
          workflowId: filters.workflowId ?? undefined,
          taskTypeId: filters.taskTypeId ?? undefined,
          statusIds: filters.statusIds,
          assigneeId: filters.assigneeId ?? undefined,
          reporterId: filters.reporterId ?? undefined,
          reviewerId: filters.reviewerId ?? undefined,
          date: filters.date || undefined,
        });
        if (cancelled) return;
        setTasks(response.data.tasks);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
        setListError("");
      } catch (error) {
        if (cancelled) return;
        setTasks([]);
        setSummary(null);
        setPagination(null);
        const message = getApiErrorMessages(error)[0];
        setListError(
          message && message !== "Unexpected error"
            ? message
            : t("pages.projects.tasks.loadFailed"),
        );
        toastApiError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    page,
    keyword,
    filters,
    reloadKey,
    t,
  ]);

  useEffect(() => {
    if (taskFromUrl != null) setViewingId(taskFromUrl);
  }, [taskFromUrl]);

  const clearTaskQuery = () => {
    if (!searchParams.get("task")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("task");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (viewingId == null) {
      if (editor == null || editor === "create") {
        setDetail(null);
        setDetailLoading(false);
      }
      return;
    }
    let cancelled = false;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const response = await projectApi.getTask(projectId, viewingId);
        if (!cancelled) setDetail(response.data);
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          setViewingId(null);
          clearTaskQuery();
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [viewingId, editor, projectId, detailVersion]);

  useEffect(() => {
    if (createSignal === 0 || createSignal === seenSignal.current) return;
    if (contextLoading) return;
    seenSignal.current = createSignal;
    if (!canCreate) {
      toast.error(t("pages.projects.tasks.notMember"));
      return;
    }
    setViewingId(null);
    setEditor("create");
  }, [createSignal, contextLoading, canCreate, t]);

  const people = useMemo(() => {
    const seen = new Set<number>();
    return members.filter((member) => {
      if (seen.has(member.userId)) return false;
      seen.add(member.userId);
      return true;
    });
  }, [members]);

  const filtersActive =
    Boolean(keyword) ||
    filters.workflowId != null ||
    filters.taskTypeId != null ||
    filters.statusIds.length > 0 ||
    filters.assigneeId != null ||
    filters.reporterId != null ||
    filters.reviewerId != null ||
    Boolean(filters.date);

  const updateFilters = (partial: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...partial }));
    setPage(1);
  };

  const handleWorkflowChange = (workflowId: number | null) => {
    setFilters((current) => {
      const type = taskTypes.find((item) => item.id === current.taskTypeId);
      const workflow = workflows.find((item) => item.id === workflowId);
      const typeStillValid =
        workflowId == null ||
        (type != null && taskTypeMatchesWorkflow(type, workflow));
      return {
        ...current,
        workflowId,
        statusIds: [],
        taskTypeId: typeStillValid ? current.taskTypeId : null,
      };
    });
    setPage(1);
  };

  const clearFilters = () => {
    setKeywordInput("");
    setKeyword("");
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <section className="space-y-4">
      {viewingId != null ? (
        <TaskDetailView
          key={viewingId}
          projectId={projectId}
          task={detail?.id === viewingId ? detail : null}
          loading={detail?.id !== viewingId}
          canComment={canCreate}
          onBack={() => {
            setViewingId(null);
            setEditor(null);
            setDetail(null);
            clearTaskQuery();
          }}
          onEdit={() => {
            if (viewingId != null) setEditor(viewingId);
          }}
          onOpenTask={(taskId) => setViewingId(taskId)}
          onDeleted={() => {
            setViewingId(null);
            setEditor(null);
            setDetail(null);
            setReloadKey((value) => value + 1);
          }}
          onUpdated={(task) => {
            setDetail(task);
            setReloadKey((value) => value + 1);
          }}
        />
      ) : (
      <>
      <TaskFilters
        keyword={keywordInput}
        onKeywordChange={setKeywordInput}
        workflowId={filters.workflowId}
        onWorkflowChange={handleWorkflowChange}
        taskTypeId={filters.taskTypeId}
        onTaskTypeChange={(taskTypeId) => updateFilters({ taskTypeId })}
        statusIds={filters.statusIds}
        assigneeId={filters.assigneeId}
        reporterId={filters.reporterId}
        reviewerId={filters.reviewerId}
        onAssigneeChange={(assigneeId) => updateFilters({ assigneeId })}
        onReporterChange={(reporterId) => updateFilters({ reporterId })}
        onReviewerChange={(reviewerId) => updateFilters({ reviewerId })}
        onClearPeople={() =>
          updateFilters({
            assigneeId: null,
            reporterId: null,
            reviewerId: null,
          })
        }
        date={filters.date}
        onDateChange={(date) => updateFilters({ date })}
        view={view}
        onViewChange={setView}
        workflows={workflows}
        taskTypes={taskTypes}
        members={people}
      />

      <TaskStatusBar
        workflowId={filters.workflowId}
        statusIds={filters.statusIds}
        summary={summary}
        onStatusToggle={(statusId) => {
          setFilters((current) => ({
            ...current,
            statusIds: current.statusIds.includes(statusId)
              ? current.statusIds.filter((id) => id !== statusId)
              : [...current.statusIds, statusId],
          }));
          setPage(1);
        }}
        onWorkflowPick={(workflowId) => handleWorkflowChange(workflowId)}
      />

      {listError && tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-600">{listError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-3 cursor-pointer text-sm font-semibold text-primary"
          >
            {t("pages.projects.tasks.retry")}
          </button>
        </div>
      ) : loading && tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          {t("common.processing")}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-800">
            {filtersActive
              ? t("pages.projects.tasks.noMatch")
              : t("pages.projects.tasks.empty")}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 cursor-pointer text-sm font-semibold text-primary"
            >
              {t("pages.projects.tasks.clearFilters")}
            </button>
          )}
        </div>
      ) : view === "table" ? (
        <TaskTable
          tasks={tasks}
          language={i18n.language}
          onOpen={(taskId) => setViewingId(taskId)}
        />
      ) : (
        <TaskGrid
          tasks={tasks}
          language={i18n.language}
          onOpen={(taskId) => setViewingId(taskId)}
        />
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}
      </>
      )}

      <TaskFormModal
        open={editor != null}
        projectId={projectId}
        mode={editor === "create" ? "create" : "detail"}
        detail={detail}
        loadingDetail={detailLoading}
        workflows={workflows}
        taskTypes={taskTypes}
        roles={roles}
        members={people}
        currentUserId={currentUserId}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setReloadKey((value) => value + 1);
          setDetailVersion((value) => value + 1);
        }}
        onReloadDetail={async () => {
          const taskId = typeof editor === "number" ? editor : viewingId;
          if (taskId == null) return;
          const response = await projectApi.getTask(projectId, taskId);
          setDetail(response.data);
        }}
      />
    </section>
  );
}
