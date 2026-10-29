import { useEffect, useState } from "react";
import {
  Gauge,
  Hourglass,
  Loader2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import BudgetMeter from "@/components/shared/dashboard/BudgetMeter";
import DashboardCard from "@/components/shared/dashboard/DashboardCard";
import MeterList, {
  type MeterRow,
} from "@/components/shared/dashboard/MeterList";
import NoticeList, {
  type NoticeItem,
  type NoticeTone,
} from "@/components/shared/dashboard/NoticeList";
import ProgressRing from "@/components/shared/dashboard/ProgressRing";
import ShareBars, {
  type ShareBarItem,
} from "@/components/shared/dashboard/ShareBars";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { departmentKpiApi } from "@/features/department/api/department-kpi.api";
import MemberKpiBanner from "@/features/department/components/MemberKpiBanner";
import { useDepartmentStore } from "@/features/department/store/department.store";
import ForbiddenPage from "@/features/forbidden/pages/ForbiddenPage";
import { toastApiError } from "@/features/project-template/utils/api-error";
import { kpiApi } from "@/features/work/api/kpi.api";
import TrendChart from "@/features/work/components/TrendChart";
import type {
  KpiAttentionItem,
  KpiMetricId,
  KpiPeriod,
  KpiResponse,
} from "@/features/work/types/kpi.type";

const PERIODS: KpiPeriod[] = ["week", "month", "quarter"];

const METRIC_IDS: KpiMetricId[] = [
  "completionRate",
  "onTimeRate",
  "avgDelayDays",
  "effortVariance",
  "reopenRate",
];

const HIGHER_IS_BETTER: Record<KpiMetricId, boolean> = {
  completionRate: true,
  onTimeRate: true,
  avgDelayDays: false,
  effortVariance: false,
  reopenRate: false,
};

const COLORS = {
  primary: "#0A6AF6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#7c3aed",
  slate: "#94a3b8",
};

const attentionTones: Record<KpiAttentionItem["kind"], NoticeTone> = {
  overdue: "rose",
  reopened: "orange",
  overEffort: "amber",
};

const EMPTY = "—";

function formatMetric(id: KpiMetricId, value: number) {
  switch (id) {
    case "avgDelayDays":
      return value.toFixed(1);
    case "effortVariance":
      return `${value > 0 ? "+" : ""}${value}%`;
    default:
      return `${value}%`;
  }
}

function targetPercent(id: KpiMetricId, value: number, target: number) {
  const ratio = HIGHER_IS_BETTER[id]
    ? value / target
    : target / Math.max(value, 0.01);
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100);
}

function scoreBadge(score: number) {
  if (score >= 85) return "bg-emerald-50 text-emerald-700";
  if (score >= 70) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-600";
}

