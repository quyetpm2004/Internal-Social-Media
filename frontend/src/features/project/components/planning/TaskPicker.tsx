import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { taskStatusColor } from "@/features/project/components/tasks/task-display";
import type { PlanningTask } from "@/features/project/types/planning.type";

type TaskPickerProps = {
  tasks: PlanningTask[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
  emptyLabel: string;
};

export default function TaskPicker({
  tasks,
  selectedIds,
  onChange,
  loading = false,
  emptyLabel,
}: TaskPickerProps) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const groups = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (!query) return true;
      return (
        task.title.toLowerCase().includes(query) ||
        task.code.toLowerCase().includes(query)
      );
    });
    const grouped = new Map<string, PlanningTask[]>();
    for (const task of filtered) {
      const name = task.taskType.name || t("pages.projects.phases.untyped");
      const list = grouped.get(name) ?? [];
      list.push(task);
      grouped.set(name, list);
    }
    return [...grouped.entries()];
  }, [keyword, t, tasks]);

  const toggle = (taskId: number) => {
    onChange(
      selected.has(taskId)
        ? selectedIds.filter((id) => id !== taskId)
        : [...selectedIds, taskId],
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <Search className="size-4 text-slate-400" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t("pages.projects.phases.searchTasks")}
          className="h-8 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <span className="shrink-0 text-xs font-medium text-slate-500">
          {t("pages.projects.phases.selected", { count: selectedIds.length })}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400">
            {t("common.processing")}
          </p>
        ) : groups.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400">
            {emptyLabel}
          </p>
        ) : (
          groups.map(([name, items]) => (
            <section key={name} className="border-b border-slate-100 last:border-b-0">
              <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                <span>{name}</span>
                <span>{items.length}</span>
              </div>
              <ul>
                {items.map((task) => (
                  <li key={task.id}>
                    <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selected.has(task.id)}
                        onChange={() => toggle(task.id)}
                        className="mt-0.5 size-4 cursor-pointer accent-primary"
                      />
                      <span
                        className="mt-1 size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: taskStatusColor(task.status) }}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-slate-400">
                          {task.code}
                        </span>
                        <span className="block text-sm text-slate-800">
                          {task.title}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
