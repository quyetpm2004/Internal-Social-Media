import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Layers,
  LayoutDashboard,
  Loader2,
  Plus,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import DashboardCard from "@/components/shared/dashboard/DashboardCard";
import MeterList from "@/components/shared/dashboard/MeterList";
import NoticeList, {
  type NoticeItem,
} from "@/components/shared/dashboard/NoticeList";
import ProgressRing from "@/components/shared/dashboard/ProgressRing";
import ShareBars from "@/components/shared/dashboard/ShareBars";
import StatCard from "@/components/shared/dashboard/StatCard";
import TrendChart from "@/features/work/components/TrendChart";
import { departmentOverviewApi } from "@/features/department/api/department-overview.api";
import CreateTaskModal from "@/features/department/components/CreateTaskModal";
import DepartmentPageHeader from "@/features/department/components/DepartmentPageHeader";
import MemberAvatar from "@/features/department/components/MemberAvatar";
import SegmentedControl from "@/features/department/components/SegmentedControl";
import { useDepartmentStore } from "@/features/department/store/department.store";
import type {
  DepartmentOverview,
  OverviewPeriod,
} from "@/features/department/types/department.type";
import {
  formatDue,
  percentOf,
  scoreBadge,
} from "@/features/department/utils/department-task";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { cn } from "@/lib/utils";

const COLORS = {
  primary: "#0A6AF6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#7c3aed",
  slate: "#94a3b8",
};

const PERIODS: OverviewPeriod[] = ["week", "month", "quarter"];

const STATUS_ITEMS = [
  { key: "todo", color: COLORS.slate },
  { key: "inProgress", color: COLORS.primary },
  { key: "done", color: COLORS.emerald },
  { key: "cancelled", color: COLORS.rose },
] as const;

function trendLabel(period: OverviewPeriod, from: string) {
  const [, month, day] = from.split("-");
  return period === "quarter" ? `Th ${month}` : `${day}/${month}`;
}