function rate(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function trendLabel(period: KpiPeriod, from: string) {
  const [, month, day] = from.split("-");
  return period === "quarter" ? `Th ${month}` : `${day}/${month}`;
}

/** Vùng giữ chỗ cho các phần chưa có dữ liệu log (effort thực tế, mở lại task). */
function PendingHint({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
      <Hourglass className="size-5 text-slate-300" />
      <p className="max-w-xs text-xs text-slate-400">{message}</p>
    </div>
  );
}

export default function KpiPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const role = useAuthStore((state) => state.user?.role);
  const departmentMembers = useDepartmentStore((state) => state.members);
  const memberParam = searchParams.get("member");
  const viewedMember = memberParam
    ? (departmentMembers.find((item) => String(item.id) === memberParam) ?? null)
    : null;
  const forbidden = memberParam !== null && (role !== "MANAGER" || !viewedMember);
  const [period, setPeriod] = useState<KpiPeriod>("month");
  const [result, setResult] = useState<{
    period: KpiPeriod;
    data: KpiResponse | null;
  } | null>(null);

  useEffect(() => {
    if (forbidden) return;
    let cancelled = false;
    const request = viewedMember
      ? departmentKpiApi.getMemberKpi(viewedMember.id, period)
      : kpiApi.getMyKpi(period);
    request
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
  }, [period, forbidden, viewedMember]);

  if (forbidden) return <ForbiddenPage />;

  const loading = result?.period !== period;
  const data = loading ? null : result.data;

  const header = (
    <header className="flex flex-col gap-4 @3xl:flex-row @3xl:items-start @3xl:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Gauge className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t("pages.kpi.title")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {t("pages.kpi.subtitle")}
          </p>
        </div>
      </div>

      <div className="inline-flex self-start rounded-xl bg-slate-100 p-1">
        {PERIODS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              period === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {t(`pages.kpi.periods.${key}`)}
          </button>
        ))}
      </div>
    </header>
  );

  const memberBanner = viewedMember ? (
    <MemberKpiBanner member={viewedMember} rank={data?.rank ?? null} total={data?.teamSize ?? null} />
  ) : null;

  if (!data) {
    return (
      <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        {header}
        {memberBanner}
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            t("pages.kpi.loadFailed")
          )}
        </div>
      </main>
    );
  }

  const score = data.score ?? 0;
  const scoreDelta =
    data.score !== null && data.previousScore !== null
      ? data.score - data.previousScore
      : null;

  const statusTotal =
    data.status.todo +
    data.status.inProgress +
    data.status.done +
    data.status.cancelled;
  const statusItems: ShareBarItem[] = (
    [
      ["todo", COLORS.slate],
      ["inProgress", COLORS.primary],
      ["done", COLORS.emerald],
      ["cancelled", COLORS.rose],
    ] as const
  ).map(([key, color]) => ({
    label: t(`pages.kpi.status.${key}`),
    value: data.status[key],
    percent: statusTotal > 0 ? (data.status[key] / statusTotal) * 100 : 0,
    color,
  }));

  const lateTotal = data.delayBuckets.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const delayColors = [COLORS.amber, "#f97316", COLORS.rose, "#be123c"];
  const delayItems: ShareBarItem[] = data.delayBuckets.map((bucket, index) => ({
    label: t("pages.kpi.delayRange", { range: bucket.range }),
    value: bucket.count,
    percent: lateTotal > 0 ? (bucket.count / lateTotal) * 100 : 0,
    color: delayColors[index] ?? COLORS.rose,
  }));

  const reopenRows: MeterRow[] = data.reopenByType.map((item) => ({
    name: item.name,
    detail: `${item.reopened}/${item.total}`,
    percent: rate(item.reopened, item.total),
    color: COLORS.violet,
  }));

  const priorityColors = {
    URGENT: COLORS.rose,
    HIGH: COLORS.amber,
    MEDIUM: COLORS.primary,
    LOW: COLORS.slate,
  };
  const priorityRows: MeterRow[] = data.priority.map((item) => ({
    name: t(`pages.kpi.priority.${item.key}`),
    detail: `${item.done}/${item.total}`,
    percent: rate(item.done, item.total),
    color: priorityColors[item.key],
  }));

  const attentionItems: NoticeItem[] = data.attention.map((item) => ({
    id: item.id,
    title: `${item.code} · ${item.title}`,
    meta: item.project,
    badge: t(`pages.kpi.attention.${item.kind}`, { count: item.amount }),
    tone: attentionTones[item.kind],
  }));

  const hasActualEffort = data.effortByProject.some(
    (item) => item.actualHours !== null,
  );
  const hasReopenTrend = data.trend.some((point) => point.reopenRate !== null);
  const trendSeries = [
    {
      key: "completion",
      label: t("pages.kpi.metrics.completionRate.short"),
      color: COLORS.emerald,
      values: data.trend.map((point) => point.completionRate ?? 0),
    },
    {
      key: "onTime",
      label: t("pages.kpi.metrics.onTimeRate.short"),
      color: COLORS.primary,
      values: data.trend.map((point) => point.onTimeRate ?? 0),
    },
    ...(hasReopenTrend
      ? [
          {
            key: "reopen",
            label: t("pages.kpi.metrics.reopenRate.short"),
            color: COLORS.violet,
            values: data.trend.map((point) => point.reopenRate ?? 0),
          },
        ]
      : []),
  ];

  return (
    <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      {header}
      {memberBanner}

      <section className="grid gap-4 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <DashboardCard
          title={t("pages.kpi.overall")}
          extra={
            data.rank !== null && data.teamSize !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Trophy className="size-3.5" />
                {t("pages.kpi.rank", { rank: data.rank, total: data.teamSize })}
              </span>
            ) : null
          }
        >
          <ProgressRing
            percent={score}
            items={[
              {
                label: t("pages.kpi.counts.assigned"),
                value: data.counts.assigned,
                color: COLORS.slate,
              },
              {
                label: t("pages.kpi.counts.done"),
                value: data.counts.done,
                color: COLORS.emerald,
              },
              {
                label: t("pages.kpi.counts.onTime"),
                value: data.counts.onTime,
                color: COLORS.primary,
              },
              {
                label: t("pages.kpi.counts.late"),
                value: data.counts.late,
                color: COLORS.rose,
              },
              {
                label: t("pages.kpi.counts.reopened"),
                value: data.counts.reopened ?? EMPTY,
                color: COLORS.violet,
              },
            ]}
          />
          {scoreDelta !== null && (
            <p
              className={cn(
                "mt-4 inline-flex items-center gap-1.5 text-xs font-medium",
                scoreDelta >= 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {scoreDelta >= 0 ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
              {t("pages.kpi.scoreDelta", {
                delta: `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`,
              })}
            </p>
          )}
        </DashboardCard>

        <DashboardCard title={t("pages.kpi.vsTarget")}>
          <div className="grid gap-x-6 gap-y-5 @2xl:grid-cols-2">
            {METRIC_IDS.map((id) => {
              const value = data.metrics[id].value;
              const target = data.targets[id];
              const label = t(`pages.kpi.metrics.${id}.short`);
              const targetLabel = t(`pages.kpi.targetOf.${id}`, { target });

              // TODO(kpi-log): effortVariance và reopenRate đang null cho tới khi có log.
              if (value === null) {
                return (
                  <div key={id}>
                    <div className="mb-2 flex items-end justify-between gap-3 text-sm">
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {label}
                        </span>
                        <span className="text-slate-400"> / {targetLabel}</span>
                      </p>
                      <p className="font-bold text-slate-300">{EMPTY}</p>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100" />
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {t("pages.kpi.noData")}
                    </p>
                  </div>
                );
              }

              const percent = targetPercent(id, value, target);
              return (
                <BudgetMeter
                  key={id}
                  usedLabel={`${label}: ${formatMetric(id, value)}`}
                  totalLabel={targetLabel}
                  percent={percent}
                  over={percent < 100}
                  status={t(
                    percent >= 100
                      ? "pages.kpi.targetMet"
                      : "pages.kpi.targetMissed",
                  )}
                />
              );
            })}
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DashboardCard title={t("pages.kpi.trend")}>
          <TrendChart
            labels={data.trend.map((point) => trendLabel(period, point.from))}
            series={trendSeries}
            valueSuffix="%"
          />
        </DashboardCard>

        <DashboardCard title={t("pages.kpi.statusShare")}>
          <ShareBars items={statusItems} />
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              {t("pages.kpi.delayDistribution")}
            </p>
            <ShareBars items={delayItems} />
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* TODO(kpi-log): khi có actualHours, vẽ GroupedBars (dự kiến vs thực tế) thay cho placeholder. */}
        <DashboardCard title={t("pages.kpi.effortCompare")}>
          {hasActualEffort ? null : (
            <PendingHint message={t("pages.kpi.pendingEffort")} />
          )}
        </DashboardCard>

        <div className="grid gap-4">
          {/* TODO(kpi-log): reopenByType do backend trả về khi có lịch sử mở lại. */}
          <DashboardCard title={t("pages.kpi.reopenByType")}>
            {reopenRows.length > 0 ? (
              <MeterList rows={reopenRows} />
            ) : (
              <PendingHint message={t("pages.kpi.pendingReopen")} />
            )}
          </DashboardCard>
          <DashboardCard title={t("pages.kpi.byPriority")}>
            <MeterList rows={priorityRows} />
          </DashboardCard>
        </div>
      </section>

      <section className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DashboardCard title={t("pages.kpi.byProject")}>
          <Table containerClassName="border-0 shadow-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.kpi.table.project")}</TableHead>
                <TableHead className="text-right">
                  {t("pages.kpi.table.done")}
                </TableHead>
                <TableHead className="text-right">
                  {t("pages.kpi.table.onTime")}
                </TableHead>
                <TableHead className="text-right">
                  {t("pages.kpi.table.delay")}
                </TableHead>
                <TableHead className="text-right">
                  {t("pages.kpi.table.effort")}
                </TableHead>
                <TableHead className="text-right">
                  {t("pages.kpi.table.reopen")}
                </TableHead>
                <TableHead className="text-right">
                  {t("pages.kpi.table.score")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.projects.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-6 text-center text-slate-400"
                  >
                    {t("pages.kpi.noProjects")}
                  </TableCell>
                </TableRow>
              )}
              {data.projects.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-slate-800">
                    {row.name}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {row.done}/{row.assigned}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {row.onTimeRate === null ? EMPTY : `${row.onTimeRate}%`}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {row.avgDelayDays === null
                      ? EMPTY
                      : row.avgDelayDays.toFixed(1)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      row.effortVariance !== null && row.effortVariance > 10
                        ? "text-rose-600"
                        : "text-slate-600",
                    )}
                  >
                    {row.effortVariance === null
                      ? EMPTY
                      : formatMetric("effortVariance", row.effortVariance)}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {row.reopenRate === null ? EMPTY : `${row.reopenRate}%`}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.score === null ? (
                      EMPTY
                    ) : (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          scoreBadge(row.score),
                        )}
                      >
                        {row.score}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardCard>

        <DashboardCard title={t("pages.kpi.attentionTitle")}>
          {attentionItems.length > 0 ? (
            <NoticeList items={attentionItems} />
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              {t("pages.kpi.noAttention")}
            </p>
          )}
        </DashboardCard>
      </section>
    </main>
  );
}
