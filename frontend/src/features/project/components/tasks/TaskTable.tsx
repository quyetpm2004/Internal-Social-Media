import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  formatTaskCreated,
  priorityBadgeClass,
  taskStatusColor,
} from "@/features/project/components/tasks/task-display";
import { formatProjectDate } from "@/features/project/utils/project-date";
import type { TaskListItem } from "@/features/project/types/task.type";

type TaskTableProps = {
  tasks: TaskListItem[];
  language: string;
  onOpen: (taskId: number) => void;
};

export default function TaskTable({
  tasks,
  language,
  onOpen,
}: TaskTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-[920px] w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3">{t("pages.projects.tasks.columns.title")}</th>
            <th className="px-3 py-3">{t("pages.projects.tasks.columns.type")}</th>
            <th className="px-3 py-3">{t("pages.projects.tasks.columns.workflow")}</th>
            <th className="px-3 py-3">{t("pages.projects.tasks.columns.status")}</th>
            <th className="px-3 py-3">{t("pages.projects.tasks.columns.assignee")}</th>
            <th className="px-3 py-3">{t("pages.projects.tasks.columns.priority")}</th>
            <th className="px-3 py-3">{t("pages.projects.tasks.columns.due")}</th>
            <th className="px-3 py-3">{t("pages.projects.tasks.columns.created")}</th>
            <th className="px-3 py-3">
              <span className="sr-only">{t("pages.projects.membersPanel.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onOpen(task.id)}
              className="cursor-pointer hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{task.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{task.code}</p>
                {task.parent && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    {t("pages.projects.tasks.parentCode", {
                      code: task.parent.code,
                    })}
                  </p>
                )}
              </td>
              <td className="px-3 py-3 text-slate-700">{task.taskType.name}</td>
              <td className="px-3 py-3 text-slate-700">{task.workflow.name}</td>
              <td className="px-3 py-3">
                <StatusChip name={task.status.name} color={taskStatusColor(task.status)} />
              </td>
              <td className="px-3 py-3 text-slate-700">
                <AssigneeNames assignees={task.assignees} />
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadgeClass[task.priority]}`}
                >
                  {t(`pages.projects.tasks.priority.${task.priority}`)}
                </span>
              </td>
              <td className="px-3 py-3 text-slate-700">
                {task.dueDate ? formatProjectDate(task.dueDate, language) : "—"}
              </td>
              <td className="px-3 py-3 text-slate-700">
                {formatTaskCreated(task.createdAt, language)}
              </td>
              <td className="px-3 py-3">
                {task.canEdit && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(task.id);
                    }}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    aria-label={t("pages.projects.tasks.form.editTitle")}
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

export function AssigneeNames({
  assignees,
}: {
  assignees: TaskListItem["assignees"];
}) {
  if (assignees.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <span>
      {assignees
        .map((assignee) => `${assignee.fullName} · ${assignee.projectRole.name}`)
        .join(", ")}
    </span>
  );
}
