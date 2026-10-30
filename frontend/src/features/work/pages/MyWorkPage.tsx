import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ClipboardList, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { workApi } from "@/features/work/api/work.api";
import type {
  MyTask,
  WorkCategory,
  WorkDue,
  WorkRole,
  WorkScope,
} from "@/features/work/types/work.type";
import { toastApiError } from "@/features/project-template/utils/api-error";

type DueBucket =
  "overdue" | "today" | "thisWeek" | "later" | "finished" | "none";
type DueFilter = "all" | WorkDue;
type GroupBy = "due" | "project";

const CATEGORIES: WorkCategory[] = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
const OPEN_CATEGORIES: WorkCategory[] = ["TODO", "IN_PROGRESS"];
const DUE_ORDER: DueBucket[] = [
  "overdue",
  "today",
  "thisWeek",
  "later",
  "finished",
  "none",
];
const MINE_ROLES: WorkRole[] = ["ASSIGNEE", "REVIEWER"];
const ASSIGNED_ROLES: WorkRole[] = ["REPORTER"];

const categoryTone: Record<WorkCategory, { dot: string; active: string }> = {
  TODO: { dot: "bg-blue-500", active: "border-blue-500 text-blue-600" },
  IN_PROGRESS: { dot: "bg-sky-500", active: "border-sky-500 text-sky-600" },
  DONE: {
    dot: "bg-emerald-500",
    active: "border-emerald-500 text-emerald-600",
  },
  CANCELLED: { dot: "bg-slate-400", active: "border-slate-400 text-slate-600" },
};

function vietnamTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addIsoDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dueBucket(
  due: string | null,
  category: WorkCategory,
  today: string,
  weekEnd: string,
): DueBucket {
  if (!due) return "none";
  if (due < today) {
    return OPEN_CATEGORIES.includes(category) ? "overdue" : "finished";
  }
  if (due === today) return "today";
  if (due <= weekEnd) return "thisWeek";
  return "later";
}

