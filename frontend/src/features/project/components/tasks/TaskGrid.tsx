import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AssigneeNames,
  StatusChip,
} from "@/features/project/components/tasks/TaskTable";
import {
  formatTaskCreated,
  priorityBadgeClass,
  taskStatusColor,
} from "@/features/project/components/tasks/task-display";
import { formatProjectDate } from "@/features/project/utils/project-date";
import type { TaskListItem } from "@/features/project/types/task.type";

type TaskGridProps = {
  tasks: TaskListItem[];
  language: string;
  onOpen: (taskId: number) => void;
};

export default function TaskGrid({ tasks, language, onOpen }: TaskGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => onOpen(task.id)}
          className="flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-primary/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400">{task.code}</p>
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900">
                {task.title}
              </h3>
            </div>
            <StatusChip
              name={task.status.name}
              color={taskStatusColor(task.status)}
            />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <Fact
              label={t("pages.projects.tasks.columns.type")}
              value={task.taskType.name}
            />
            <Fact
              label={t("pages.projects.tasks.columns.workflow")}
              value={task.workflow.name}
            />
            <Fact
              label={t("pages.projects.tasks.columns.priority")}
              value={
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadgeClass[task.priority]}`}
                >
                  {t(`pages.projects.tasks.priority.${task.priority}`)}
                </span>
              }
            />
            <Fact
              label={t("pages.projects.tasks.columns.due")}
              value={
                task.dueDate ? formatProjectDate(task.dueDate, language) : "—"
              }
            />
            <Fact
              label={t("pages.projects.tasks.columns.created")}
              value={formatTaskCreated(task.createdAt, language)}
            />
            <div className="col-span-2">
              <dt className="text-xs text-slate-400">
                {t("pages.projects.tasks.columns.assignee")}
              </dt>
              <dd className="mt-0.5 text-slate-800">
                <AssigneeNames assignees={task.assignees} />
              </dd>
            </div>
          </dl>

          {task.childCount > 0 && (
            <p className="mt-3 text-xs font-medium text-slate-500">
              {t("pages.projects.tasks.childCount", { count: task.childCount })}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  );
}
