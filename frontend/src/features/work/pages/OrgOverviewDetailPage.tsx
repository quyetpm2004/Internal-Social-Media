import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import ActivityList from "@/features/work/components/overview/ActivityList";
import DepartmentHeatmap from "@/features/work/components/overview/DepartmentHeatmap";
import OverviewPanel from "@/features/work/components/overview/OverviewPanel";
import PeriodSwitch from "@/features/work/components/overview/PeriodSwitch";
import ProjectHealthChart from "@/features/work/components/overview/ProjectHealthChart";
import RiskGauge from "@/features/work/components/overview/RiskGauge";
import {
  getDepartmentHeat,
  getOrgRisk,
  getProjectHealthList,
  healthColors,
  isOverviewSection,
  type HealthLevel,
  type OverviewSection,
  type ProjectHealth,
} from "@/features/work/data/org-overview-dashboard";
import {
  activities,
  departments,
  avatarTones,
  freshItems,
  slowTasks,
  workload,
  type PeriodKey,
} from "@/features/work/data/org-overview.mock";
import { useOverviewPeriod } from "@/features/work/hooks/use-overview-period";

function pickText(language: string, value: { vi: string; en: string }) {
  return language.startsWith("en") ? value.en : value.vi;
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-400">
      <Search className="size-3.5" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-44 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
      />
    </label>
  );
}

function ProjectCard({ project }: { project: ProjectHealth }) {
  const { t } = useTranslation();
  const color = healthColors[project.level];

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {project.name}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {project.sprint} · {project.start} → {project.end}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {t(`pages.orgDashboard.health.${project.level}`)}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{t("pages.workOverview.colProgress")}</span>
        <span className="font-semibold text-slate-800 tabular-nums">
          {project.progress}%
        </span>
      </div>
      <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${project.progress}%`, backgroundColor: color }}
        />
        <span
          className="absolute inset-y-0 w-0.5 bg-slate-500/70"
          style={{ left: `${project.elapsed}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          {t("pages.workOverview.colTasks")}:{" "}
          <span className="font-semibold text-slate-800">
            {project.tasksDone}/{project.tasksTotal}
          </span>
        </span>
        {project.tasksLate > 0 && (
          <span className="font-semibold text-rose-500">
            {t("pages.workOverview.tasksLate", { count: project.tasksLate })}
          </span>
        )}
      </div>
    </article>
  );
}

function ProjectsSection() {
  const { t } = useTranslation();
  const [archived, setArchived] = useState(false);
  const active = useMemo(() => getProjectHealthList(), []);
  const listed = useMemo(() => getProjectHealthList(archived), [archived]);
  const levels: HealthLevel[] = ["danger", "warn", "ok"];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-12">
        <OverviewPanel
          title={t("pages.orgDashboard.health.title")}
          className="xl:col-span-6"
        >
          <ProjectHealthChart projects={active} />
        </OverviewPanel>
        <section className="grid gap-3 sm:grid-cols-3 xl:col-span-6 xl:grid-cols-1 xl:grid-rows-3">
          {levels.map((level) => {
            const items = active.filter((item) => item.level === level);
            return (
              <article
                key={level}
                className="flex flex-col justify-center rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: healthColors[level] }}
                  >
                    {items.length}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {t(`pages.orgDashboard.health.${level}`)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {items.map((item) => item.name).join(" · ")}
                </p>
              </article>
            );
          })}
        </section>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setArchived((open) => !open)}
          className="cursor-pointer text-sm font-medium text-primary hover:underline"
        >
          {archived
            ? t("pages.workOverview.activeProjects")
            : t("pages.workOverview.archivedProjects")}
        </button>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {listed.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </div>
  );
}

function metricTone(value: number, metric: "late" | "idle" | "kpi") {
  if (metric === "kpi") {
    if (value >= 80) return "bg-emerald-50 text-emerald-700";
    if (value >= 70) return "bg-amber-50 text-amber-700";
    return "bg-rose-50 text-rose-600";
  }
  if (value > 1) return "bg-rose-50 text-rose-600";
  if (value === 1) return "bg-amber-50 text-amber-700";
  return "bg-slate-50 text-slate-400";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const first = parts[0]?.[0] ?? "";
  return `${first}${last[0] ?? ""}`.toUpperCase();
}

