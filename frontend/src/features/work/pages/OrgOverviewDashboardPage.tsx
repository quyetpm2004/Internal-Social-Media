import { useMemo } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import ActivityList from "@/features/work/components/overview/ActivityList";
import AreaTrendChart from "@/features/work/components/overview/AreaTrendChart";
import DepartmentHeatmap from "@/features/work/components/overview/DepartmentHeatmap";
import OverviewPanel from "@/features/work/components/overview/OverviewPanel";
import PeriodSwitch from "@/features/work/components/overview/PeriodSwitch";
import ProjectHealthChart from "@/features/work/components/overview/ProjectHealthChart";
import RiskGauge from "@/features/work/components/overview/RiskGauge";
import Sparkline from "@/features/work/components/overview/Sparkline";
import WorkloadBars from "@/features/work/components/overview/WorkloadBars";
import {
  getDepartmentHeat,
  getOrgRisk,
  getProjectHealthList,
  getSnapshotValue,
  kpiTrends,
  overviewPath,
  type OverviewSection,
} from "@/features/work/data/org-overview-dashboard";
import {
  activities,
  chartLabels,
  chartSeries,
  departments,
  workload,
} from "@/features/work/data/org-overview.mock";
import { useOverviewPeriod } from "@/features/work/hooks/use-overview-period";

type KpiTone = "green" | "blue" | "red" | "amber" | "violet" | "cyan";

const kpiTones: Record<
  KpiTone,
  { card: string; label: string; value: string; hint: string; spark: string }
> = {
  green: {
    card: "bg-[#e9fbf0]",
    label: "text-emerald-800",
    value: "text-emerald-900",
    hint: "text-emerald-600",
    spark: "#10b981",
  },
  blue: {
    card: "bg-[#eaf2ff]",
    label: "text-blue-800",
    value: "text-blue-900",
    hint: "text-blue-600",
    spark: "#2563eb",
  },
  red: {
    card: "bg-[#ffeeee]",
    label: "text-rose-800",
    value: "text-rose-900",
    hint: "text-rose-600",
    spark: "#e11d48",
  },
  amber: {
    card: "bg-[#fff5e0]",
    label: "text-amber-800",
    value: "text-amber-900",
    hint: "text-amber-600",
    spark: "#d97706",
  },
  violet: {
    card: "bg-[#f3ecff]",
    label: "text-violet-800",
    value: "text-violet-900",
    hint: "text-violet-600",
    spark: "#7c3aed",
  },
  cyan: {
    card: "bg-[#e6f6fa]",
    label: "text-cyan-800",
    value: "text-cyan-900",
    hint: "text-cyan-600",
    spark: "#0891b2",
  },
};

type KpiCard = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  tone: KpiTone;
  section: OverviewSection;
};

const kpiCards: KpiCard[] = [
  {
    id: "on-time",
    labelKey: "onTime",
    icon: CheckCircle2,
    tone: "green",
    section: "projects",
  },
  {
    id: "running",
    labelKey: "running",
    icon: FolderKanban,
    tone: "blue",
    section: "projects",
  },
  {
    id: "late-projects",
    labelKey: "lateProjects",
    icon: AlertTriangle,
    tone: "red",
    section: "projects",
  },
  {
    id: "overdue-tasks",
    labelKey: "overdueTasks",
    icon: Clock3,
    tone: "amber",
    section: "risks",
  },
  {
    id: "open-issues",
    labelKey: "openIssues",
    icon: CircleAlert,
    tone: "violet",
    section: "risks",
  },
  {
    id: "slow-people",
    labelKey: "slowPeople",
    icon: Users,
    tone: "cyan",
    section: "workload",
  },
];

export default function OrgOverviewDashboardPage() {
  const { t } = useTranslation();
  const { period, setPeriod } = useOverviewPeriod();

  const projects = useMemo(() => getProjectHealthList(), []);
  const heatRows = useMemo(() => departments.map(getDepartmentHeat), []);
  const risk = useMemo(() => getOrgRisk(period), [period]);

  const trendSeries = chartSeries.map((item) => ({
    ...item,
    label: t(`pages.workOverview.${item.labelKey}`),
  }));

  return (
    <main className="flex flex-col gap-3 p-4 xl:h-svh xl:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </span>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            {t("pages.orgDashboard.title")}
          </h1>
        </div>
        <PeriodSwitch period={period} onChange={setPeriod} />
      </header>

      <section className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card) => {
          const trend = kpiTrends[card.id];
          const last = trend.values[trend.values.length - 1];
          const previous = trend.values[trend.values.length - 2];
          const diff = last - previous;
          const good = diff === 0 ? null : diff > 0 === trend.higherIsBetter;
          const Icon = card.icon;
          const tone = kpiTones[card.tone];

          return (
            <Link
              key={card.id}
              to={overviewPath(card.section, period)}
              className={cn(
                "flex min-w-0 flex-col justify-between gap-2 rounded-2xl p-3 transition-shadow hover:shadow-md",
                tone.card,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-[11px] font-semibold tracking-wide uppercase",
                    tone.label,
                  )}
                >
                  {t(`pages.orgDashboard.kpi.${card.labelKey}`)}
                </p>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/90",
                    tone.hint,
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-3xl leading-none font-bold tracking-tight tabular-nums",
                      tone.value,
                    )}
                  >
                    {getSnapshotValue(period, card.id)}
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-[11px] font-semibold",
                      good === null && tone.hint,
                      good === true && "text-emerald-600",
                      good === false && "text-rose-600",
                    )}
                  >
                    {diff > 0 ? "▲" : diff < 0 ? "▼" : "–"} {Math.abs(diff)}
                  </p>
                </div>
                <Sparkline
                  values={trend.values}
                  color={tone.spark}
                  className="h-9 w-16 shrink-0"
                />
              </div>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-12 xl:grid-rows-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <OverviewPanel
          title={t("pages.orgDashboard.health.title")}
          to={overviewPath("projects", period)}
          className="min-h-72 xl:col-span-5"
        >
          <ProjectHealthChart projects={projects} />
        </OverviewPanel>

        <OverviewPanel
          title={t("pages.orgDashboard.heat.title")}
          to={overviewPath("departments", period)}
          className="min-h-64 xl:col-span-4"
        >
          <DepartmentHeatmap rows={heatRows} />
        </OverviewPanel>

        <OverviewPanel
          title={t("pages.orgDashboard.risk.title")}
          to={overviewPath("risks", period)}
          className="min-h-64 xl:col-span-3"
        >
          <RiskGauge risk={risk} />
        </OverviewPanel>

        <OverviewPanel
          title={t("pages.orgDashboard.trend.title")}
          className="min-h-52 xl:col-span-5"
        >
          <AreaTrendChart labels={chartLabels} series={trendSeries} />
        </OverviewPanel>

        <OverviewPanel
          title={t("pages.orgDashboard.workload.title")}
          to={overviewPath("workload", period)}
          className="min-h-52 xl:col-span-4"
        >
          <WorkloadBars rows={workload} limit={5} />
        </OverviewPanel>

        <OverviewPanel
          title={t("pages.orgDashboard.activity.title")}
          to={overviewPath("activity", period)}
          className="min-h-52 xl:col-span-3"
        >
          <ActivityList items={activities.slice(0, 4)} compact />
        </OverviewPanel>
      </div>
    </main>
  );
}
