import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ClipboardList, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type WorkStatus = "notStarted" | "doing" | "paused" | "done" | "na";
type WorkRole = "assignee" | "watcher" | "approver";
type DueBucket = "overdue" | "today" | "thisWeek" | "later" | "none";
type DueFilter = "all" | "overdue" | "today" | "week" | "none";
type TaskTab = "mine" | "assigned";
type GroupBy = "due" | "project";

type WorkTask = {
  id: string;
  title: { vi: string; en: string };
  project: string;
  role: WorkRole;
  status: WorkStatus;
  due: string | null;
};

const TODAY = "2026-10-08";
const WEEK_END = "2026-10-15";

const STATUSES: WorkStatus[] = ["notStarted", "doing", "paused", "done", "na"];
const OPEN_STATUSES: WorkStatus[] = ["notStarted", "doing", "paused"];
const DUE_ORDER: DueBucket[] = ["overdue", "today", "thisWeek", "later", "none"];

const statusTone: Record<WorkStatus, { dot: string; active: string }> = {
  notStarted: { dot: "bg-blue-500", active: "border-blue-500 text-blue-600" },
  doing: { dot: "bg-sky-500", active: "border-sky-500 text-sky-600" },
  paused: { dot: "bg-amber-500", active: "border-amber-500 text-amber-600" },
  done: { dot: "bg-emerald-500", active: "border-emerald-500 text-emerald-600" },
  na: { dot: "bg-slate-400", active: "border-slate-400 text-slate-600" },
};

const mineTasks: WorkTask[] = [
  {
    id: "m1",
    title: {
      vi: "Sửa form thêm thành viên dự án",
      en: "Fix the add-member form",
    },
    project: "Cổng thông tin nội bộ",
    role: "assignee",
    status: "doing",
    due: "2026-10-02",
  },
  {
    id: "m2",
    title: {
      vi: "Rà task chưa có người nhận",
      en: "Review tasks with no assignee",
    },
    project: "Kho tài liệu phòng ban",
    role: "watcher",
    status: "paused",
    due: "2026-10-06",
  },
  {
    id: "m3",
    title: {
      vi: "Chốt bộ lọc kỳ trên tổng quan",
      en: "Finalize the overview period filters",
    },
    project: "Báo cáo tuần tự động",
    role: "assignee",
    status: "notStarted",
    due: "2026-10-08",
  },
  {
    id: "m4",
    title: {
      vi: "Viết mô tả sprint CollabNet Mobile",
      en: "Write the CollabNet Mobile sprint note",
    },
    project: "CollabNet Mobile",
    role: "assignee",
    status: "doing",
    due: "2026-10-12",
  },
  {
    id: "m5",
    title: {
      vi: "Cập nhật tiến độ luồng duyệt bài",
      en: "Update the review-flow progress",
    },
    project: "Luồng duyệt bài viết",
    role: "assignee",
    status: "notStarted",
    due: "2026-10-20",
  },
  {
    id: "m6",
    title: {
      vi: "Kiểm tra file import Excel",
      en: "Check the Excel import file",
    },
    project: "Kho tài liệu phòng ban",
    role: "approver",
    status: "na",
    due: null,
  },
  {
    id: "m7",
    title: {
      vi: "Gửi banner chiến dịch nội bộ",
      en: "Send the internal campaign banner",
    },
    project: "Onboarding nhân sự mới",
    role: "assignee",
    status: "done",
    due: "2026-10-01",
  },
];

const assignedTasks: WorkTask[] = [
  {
    id: "a1",
    title: {
      vi: "Làm tài liệu chỉ tiêu kỹ thuật",
      en: "Write the technical spec",
    },
    project: "CollabNet Mobile",
    role: "assignee",
    status: "doing",
    due: "2026-08-13",
  },
  {
    id: "a2",
    title: {
      vi: "Bổ sung lọc theo kỳ",
      en: "Add the period filter",
    },
    project: "Báo cáo tuần tự động",
    role: "assignee",
    status: "notStarted",
    due: "2026-10-10",
  },
  {
    id: "a3",
    title: {
      vi: "Nhắc việc quá hạn đầu giờ sáng",
      en: "Send the morning overdue reminder",
    },
    project: "Cổng thông tin nội bộ",
    role: "watcher",
    status: "paused",
    due: "2026-10-09",
  },
];

function textOf(language: string, value: { vi: string; en: string }) {
  return language.startsWith("en") ? value.en : value.vi;
}

function dueBucket(due: string | null): DueBucket {
  if (!due) return "none";
  if (due < TODAY) return "overdue";
  if (due === TODAY) return "today";
  if (due <= WEEK_END) return "thisWeek";
  return "later";
}