function DepartmentsSection() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const heatRows = useMemo(() => departments.map(getDepartmentHeat), []);
  const visible = heatRows.filter((row) =>
    row.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const metrics = ["late", "idle", "kpi"] as const;

  return (
    <div className="space-y-3">
      <OverviewPanel title={t("pages.orgDashboard.heat.title")}>
        <DepartmentHeatmap rows={heatRows} orientation="columns" />
      </OverviewPanel>
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder={t("pages.workOverview.searchDepartment")}
      />
      {visible.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">
          {t("pages.workOverview.noMatch")}
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((row) => {
          const source = departments.find((item) => item.id === row.id);
          return (
            <article
              key={row.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {row.name}
                </h3>
                <span className="text-xs text-slate-400">
                  {t("pages.orgDashboard.members", { count: row.headcount })}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {metrics.map((metric) => (
                  <div
                    key={metric}
                    className={cn(
                      "rounded-xl py-1.5",
                      metricTone(row[metric], metric),
                    )}
                  >
                    <p className="text-lg leading-tight font-bold">
                      {row[metric]}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t(`pages.orgDashboard.heat.${metric}`)}
                    </p>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5">
                {source?.members.map((member) => (
                  <li
                    key={member.name}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate font-medium text-slate-700">
                      {member.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {member.late > 0 && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-600">
                          {t("pages.orgDashboard.heat.late")} {member.late}
                        </span>
                      )}
                      {member.idle > 0 && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">
                          {t("pages.orgDashboard.heat.idle")} {member.idle}
                        </span>
                      )}
                      {member.late === 0 && member.idle === 0 && (
                        <span className="text-slate-400">—</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function WorkloadSection() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const rows = workload.filter((row) =>
    row.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <OverviewPanel
      title={t("pages.workOverview.workload")}
      extra={
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t("pages.workOverview.searchMember")}
        />
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400">
              <th className="px-2 py-2 font-medium">
                {t("pages.workOverview.colMember")}
              </th>
              <th className="px-2 py-2 font-medium">
                {t("pages.workOverview.colDepartment")}
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
              <th className="px-2 py-2 font-medium">
                {t("pages.orgDashboard.workload.overdue")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-2 py-8 text-center text-slate-400"
                >
                  {t("pages.workOverview.noMatch")}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 last:border-0"
                >
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
                  <td className="px-2 py-2.5 text-slate-600">
                    {departments.find((dept) =>
                      dept.members.some((member) => member.name === row.name),
                    )?.name ?? "—"}
                  </td>
                  <td className="px-2 py-2.5 text-slate-600">
                    {row.inProject}
                  </td>
                  <td className="px-2 py-2.5 text-slate-600">{row.outside}</td>
                  <td className="px-2 py-2.5 font-medium text-slate-800">
                    {row.inProject + row.outside}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2.5 font-medium",
                      row.overdue > 0 ? "text-rose-600" : "text-slate-400",
                    )}
                  >
                    {row.overdue}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </OverviewPanel>
  );
}

function ActivitySection() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const items = activities.filter((item) => {
    const needle = query.trim().toLowerCase();
    return (
      pickText(i18n.language, item.message).toLowerCase().includes(needle) ||
      item.project.toLowerCase().includes(needle)
    );
  });

  return (
    <OverviewPanel
      title={t("pages.orgDashboard.activity.title")}
      extra={
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t("pages.workOverview.searchActivity")}
        />
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {t("pages.workOverview.noMatch")}
        </p>
      ) : (
        <ActivityList
          items={items}
          className="md:grid md:grid-cols-2 md:gap-x-8"
        />
      )}
    </OverviewPanel>
  );
}

function RisksSection({ period }: { period: PeriodKey }) {
  const { t, i18n } = useTranslation();
  const risk = useMemo(() => getOrgRisk(period), [period]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-12">
        <OverviewPanel
          title={t("pages.orgDashboard.risk.title")}
          className="xl:col-span-4"
        >
          <RiskGauge risk={risk} factorLimit={4} />
        </OverviewPanel>
        <OverviewPanel
          title={t("pages.workOverview.slowTasks")}
          extra={
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
              {slowTasks.length}
            </span>
          }
          className="xl:col-span-8"
        >
          <ul className="flex h-full flex-col justify-between gap-2">
            {slowTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5"
              >
                <span className="size-2 shrink-0 rounded-full bg-rose-500" />
                <p className="min-w-0 flex-1 text-sm text-slate-700">
                  {pickText(i18n.language, task.title)}
                </p>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                  {t("pages.workOverview.lateSince", { date: task.since })}
                </span>
              </li>
            ))}
          </ul>
        </OverviewPanel>
      </div>
      <OverviewPanel title={t("pages.workOverview.freshItems")}>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {freshItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5"
            >
              <p className="text-sm text-slate-700">
                {pickText(i18n.language, item.title)}
              </p>
              <p className="text-xs text-slate-400">
                {item.minutesAgo < 60
                  ? t("pages.workOverview.minutesAgo", {
                      count: item.minutesAgo,
                    })
                  : t("pages.workOverview.hoursAgo", {
                      count: Math.round(item.minutesAgo / 60),
                    })}
              </p>
            </li>
          ))}
        </ul>
      </OverviewPanel>
    </div>
  );
}

export default function OrgOverviewDetailPage() {
  const { t } = useTranslation();
  const { section } = useParams<{ section: string }>();
  const { period, setPeriod } = useOverviewPeriod();

  if (!isOverviewSection(section)) {
    return <Navigate to="/work" replace />;
  }

  const current = section as OverviewSection;

  return (
    <main className="space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/work?period=${period}`}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-primary"
            aria-label={t("pages.orgDashboard.back")}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            {t(`pages.orgDashboard.sections.${current}`)}
          </h1>
        </div>
        <PeriodSwitch period={period} onChange={setPeriod} />
      </header>

      {current === "projects" && <ProjectsSection />}
      {current === "departments" && <DepartmentsSection />}
      {current === "workload" && <WorkloadSection />}
      {current === "activity" && <ActivitySection />}
      {current === "risks" && <RisksSection period={period} />}
    </main>
  );
}