export default function DepartmentDashboardPage() {
  const { t } = useTranslation();
  const storeMembers = useDepartmentStore((state) => state.members);
  const addTask = useDepartmentStore((state) => state.addTask);
  const [creating, setCreating] = useState(false);
  const [period, setPeriod] = useState<OverviewPeriod>("month");
  const [result, setResult] = useState<{
    period: OverviewPeriod;
    data: DepartmentOverview | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    departmentOverviewApi
      .getOverview(period)
      .then((response) => {
        if (!cancelled) setResult({ period, data: response.data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResult({ period, data: null });
        toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const loading = result?.period !== period;
  const data = loading ? null : result.data;

  const header = (
    <DepartmentPageHeader
      icon={LayoutDashboard}
      title={t("department.dashboard.title", {
        name: data?.department.name ?? "",
      })}
      subtitle={t("department.dashboard.subtitle")}
      actions={
        <>
          <SegmentedControl
            value={period}
            options={PERIODS.map((key) => ({
              value: key,
              label: t(`pages.kpi.periods.${key}`),
            }))}
            onChange={setPeriod}
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {t("department.createTask.button")}
          </button>
        </>
      }
    />
  );

  const createModal = (
    <CreateTaskModal
      open={creating}
      members={storeMembers}
      onClose={() => setCreating(false)}
      onSubmit={addTask}
    />
  );

  if (!data) {
    return (
      <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        {header}
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            t("pages.kpi.loadFailed")
          )}
        </div>
        {createModal}
      </main>
    );
  }

  const { summary, counts, members } = data;
  const memberById = (id: number) => members.find((member) => member.id === id);
  const maxOpen = Math.max(1, ...members.map((member) => member.workload.open));

  const workloadRows = [...members]
    .sort((left, right) => right.workload.open - left.workload.open)
    .map((member) => ({
      name: member.name,
      detail: t("department.dashboard.workloadDetail", {
        count: member.workload.open,
        hours: member.workload.remainingHours,
      }),
      percent: percentOf(member.workload.open, maxOpen),
      color: member.workload.overdue > 0 ? COLORS.rose : COLORS.emerald,
    }));

  const statusTotal = Object.values(data.status).reduce(
    (sum, value) => sum + value,
    0,
  );
  const statusRows = STATUS_ITEMS.map(({ key, color }) => ({
    label: t(`pages.kpi.status.${key}`),
    value: data.status[key],
    percent: percentOf(data.status[key], statusTotal),
    color,
  }));

  const priorityItems: NoticeItem[] = data.priorityTasks.map((task) => ({
    id: task.id,
    title: `${task.code} · ${task.title}`,
    meta: `${t("department.fields.dueDate")}: ${formatDue(task.dueDate)} · ${
      task.assignees.map((assignee) => assignee.name).join(", ") ||
      t("department.tasks.unassigned")
    } · ${task.project}`,
    badge:
      task.kind === "overdue"
        ? t("department.dashboard.overdueDays", { count: task.lateDays })
        : t("department.dashboard.dueToday"),
    tone: task.kind === "overdue" ? "rose" : "amber",
  }));

  const scored = (ids: number[]) =>
    ids.flatMap((id) => {
      const member = memberById(id);
      return member && member.score !== null
        ? [{ member, score: member.score }]
        : [];
    });
  const topPerformers = scored(data.topPerformers);
  const needSupport = scored(data.needSupport);

  const renderScoreList = (items: ReturnType<typeof scored>) => (
    <ul className="space-y-2">
      {items.map(({ member, score }) => (
        <li key={member.id} className="flex items-center gap-2.5">
          <MemberAvatar id={member.id} name={member.name} />
          <span className="flex-1 truncate text-sm text-slate-700">
            {member.name}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              scoreBadge(score),
            )}
          >
            {score}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      {header}

      <section className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-5">
        <StatCard
          label={t("department.dashboard.running")}
          value={String(summary.running)}
          hint={t("department.dashboard.runningHint", {
            count: summary.memberCount,
          })}
          icon={<Layers className="size-4" />}
          tone="blue"
        />
        <StatCard
          label={t("department.dashboard.done")}
          value={String(summary.done)}
          hint={t("department.dashboard.doneHint", {
            percent: summary.completionRate ?? 0,
          })}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label={t("department.dashboard.overdue")}
          value={String(summary.overdue)}
          hint={t("department.dashboard.overdueHint")}
          icon={<AlertTriangle className="size-4" />}
          tone="rose"
        />
        <StatCard
          label={t("department.dashboard.dueToday")}
          value={String(summary.dueToday)}
          hint={t("department.dashboard.dueTodayHint")}
          icon={<CalendarClock className="size-4" />}
          tone="violet"
        />
        <StatCard
          label={t("department.dashboard.onTime")}
          value={summary.onTimeRate === null ? "—" : `${summary.onTimeRate}%`}
          hint={t("department.dashboard.onTimeHint")}
          icon={<Timer className="size-4" />}
          tone="violet"
        />
      </section>

      <section className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DashboardCard
          title={t("department.dashboard.workload")}
          extra={
            <Link
              to="/work/department/members"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("department.dashboard.viewAll")}
            </Link>
          }
        >
          <MeterList rows={workloadRows} />
          <p className="mt-4 text-xs text-slate-400">
            {t("department.dashboard.workloadHint")}
          </p>
        </DashboardCard>

        <DashboardCard title={t("department.dashboard.progress")}>
          <ProgressRing
            percent={summary.completionRate ?? 0}
            items={[
              {
                label: t("department.dashboard.assigned"),
                value: counts.assigned,
                color: COLORS.slate,
              },
              {
                label: t("department.dashboard.doneShort"),
                value: counts.done,
                color: COLORS.emerald,
              },
              {
                label: t("department.dashboard.lateShort"),
                value: counts.late,
                color: COLORS.rose,
              },
              {
                label: t("department.dashboard.reopened"),
                value: counts.reopened ?? "—",
                color: COLORS.violet,
              },
            ]}
          />
          <div className="mt-5 border-t border-slate-100 pt-4">
            <ShareBars items={statusRows} />
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DashboardCard title={t("department.dashboard.priorityTasks")}>
          {priorityItems.length > 0 ? (
            <NoticeList items={priorityItems} />
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              {t("department.dashboard.noPriority")}
            </p>
          )}
        </DashboardCard>

        <DashboardCard
          title={t("department.dashboard.kpiOverview")}
          extra={
            <Link
              to="/work/department/kpi"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("department.dashboard.viewAll")}
            </Link>
          }
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-xl px-3 py-1.5 text-2xl font-bold",
                summary.score === null
                  ? "bg-slate-100 text-slate-500"
                  : scoreBadge(summary.score),
              )}
            >
              {summary.score ?? "—"}
            </span>
            <p className="text-xs text-slate-500">
              {t("department.dashboard.averageScore")}
            </p>
          </div>

          <p className="mt-4 mb-2 text-xs font-semibold text-slate-500">
            {t("department.dashboard.topPerformers")}
          </p>
          {renderScoreList(topPerformers)}

          <p className="mt-4 mb-2 text-xs font-semibold text-slate-500">
            {t("department.dashboard.needSupport")}
          </p>
          {needSupport.length > 0 ? (
            renderScoreList(needSupport)
          ) : (
            <p className="text-sm text-slate-400">
              {t("department.dashboard.noSupport")}
            </p>
          )}
        </DashboardCard>
      </section>

      <DashboardCard title={t("department.dashboard.trend")}>
        <TrendChart
          labels={data.trend.map((point) => trendLabel(period, point.from))}
          valueSuffix="%"
          series={[
            {
              key: "completion",
              label: t("department.kpi.completionRate"),
              color: COLORS.emerald,
              values: data.trend.map((point) => point.completionRate ?? 0),
            },
            {
              key: "onTime",
              label: t("department.kpi.onTimeRate"),
              color: COLORS.primary,
              values: data.trend.map((point) => point.onTimeRate ?? 0),
            },
          ]}
        />
      </DashboardCard>

      {createModal}
    </main>
  );
}
