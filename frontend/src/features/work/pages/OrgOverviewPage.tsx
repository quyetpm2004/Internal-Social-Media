import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FolderKanban,
  Search,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import TrendChart from "@/features/work/components/TrendChart";
import {
  activities,
  avatarTones,
  chartLabels,
  chartSeries,
  departments,
  freshItems,
  periodRanges,
  periodSnapshots,
  projectRows,
  slowTasks,
  workload,
  type CompareItem,
  type MetricItem,
  type MetricTone,
  type PeriodKey,
} from "@/features/work/data/org-overview.mock";

const metricIcons: Record<string, LucideIcon> = {
  "on-time": CheckCircle2,
  running: FolderKanban,
  "late-projects": AlertTriangle,
  "open-issues": CircleAlert,
  "slow-people": Users,
  "overdue-tasks": AlertTriangle,
  "sprints-ending": Timer,
  unassigned: Users,
  "no-sprint": Clock3,
};

const metricTones: Record<
  MetricTone,
  { card: string; icon: string; label: string }
> = {
  blue: {
    card: "bg-gradient-to-br from-[#e7f0ff] to-[#f7faff]",
    icon: "bg-[#0A6AF6]",
    label: "text-[#1d4ed8]",
  },
  sky: {
    card: "bg-gradient-to-br from-[#e5f6ff] to-[#f5fbff]",
    icon: "bg-[#0284c7]",
    label: "text-[#0369a1]",
  },
  rose: {
    card: "bg-gradient-to-br from-[#ffe8ea] to-[#fff6f7]",
    icon: "bg-[#e11d48]",
    label: "text-[#be123c]",
  },
  violet: {
    card: "bg-gradient-to-br from-[#f1e8ff] to-[#faf7ff]",
    icon: "bg-[#7c3aed]",
    label: "text-[#6d28d9]",
  },
  amber: {
    card: "bg-gradient-to-br from-[#fff1dc] to-[#fffaf3]",
    icon: "bg-[#d97706]",
    label: "text-[#b45309]",
  },
};

const compareTones: Record<CompareItem["tone"], string> = {
  neutral: "border-slate-200 bg-white",
  good: "border-emerald-100 bg-emerald-50/70",
  bad: "border-rose-100 bg-rose-50/80",
};

const deltaTones: Record<CompareItem["tone"], string> = {
  neutral: "text-slate-500",
  good: "text-emerald-600",
  bad: "text-rose-600",
};

function pickText(
  language: string,
  value: { vi: string; en: string },
) {
  return language.startsWith("en") ? value.en : value.vi;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const first = parts[0]?.[0] ?? "";
  return `${first}${last[0] ?? ""}`.toUpperCase();
}

function MetricCard({ item }: { item: MetricItem }) {
  const { t } = useTranslation();
  const tone = metricTones[item.tone];
  const Icon = metricIcons[item.id] ?? CircleAlert;

  return (
    <article
      className={cn("relative min-h-[148px] min-w-0 rounded-2xl p-4", tone.card)}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl text-white",
            tone.icon,
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="flex size-7 items-center justify-center rounded-full bg-white/80 text-slate-400">
          <ChevronRight className="size-4" />
        </span>
      </div>
      <p
        className={cn(
          "mt-4 text-[11px] font-semibold tracking-wide break-words uppercase",
          tone.label,
        )}
      >
        {t(`pages.workOverview.${item.labelKey}`)}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
        {item.value}
      </p>
      {item.hintKey && (
        <p className="mt-1.5 text-xs text-slate-500">
          {t(`pages.workOverview.${item.hintKey}`, { count: item.hintValue })}
        </p>
      )}
    </article>
  );
}