function formatDue(due: string) {
  const [year, month, day] = due.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

function sameStatuses(left: WorkStatus[], right: WorkStatus[]) {
  return left.length === right.length && right.every((status) => left.includes(status));
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
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<TaskTab>("mine");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("all");
  const [role, setRole] = useState<"all" | WorkRole>("all");
  const [due, setDue] = useState<DueFilter>("all");
  const [statuses, setStatuses] = useState<WorkStatus[]>(OPEN_STATUSES);
  const [groupBy, setGroupBy] = useState<GroupBy>("due");

  const source = tab === "mine" ? mineTasks : assignedTasks;
  const openPreset = sameStatuses(statuses, OPEN_STATUSES);
  const allPreset = sameStatuses(statuses, STATUSES);

  const projects = useMemo(
    () => [...new Set(source.map((task) => task.project))],
    [source],
  );

  const matchesBase = (task: WorkTask) => {
    const title = textOf(i18n.language, task.title).toLowerCase();
    if (query.trim() && !title.includes(query.trim().toLowerCase())) return false;
    if (role !== "all" && task.role !== role) return false;
    const bucket = dueBucket(task.due);
    if (due === "overdue" && bucket !== "overdue") return false;
    if (due === "today" && bucket !== "today") return false;
    if (due === "week" && bucket !== "today" && bucket !== "thisWeek") return false;
    if (due === "none" && bucket !== "none") return false;
    return true;
  };

  const statsTasks = source.filter(matchesBase);
  const visible = statsTasks.filter(
    (task) =>
      statuses.includes(task.status) && (project === "all" || task.project === project),
  );

  const groups = useMemo(() => {
    if (groupBy === "project") {
      return projects
        .map((name) => ({
          key: name,
          label: name,
          tasks: visible.filter((task) => task.project === name),
        }))
        .filter((group) => group.tasks.length > 0);
    }

    return DUE_ORDER.map((bucket) => ({
      key: bucket,
      label: t(`pages.myWork.bucket.${bucket}`),
      tasks: visible.filter((task) => dueBucket(task.due) === bucket),
    })).filter((group) => group.tasks.length > 0);
  }, [groupBy, projects, t, visible]);

  const projectStats = projects
    .map((name) => {
      const rows = statsTasks.filter((task) => task.project === name);
      const counts = Object.fromEntries(
        STATUSES.map((status) => [status, rows.filter((task) => task.status === status).length]),
      ) as Record<WorkStatus, number>;
      return { name, total: rows.length, counts };
    })
    .filter((item) => item.total > 0);

  const selectStatuses = (next: WorkStatus[]) => setStatuses(next);

  const toggleStatus = (status: WorkStatus) => {
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
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
        {(["mine", "assigned"] as TaskTab[]).map((key) => {
          const count = key === "mine" ? mineTasks.length : assignedTasks.length;
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setProject("all");
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
                  active ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500",
                )}
              >
                {count}
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
          value={project}
          label={t("pages.myWork.allProjects")}
          onChange={setProject}
        >
          <option value="all">{t("pages.myWork.allProjects")}</option>
          {projects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
        <SelectField
          value={role}
          label={t("pages.myWork.allRoles")}
          onChange={(value) => setRole(value as "all" | WorkRole)}
        >
          <option value="all">{t("pages.myWork.allRoles")}</option>
          {(["assignee", "watcher", "approver"] as WorkRole[]).map((item) => (
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
        <span className="text-sm text-slate-500">{t("pages.myWork.statusLabel")}</span>
        <button
          type="button"
          onClick={() => selectStatuses(OPEN_STATUSES)}
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
          onClick={() => selectStatuses(STATUSES)}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1 text-sm font-medium",
            allPreset ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100",
          )}
        >
          {t("pages.myWork.all")}
        </button>
        {STATUSES.map((status) => {
          const selected = statuses.includes(status);
          const tone = statusTone[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
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
              {t(`pages.myWork.status.${status}`)}
            </button>
          );
        })}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">{t("pages.myWork.groupLabel")}</span>
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
              {t(key === "due" ? "pages.myWork.byDue" : "pages.myWork.byProject")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-0 flex-1 overflow-y-auto">
          {groups.length === 0 ? (
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
                    const bucket = dueBucket(task.due);
                    return (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 sm:px-6"
                      >
                        <span
                          className={cn(
                            "size-2.5 shrink-0 rounded-full",
                            statusTone[task.status].dot,
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-800">
                            {textOf(i18n.language, task.title)}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {task.project} · {t(`pages.myWork.role.${task.role}`)}
                          </p>
                        </div>
                        <span className="hidden text-xs text-slate-500 sm:inline">
                          {t(`pages.myWork.status.${task.status}`)}
                        </span>
                        <span
                          className={cn(
                            "w-16 shrink-0 text-right text-xs",
                            bucket === "overdue" ? "font-medium text-rose-500" : "text-slate-400",
                          )}
                        >
                          {task.due ? formatDue(task.due) : "—"}
                        </span>
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
              {t("pages.myWork.statsEmpty")}
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
              {projectStats.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() =>
                      setProject((current) => (current === item.name ? "all" : item.name))
                    }
                    className={cn(
                      "w-full cursor-pointer rounded-xl px-3 py-2.5 text-left",
                      project === item.name ? "bg-primary/10" : "hover:bg-slate-50",
                    )}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-slate-800">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-400">{item.total}</span>
                    </span>
                    <span className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                      {STATUSES.map((status) =>
                        item.counts[status] > 0 ? (
                          <span
                            key={status}
                            className={statusTone[status].dot}
                            style={{
                              width: `${(item.counts[status] / item.total) * 100}%`,
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
        {STATUSES.map((status) => (
          <span
            key={status}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
          >
            <span className={cn("size-2 rounded-full", statusTone[status].dot)} />
            {t(`pages.myWork.status.${status}`)}
          </span>
        ))}
      </footer>
    </main>
  );
}