function formatDue(due: string) {
  const [year, month, day] = due.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

function spaceOf(task: MyTask) {
  if (task.project) return task.project;
  const department = task.department;
  return { id: -(department?.id ?? 0), name: department?.name ?? "" };
}

function taskPath(task: MyTask) {
  if (task.project) {
    return `/projects/${task.project.id}?tab=tasks&task=${task.id}`;
  }
  return "/work/department/tasks";
}

function sameCategories(left: WorkCategory[], right: WorkCategory[]) {
  return (
    left.length === right.length &&
    right.every((status) => left.includes(status))
  );
}

function SelectField({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-8 pl-3 text-sm text-slate-700 outline-none focus:border-primary"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

export default function MyWorkPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<WorkScope>("mine");
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState("");
  const [projectId, setProjectId] = useState<number | "all">("all");
  const [role, setRole] = useState<"all" | WorkRole>("all");
  const [due, setDue] = useState<DueFilter>("all");
  const [categories, setCategories] = useState<WorkCategory[]>(OPEN_CATEGORIES);
  const [groupBy, setGroupBy] = useState<GroupBy>("due");
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [counts, setCounts] = useState({ mine: 0, assigned: 0 });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestRef = useRef(0);

  const today = vietnamTodayIso();
  const weekEnd = addIsoDays(today, 7);
  const roleOptions = tab === "mine" ? MINE_ROLES : ASSIGNED_ROLES;
  const openPreset = sameCategories(categories, OPEN_CATEGORIES);
  const allPreset = sameCategories(categories, CATEGORIES);

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadFailed(false);
    setTasks([]);

    workApi
      .getMyTasks({
        scope: tab,
        q: keyword || undefined,
        role: role === "all" ? undefined : role,
        due: due === "all" ? undefined : due,
      })
      .then((response) => {
        if (requestId !== requestRef.current) return;
        setTasks(response.data.items);
        setCounts(response.data.counts);
        setProjectId((current) => {
          if (current === "all") return current;
          const stillThere = response.data.items.some(
            (task) => spaceOf(task).id === current,
          );
          return stillThere ? current : "all";
        });
      })
      .catch((error: unknown) => {
        if (requestId !== requestRef.current) return;
        setTasks([]);
        setLoadFailed(true);
        toastApiError(error);
      })
      .finally(() => {
        if (requestId === requestRef.current) setLoading(false);
      });
  }, [tab, keyword, role, due]);

  const projects = useMemo(() => {
    const names = new Map<number, string>();
    for (const task of tasks) {
      const space = spaceOf(task);
      names.set(space.id, space.name);
    }
    return [...names.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }, [tasks]);

  const visible = tasks.filter(
    (task) =>
      categories.includes(task.status.category) &&
      (projectId === "all" || spaceOf(task).id === projectId),
  );

  const groups = useMemo(() => {
    if (groupBy === "project") {
      return projects
        .map((project) => ({
          key: String(project.id),
          label: project.name,
          tasks: visible.filter((task) => spaceOf(task).id === project.id),
        }))
        .filter((group) => group.tasks.length > 0);
    }

    return DUE_ORDER.map((bucket) => ({
      key: bucket,
      label: t(`pages.myWork.bucket.${bucket}`),
      tasks: visible.filter(
        (task) =>
          dueBucket(task.dueDate, task.status.category, today, weekEnd) ===
          bucket,
      ),
    })).filter((group) => group.tasks.length > 0);
  }, [groupBy, projects, t, today, visible, weekEnd]);

  const projectStats = projects
    .map((project) => {
      const rows = tasks.filter((task) => spaceOf(task).id === project.id);
      const statusCounts = Object.fromEntries(
        CATEGORIES.map((category) => [
          category,
          rows.filter((task) => task.status.category === category).length,
        ]),
      ) as Record<WorkCategory, number>;
      return { ...project, total: rows.length, statusCounts };
    })
    .filter((item) => item.total > 0);

  const selectCategories = (next: WorkCategory[]) => setCategories(next);

  const toggleCategory = (category: WorkCategory) => {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  return (
    <main className="flex h-[calc(100svh-3.5rem)] flex-col bg-white md:h-svh">
      <header className="flex items-start gap-3 px-5 pt-5 pb-3 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <ClipboardList className="size-5" />
        </span>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            {t("pages.myWork.title")}
          </h1>
          <p className="text-sm text-slate-500">{t("pages.myWork.subtitle")}</p>
        </div>
      </header>

      <div className="flex gap-6 border-b border-slate-200 px-5 sm:px-6">
        {(["mine", "assigned"] as WorkScope[]).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === tab) return;
                setTasks([]);
                setTab(key);
                setProjectId("all");
                setRole("all");
              }}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-sm font-medium",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {t(`pages.myWork.${key}`)}
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                  active
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3 sm:px-6">
        <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400 sm:max-w-xs">
          <Search className="size-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pages.myWork.search")}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
        <SelectField
          value={projectId === "all" ? "all" : String(projectId)}
          label={t("pages.myWork.allProjects")}
          onChange={(value) =>
            setProjectId(value === "all" ? "all" : Number(value))
          }
        >
          <option value="all">{t("pages.myWork.allProjects")}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          value={role}
          label={t("pages.myWork.allRoles")}
          onChange={(value) => setRole(value as "all" | WorkRole)}
        >
          <option value="all">{t("pages.myWork.allRoles")}</option>
          {roleOptions.map((item) => (
            <option key={item} value={item}>
              {t(`pages.myWork.role.${item}`)}
            </option>
          ))}
        </SelectField>
        <SelectField
          value={due}
          label={t("pages.myWork.anyDue")}
          onChange={(value) => setDue(value as DueFilter)}
        >
          <option value="all">{t("pages.myWork.anyDue")}</option>
          {(["overdue", "today", "week", "none"] as const).map((item) => (
            <option key={item} value={item}>
              {t(`pages.myWork.dueFilter.${item}`)}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 pb-3 sm:px-6">
        <span className="text-sm text-slate-500">
          {t("pages.myWork.statusLabel")}
        </span>
        <button
          type="button"
          onClick={() => selectCategories(OPEN_CATEGORIES)}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1 text-sm font-medium",
            openPreset
              ? "bg-primary text-white"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {t("pages.myWork.openOnly")}
        </button>
        <button
          type="button"
          onClick={() => selectCategories(CATEGORIES)}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1 text-sm font-medium",
            allPreset
              ? "bg-primary text-white"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {t("pages.myWork.all")}
        </button>
        {CATEGORIES.map((category) => {
          const selected = categories.includes(category);
          const tone = categoryTone[category];
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm",
                selected ? tone.active : "border-slate-200 text-slate-400",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  selected ? tone.dot : "bg-slate-300",
                )}
              />
              {t(`pages.myWork.status.${category}`)}
            </button>
          );
        })}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">
            {t("pages.myWork.groupLabel")}
          </span>
          {(["due", "project"] as GroupBy[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setGroupBy(key)}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1 text-sm",
                groupBy === key
                  ? "border-primary text-primary"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50",
              )}
            >
              {t(
                key === "due" ? "pages.myWork.byDue" : "pages.myWork.byProject",
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-6 py-24 text-center text-sm text-slate-400">
              {t("pages.myWork.loading")}
            </p>
          ) : loadFailed ? (
            <p className="px-6 py-24 text-center text-sm text-slate-400">
              {t("pages.myWork.loadFailed")}
            </p>
          ) : groups.length === 0 ? (
            <p className="px-6 py-24 text-center text-sm text-slate-400">
              {t("pages.myWork.empty")}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.key}>
                <div className="sticky top-0 bg-slate-50 px-5 py-2 text-xs font-semibold text-slate-500 sm:px-6">
                  {group.label}
                  <span className="ml-2 font-medium text-slate-400">
                    {group.tasks.length}
                  </span>
                </div>
                <ul>
                  {group.tasks.map((task) => {
                    const bucket = dueBucket(
                      task.dueDate,
                      task.status.category,
                      today,
                      weekEnd,
                    );
                    const tone = categoryTone[task.status.category];
                    return (
                      <li key={task.id} className="border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => navigate(taskPath(task))}
                          className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 sm:px-6"
                        >
                          <span
                            className={cn(
                              "size-2.5 shrink-0 rounded-full",
                              task.status.color ? undefined : tone.dot,
                            )}
                            style={
                              task.status.color
                                ? { backgroundColor: task.status.color }
                                : undefined
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-slate-800">
                              {task.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {spaceOf(task).name} ·
                              {t(`pages.myWork.role.${task.myRole}`)}
                            </p>
                          </div>
                          <span className="hidden text-xs text-slate-500 sm:inline">
                            {task.status.name}
                          </span>
                          <span
                            className={cn(
                              "w-16 shrink-0 text-right text-xs",
                              bucket === "overdue"
                                ? "font-medium text-rose-500"
                                : "text-slate-400",
                            )}
                          >
                            {task.dueDate ? formatDue(task.dueDate) : "—"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>

        <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 lg:w-80 lg:border-t-0 lg:border-l">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              {t("pages.myWork.statsTitle")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {t("pages.myWork.statsSubtitle")}
            </p>
          </div>
          {projectStats.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              {loading
                ? t("pages.myWork.loading")
                : t("pages.myWork.statsEmpty")}
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
              {projectStats.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setProjectId((current) =>
                        current === item.id ? "all" : item.id,
                      )
                    }
                    className={cn(
                      "w-full cursor-pointer rounded-xl px-3 py-2.5 text-left",
                      projectId === item.id
                        ? "bg-primary/10"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-slate-800">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.total}
                      </span>
                    </span>
                    <span className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                      {CATEGORIES.map((category) =>
                        item.statusCounts[category] > 0 ? (
                          <span
                            key={category}
                            className={categoryTone[category].dot}
                            style={{
                              width: `${(item.statusCounts[category] / item.total) * 100}%`,
                            }}
                          />
                        ) : null,
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-2.5 sm:px-6">
        {CATEGORIES.map((category) => (
          <span
            key={category}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
          >
            <span
              className={cn("size-2 rounded-full", categoryTone[category].dot)}
            />
            {t(`pages.myWork.status.${category}`)}
          </span>
        ))}
      </footer>
    </main>
  );
}