function Panel({
  title,
  extra,
  children,
  className,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export default function OrgOverviewPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [from, setFrom] = useState(periodRanges.week.from);
  const [to, setTo] = useState(periodRanges.week.to);
  const [showArchived, setShowArchived] = useState(false);
  const [showAllSlow, setShowAllSlow] = useState(false);
  const [deptQuery, setDeptQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [openDeptId, setOpenDeptId] = useState<string | null>(null);

  const snapshot = periodSnapshots[period];
  const periodName = t(`pages.workOverview.periodName.${period}`);

  const visibleProjects = projectRows.filter((row) =>
    showArchived ? row.archived : !row.archived,
  );

  const visibleDepartments = useMemo(() => {
    const query = deptQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((row) => row.name.toLowerCase().includes(query));
  }, [deptQuery]);

  const visibleWorkload = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) return workload;
    return workload.filter((row) => row.name.toLowerCase().includes(query));
  }, [memberQuery]);

  const visibleActivities = useMemo(() => {
    const query = activityQuery.trim().toLowerCase();
    if (!query) return activities;
    return activities.filter((item) => {
      const message = pickText(i18n.language, item.message).toLowerCase();
      return (
        message.includes(query) || item.project.toLowerCase().includes(query)
      );
    });
  }, [activityQuery, i18n.language]);

  const visibleSlowTasks = showAllSlow ? slowTasks : slowTasks.slice(0, 4);

  const selectPeriod = (next: PeriodKey) => {
    setPeriod(next);
    setFrom(periodRanges[next].from);
    setTo(periodRanges[next].to);
  };

  return (
    <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-col gap-4 @5xl:flex-row @5xl:items-start @5xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {t("pages.workOverview.title")}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("pages.workOverview.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {(["week", "month", "quarter"] as PeriodKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => selectPeriod(key)}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  period === key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                {t(`pages.workOverview.periods.${key}`)}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">
            <span>{t("pages.workOverview.from")}</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="bg-transparent text-slate-700 outline-none"
            />
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">
            <span>{t("pages.workOverview.to")}</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="bg-transparent text-slate-700 outline-none"
            />
          </label>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 @5xl:grid-cols-5">
        {snapshot.metrics.map((item) => (
          <MetricCard key={item.id} item={item} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 @5xl:grid-cols-4">
        {snapshot.alerts.map((item) => (
          <MetricCard key={item.id} item={item} />
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          {t("pages.workOverview.compareTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 @5xl:grid-cols-5">
          {snapshot.compare.map((item) => (
            <article
              key={item.id}
              className={cn(
                "rounded-2xl border px-4 py-3",
                compareTones[item.tone],
              )}
            >
              <p className="text-xs text-slate-500">
                {t(`pages.workOverview.${item.labelKey}`, {
                  period: periodName,
                })}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {item.id === "avg-time"
                  ? t("pages.workOverview.dayValue", { value: item.value })
                  : item.value}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {t("pages.workOverview.previous", {
                  value:
                    item.id === "avg-time"
                      ? t("pages.workOverview.dayValue", { value: item.previous })
                      : item.previous,
                })}
              </p>
              <p className={cn("mt-1 text-xs font-semibold", deltaTones[item.tone])}>
                {item.id === "avg-time"
                  ? t("pages.workOverview.dayValue", { value: item.delta })
                  : item.delta}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Panel
        title={t("pages.workOverview.projectProgress")}
        extra={
          <button
            type="button"
            onClick={() => setShowArchived((open) => !open)}
            className="cursor-pointer text-sm font-medium text-primary hover:underline"
          >
            {showArchived
              ? t("pages.workOverview.activeProjects")
              : t("pages.workOverview.archivedProjects")}
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colProject")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colSprint")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colStart")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colEnd")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colProgress")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colIssues")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colTasks")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colStatus")}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                >
                  <td className="px-2 py-3 font-medium text-slate-800">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      {row.name}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{row.sprint}</td>
                  <td className="px-2 py-3 text-slate-500">{row.start}</td>
                  <td className="px-2 py-3 text-slate-500">{row.end}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {row.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-slate-500">
                    {row.issuesLeft > 0
                      ? t("pages.workOverview.issuesLeft", {
                          count: row.issuesLeft,
                        })
                      : "0"}
                  </td>
                  <td className="px-2 py-3 text-slate-600">
                    {row.tasksDone}/{row.tasksTotal}
                    {row.tasksLate > 0 && (
                      <span className="text-rose-500">
                        {" "}
                        ({t("pages.workOverview.tasksLate", { count: row.tasksLate })})
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-3 text-xs font-semibold",
                      row.status === "slow" && "text-rose-600",
                      row.status === "onTrack" && "text-emerald-600",
                      row.status === "done" && "text-slate-500",
                    )}
                  >
                    {t(`pages.workOverview.status.${row.status}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title={t("pages.workOverview.departments")}
        extra={
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-400">
            <Search className="size-3.5" />
            <input
              value={deptQuery}
              onChange={(event) => setDeptQuery(event.target.value)}
              placeholder={t("pages.workOverview.searchDepartment")}
              className="w-36 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colDepartment")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colHeadcount")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colIdle")}
                </th>
                <th className="px-2 py-2 font-medium">
                  {t("pages.workOverview.colLatePeople")}
                </th>
                <th className="px-2 py-2 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {visibleDepartments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-slate-400">
                    {t("pages.workOverview.noMatch")}
                  </td>
                </tr>
              ) : (
                visibleDepartments.map((row) => {
                  const open = openDeptId === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-b border-slate-50">
                        <td className="px-2 py-3 font-medium text-slate-800">
                          {row.name}
                        </td>
                        <td className="px-2 py-3 text-slate-600">{row.headcount}</td>
                        <td className="px-2 py-3 text-slate-600">{row.idle}</td>
                        <td className="px-2 py-3 text-slate-600">{row.late}</td>
                        <td className="px-2 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDeptId(open ? null : row.id)
                            }
                            className="cursor-pointer text-sm font-medium text-primary hover:underline"
                          >
                            {t("pages.workOverview.viewPeople")}
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b border-slate-50 bg-slate-50/80">
                          <td colSpan={5} className="px-4 py-3">
                            <ul className="grid gap-2 sm:grid-cols-2">
                              {row.members.map((member) => (
                                <li
                                  key={member.name}
                                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                                >
                                  <span className="font-medium text-slate-700">
                                    {member.name}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {t("pages.workOverview.memberStat", {
                                      idle: member.idle,
                                      late: member.late,
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <section className="grid grid-cols-1 gap-3 @4xl:grid-cols-2">
        <Panel
          title={t("pages.workOverview.slowTasks")}
          extra={
            <button
              type="button"
              onClick={() => setShowAllSlow((open) => !open)}
              className="cursor-pointer text-sm font-medium text-primary hover:underline"
            >
              {showAllSlow
                ? t("pages.workOverview.showLess")
                : t("pages.workOverview.seeAll")}
            </button>
          }
        >
          <ul className="divide-y divide-slate-100">
            {visibleSlowTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between gap-4 py-3"
              >
                <span className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-400" />
                  <span className="text-sm text-slate-700">
                    {pickText(i18n.language, task.title)}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-rose-500">
                  {t("pages.workOverview.lateSince", { date: task.since })}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t("pages.workOverview.freshItems")}>
          <ul className="divide-y divide-slate-100">
            {freshItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-3"
              >
                <span className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full border border-slate-300" />
                  <span className="text-sm text-slate-700">
                    {pickText(i18n.language, item.title)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {item.minutesAgo < 60
                    ? t("pages.workOverview.minutesAgo", {
                        count: item.minutesAgo,
                      })
                    : t("pages.workOverview.hoursAgo", {
                        count: Math.round(item.minutesAgo / 60),
                      })}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel title={t("pages.workOverview.dailyChart")}>
        <TrendChart
          labels={chartLabels}
          series={chartSeries.map((item) => ({
            ...item,
            label: t(`pages.workOverview.${item.labelKey}`),
          }))}
        />
      </Panel>

      <section className="grid grid-cols-1 gap-3 @5xl:grid-cols-[1.35fr_0.9fr]">
        <Panel
          title={t("pages.workOverview.workload")}
          extra={
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-400">
              <Search className="size-3.5" />
              <input
                value={memberQuery}
                onChange={(event) => setMemberQuery(event.target.value)}
                placeholder={t("pages.workOverview.searchMember")}
                className="w-36 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-2 py-2 font-medium">
                    {t("pages.workOverview.colMember")}
                  </th>
                  <th className="px-2 py-2 font-medium">
                    {t("pages.workOverview.colInProject")}
                  </th>
                  <th className="px-2 py-2 font-medium">
                    {t("pages.workOverview.colOutside")}
                  </th>
                  <th className="px-2 py-2 font-medium">
                    {t("pages.workOverview.colTotal")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleWorkload.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-8 text-center text-slate-400">
                      {t("pages.workOverview.noMatch")}
                    </td>
                  </tr>
                ) : (
                  visibleWorkload.map((row, index) => (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-2 py-2.5">
                        <span className="inline-flex items-center gap-2.5 font-medium text-slate-800">
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                              avatarTones[index % avatarTones.length],
                            )}
                          >
                            {initials(row.name)}
                          </span>
                          {row.name}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-slate-600">{row.inProject}</td>
                      <td className="px-2 py-2.5 text-slate-600">{row.outside}</td>
                      <td className="px-2 py-2.5 font-medium text-slate-800">
                        {row.inProject + row.outside}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title={t("pages.workOverview.activity")}
          extra={
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-400">
              <Search className="size-3.5" />
              <input
                value={activityQuery}
                onChange={(event) => setActivityQuery(event.target.value)}
                placeholder={t("pages.workOverview.searchActivity")}
                className="w-32 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          }
        >
          {visibleActivities.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {t("pages.workOverview.noMatch")}
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {visibleActivities.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.tone === "blue" && "bg-primary",
                      item.tone === "emerald" && "bg-emerald-500",
                      item.tone === "violet" && "bg-violet-500",
                      item.tone === "amber" && "bg-amber-500",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-slate-700">
                      {pickText(i18n.language, item.message)}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>{pickText(i18n.language, item.time)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                        {t("pages.workOverview.projectTag")}
                      </span>
                      <span className="truncate">{item.project}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </main>
  );
}
