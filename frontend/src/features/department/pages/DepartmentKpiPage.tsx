import { useState } from "react";
import { Link } from "react-router-dom";
import { Gauge, LifeBuoy, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import DashboardCard from "@/components/shared/dashboard/DashboardCard";
import GroupedBars from "@/components/shared/dashboard/GroupedBars";
import StatCard from "@/components/shared/dashboard/StatCard";
import Pagination from "@/components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";
import TrendChart from "@/features/work/components/TrendChart";
import DepartmentPageHeader from "@/features/department/components/DepartmentPageHeader";
import FilterSelect from "@/features/department/components/FilterSelect";
import MemberAvatar from "@/features/department/components/MemberAvatar";
import SegmentedControl from "@/features/department/components/SegmentedControl";
import { departmentTrend } from "@/features/department/data/department.mock";
import { useDepartmentStore } from "@/features/department/store/department.store";
import type {
  KpiRange,
  MemberKpi,
} from "@/features/department/types/department.type";
import { kpiTotals } from "@/features/department/utils/department-metrics";
import {
  percentOf,
  scoreBadge,
  shiftIso,
  todayIso,
} from "@/features/department/utils/department-task";

type SortKey = "score" | "late" | "reopened" | "effort";

const RANGES: KpiRange[] = ["week", "month", "custom"];
const SORT_KEYS: SortKey[] = ["score", "late", "reopened", "effort"];
const SUPPORT_THRESHOLD = 70;
const MONTH_DAYS = 30;
const PAGE_SIZE = 5;

const COLORS = {
  primary: "#0A6AF6",
  emerald: "#10b981",
  amber: "#f59e0b",
  violet: "#7c3aed",
  slate: "#94a3b8",
};

function rangeFactor(range: KpiRange, from: string, to: string) {
  if (range === "week") return 0.25;
  if (range === "month") return 1;
  const days = Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
  return Math.max(0.1, Math.min(3, (days + 1) / MONTH_DAYS));
}

function scaleKpi(item: MemberKpi, factor: number): MemberKpi {
  const scale = (value: number) => Math.max(0, Math.round(value * factor));
  return {
    ...item,
    assigned: scale(item.assigned),
    done: scale(item.done),
    late: scale(item.late),
    reopened: scale(item.reopened),
    estimatedHours: scale(item.estimatedHours),
    actualHours: scale(item.actualHours),
  };
}

function effortVariance(item: MemberKpi) {
  return item.estimatedHours > 0
    ? Math.round(
        ((item.actualHours - item.estimatedHours) / item.estimatedHours) * 100,
      )
    : 0;
}

export default function DepartmentKpiPage() {
  const { t } = useTranslation();
  const members = useDepartmentStore((state) => state.members);
  const kpis = useDepartmentStore((state) => state.kpis);

  const today = todayIso();
  const [range, setRange] = useState<KpiRange>("month");
  const [from, setFrom] = useState(shiftIso(today, -13));
  const [to, setTo] = useState(today);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const factor = rangeFactor(range, from, to);
  const scaled = kpis.map((item) => scaleKpi(item, factor));
  const totals = kpiTotals(scaled);
  const baseTotals = kpiTotals(kpis);

  const sorted = [...scaled].sort((left, right) => {
    if (sortKey === "late") return right.late - left.late;
    if (sortKey === "reopened") return right.reopened - left.reopened;
    if (sortKey === "effort") return effortVariance(right) - effortVariance(left);
    return right.score - left.score;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const memberOf = (id: number) => members.find((member) => member.id === id);
  const needSupport = scaled
    .filter((item) => item.score < SUPPORT_THRESHOLD)
    .sort((left, right) => left.score - right.score);

  const selected = scaled.find((item) => item.memberId === selectedId) ?? null;
  const selectedMember = selected ? memberOf(selected.memberId) : null;

  const effortGroups = scaled.map((item) => ({
    label: memberOf(item.memberId)?.name.split(" ").slice(-1)[0] ?? "",
    values: [item.estimatedHours, item.actualHours],
  }));

  const trendSeries = selected
    ? [
        {
          key: "member",
          label: selectedMember?.name ?? "",
          color: COLORS.primary,
          values: selected.trend,
        },
        {
          key: "team",
          label: t("department.kpi.teamAverage"),
          color: COLORS.slate,
          values: departmentTrend.labels.map((_, index) =>
            Math.round(
              kpis.reduce((sum, item) => sum + item.trend[index], 0) /
                kpis.length,
            ),
          ),
        },
      ]
    : [
        {
          key: "completion",
          label: t("department.kpi.completionRate"),
          color: COLORS.emerald,
          values: departmentTrend.completionRate,
        },
        {
          key: "onTime",
          label: t("department.kpi.onTimeRate"),
          color: COLORS.primary,
          values: departmentTrend.onTimeRate,
        },
      ];

  const totalDelta = totals.averageScore - baseTotals.averageScore;

  return (
    <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <DepartmentPageHeader
        icon={Gauge}
        title={t("department.kpi.title")}
        subtitle={t("department.kpi.subtitle")}
        actions={
          <>
            {range === "custom" && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <input
                  type="date"
                  value={from}
                  max={to}
                  aria-label={t("department.kpi.from")}
                  onChange={(event) => setFrom(event.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary"
                />
                <span>–</span>
                <input
                  type="date"
                  value={to}
                  min={from}
                  aria-label={t("department.kpi.to")}
                  onChange={(event) => setTo(event.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary"
                />
              </div>
            )}
            <SegmentedControl
              value={range}
              onChange={setRange}
              options={RANGES.map((key) => ({
                value: key,
                label: t(`department.kpi.ranges.${key}`),
              }))}
            />
          </>
        }
      />

      <section className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
        <StatCard
          label={t("department.kpi.averageScore")}
          value={String(totals.averageScore)}
          hint={t("department.kpi.vsPrevious", {
            delta: `${totalDelta >= 0 ? "+" : ""}${totalDelta}`,
          })}
          icon={<Gauge className="size-4" />}
          tone="blue"
        />
        <StatCard
          label={t("department.kpi.doneTasks")}
          value={`${totals.done}/${totals.assigned}`}
          hint={t("department.kpi.completionHint", {
            percent: totals.completionRate,
          })}
          icon={<TrendingUp className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label={t("department.kpi.lateTasks")}
          value={String(totals.late)}
          hint={t("department.kpi.reopenedHint", { count: totals.reopened })}
          icon={<TrendingDown className="size-4" />}
          tone="rose"
        />
        <StatCard
          label={t("department.kpi.effort")}
          value={`${totals.actualHours}h`}
          hint={t("department.kpi.effortHint", {
            planned: totals.estimatedHours,
            percent: percentOf(totals.actualHours, totals.estimatedHours),
          })}
          icon={<Gauge className="size-4" />}
          tone="violet"
        />
      </section>

      <DashboardCard
        title={t("department.kpi.memberTable")}
        extra={
          <FilterSelect
            value={sortKey}
            label={t("department.kpi.sortBy")}
            onChange={(value) => {
              setSortKey(value as SortKey);
              setPage(1);
            }}
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`department.kpi.sort.${key}`)}
              </option>
            ))}
          </FilterSelect>
        }
      >
        <Table containerClassName="border-0 shadow-none">
          <TableHeader>
            <TableRow>
              <TableHead>{t("department.kpi.columns.member")}</TableHead>
              <TableHead className="text-right">
                {t("department.kpi.columns.done")}
              </TableHead>
              <TableHead className="text-right">
                {t("department.kpi.columns.late")}
              </TableHead>
              <TableHead className="text-right">
                {t("department.kpi.columns.reopened")}
              </TableHead>
              <TableHead className="text-right">
                {t("department.kpi.columns.effort")}
              </TableHead>
              <TableHead className="text-right">
                {t("department.kpi.columns.score")}
              </TableHead>
              <TableHead className="text-right">
                {t("department.kpi.columns.change")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.map((item) => {
              const member = memberOf(item.memberId);
              if (!member) return null;
              const variance = effortVariance(item);
              const delta = item.score - item.previousScore;
              return (
                <TableRow key={item.memberId}>
                  <TableCell>
                    <Link
                      to={`/work/kpi?member=${member.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <MemberAvatar id={member.id} name={member.name} />
                      <span className="font-medium text-slate-800">
                        {member.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {item.done}/{item.assigned}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      item.late > 0 ? "font-semibold text-rose-600" : "text-slate-600",
                    )}
                  >
                    {item.late}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {item.reopened}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      variance > 10 ? "text-rose-600" : "text-slate-600",
                    )}
                  >
                    {item.actualHours}/{item.estimatedHours}h
                    <span className="ml-1 text-xs">
                      ({variance > 0 ? "+" : ""}
                      {variance}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        scoreBadge(item.score),
                      )}
                    >
                      {item.score}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-xs font-medium",
                      delta >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="mt-3 text-xs text-slate-400">
            {t("department.kpi.tableHint")}
          </p>
        </div>
        <Pagination
          pagination={{
            page: currentPage,
            limit: PAGE_SIZE,
            total: sorted.length,
            totalPages,
          }}
          onPageChange={setPage}
        />
      </DashboardCard>

      <section className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DashboardCard
          title={
            selectedMember
              ? t("department.kpi.trendOf", { name: selectedMember.name })
              : t("department.kpi.trend")
          }
          extra={
            <FilterSelect
              value={selectedId === null ? "all" : String(selectedId)}
              label={t("department.kpi.trendFilter")}
              onChange={(value) =>
                setSelectedId(value === "all" ? null : Number(value))
              }
            >
              <option value="all">{t("department.kpi.allMembers")}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </FilterSelect>
          }
        >
          <TrendChart
            labels={departmentTrend.labels}
            series={trendSeries}
            valueSuffix={selected ? "" : "%"}
          />
        </DashboardCard>

        <DashboardCard title={t("department.kpi.needSupport")}>
          {needSupport.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              {t("department.kpi.noSupport")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {needSupport.map((item) => {
                const member = memberOf(item.memberId);
                if (!member) return null;
                const reasons = [
                  item.late > 0 &&
                    t("department.kpi.reason.late", { count: item.late }),
                  item.reopened > 0 &&
                    t("department.kpi.reason.reopened", {
                      count: item.reopened,
                    }),
                  effortVariance(item) > 10 &&
                    t("department.kpi.reason.effort", {
                      percent: effortVariance(item),
                    }),
                ].filter(Boolean);
                return (
                  <li
                    key={item.memberId}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <MemberAvatar id={member.id} name={member.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {reasons.join(" · ")}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        scoreBadge(item.score),
                      )}
                    >
                      {item.score}
                    </span>
                    <LifeBuoy className="mt-0.5 size-4 shrink-0 text-slate-300" />
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardCard>
      </section>

      <DashboardCard title={t("department.kpi.effortCompare")}>
        <GroupedBars
          series={[
            { label: t("department.kpi.estimated"), color: COLORS.slate },
            { label: t("department.kpi.actual"), color: COLORS.primary },
          ]}
          groups={effortGroups}
        />
      </DashboardCard>
    </main>
  );
}
