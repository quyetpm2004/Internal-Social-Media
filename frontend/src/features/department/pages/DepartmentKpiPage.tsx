import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge, LifeBuoy, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import DashboardCard from "@/components/shared/dashboard/DashboardCard";
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
import { departmentMemberKpiApi } from "@/features/department/api/department-member-kpi.api";
import DepartmentPageHeader from "@/features/department/components/DepartmentPageHeader";
import FilterSelect from "@/features/department/components/FilterSelect";
import MemberAvatar from "@/features/department/components/MemberAvatar";
import SegmentedControl from "@/features/department/components/SegmentedControl";
import type {
  DepartmentKpi,
  KpiRange,
} from "@/features/department/types/department.type";
import {
  scoreBadge,
  shiftIso,
  todayIso,
} from "@/features/department/utils/department-task";
import { toastApiError } from "@/features/project-template/utils/api-error";

type SortKey = "score" | "late";

const RANGES: KpiRange[] = ["week", "month", "custom"];
const SORT_KEYS: SortKey[] = ["score", "late"];
const PAGE_SIZE = 5;

const COLORS = {
  primary: "#0A6AF6",
  emerald: "#10b981",
  slate: "#94a3b8",
};

function bucketLabel(from: string) {
  const [, month, day] = from.split("-");
  return `${day}/${month}`;
}

export default function DepartmentKpiPage() {
  const { t } = useTranslation();

  const today = todayIso();
  const [range, setRange] = useState<KpiRange>("month");
  const [from, setFrom] = useState(shiftIso(today, -13));
  const [to, setTo] = useState(today);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    key: string;
    data: DepartmentKpi | null;
  } | null>(null);

  const validRange = range !== "custom" || (from !== "" && to !== "" && from <= to);
  const requestKey = `${range}|${from}|${to}`;

  useEffect(() => {
    if (!validRange) return;
    let cancelled = false;
    departmentMemberKpiApi
      .getDepartmentKpi(
        range === "custom" ? { period: range, from, to } : { period: range },
      )
      .then((response) => {
        if (!cancelled) setResult({ key: requestKey, data: response.data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResult({ key: requestKey, data: null });
        toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [range, from, to, validRange, requestKey]);

  const loading = result?.key !== requestKey;
  const data = loading ? null : result.data;

  const header = (
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
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary"
              />
              <span>–</span>
              <input
                type="date"
                value={to}
                min={from}
                aria-label={t("department.kpi.to")}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary"
              />
            </div>
          )}
          <SegmentedControl
            value={range}
            onChange={(value) => {
              setRange(value);
              setPage(1);
            }}
            options={RANGES.map((key) => ({
              value: key,
              label: t(`department.kpi.ranges.${key}`),
            }))}
          />
        </>
      }
    />
  );

  if (!data) {
    return (
      <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        {header}
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          {loading && validRange ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            t("pages.kpi.loadFailed")
          )}
        </div>
      </main>
    );
  }

  const { summary, members } = data;

  const sorted = [...members].sort((left, right) => {
    if (sortKey === "late") return right.late - left.late;
    return (right.score ?? -1) - (left.score ?? -1);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const needSupport = data.needSupport.flatMap((id) => {
    const member = members.find((item) => item.id === id);
    return member ? [member] : [];
  });

  const selected = members.find((member) => member.id === selectedId) ?? null;

  const labels = data.trend.map((point) => bucketLabel(point.from));
  const trendSeries = selected
    ? [
        {
          key: "member",
          label: selected.name,
          color: COLORS.primary,
          values: selected.trend.map((value) => value ?? 0),
        },
        {
          key: "team",
          label: t("department.kpi.teamAverage"),
          color: COLORS.slate,
          values: data.trend.map((point) => point.score ?? 0),
        },
      ]
    : [
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
      ];

  const averageScore = summary.score ?? 0;
  const totalDelta = averageScore - (summary.previousScore ?? averageScore);

  return (
    <main className="@container space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      {header}

      <section className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
        <StatCard
          label={t("department.kpi.averageScore")}
          value={summary.score === null ? "—" : String(summary.score)}
          hint={t("department.kpi.vsPrevious", {
            delta: `${totalDelta >= 0 ? "+" : ""}${totalDelta}`,
          })}
          icon={<Gauge className="size-4" />}
          tone="blue"
        />
        <StatCard
          label={t("department.kpi.doneTasks")}
          value={`${summary.done}/${summary.assigned}`}
          hint={t("department.kpi.completionHint", {
            percent: summary.completionRate ?? 0,
          })}
          icon={<TrendingUp className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label={t("department.kpi.lateTasks")}
          value={String(summary.late)}
          hint="—"
          icon={<TrendingDown className="size-4" />}
          tone="rose"
        />
        <StatCard
          label={t("department.kpi.effort")}
          value="—"
          hint="—"
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
              const delta =
                item.score !== null && item.previousScore !== null
                  ? item.score - item.previousScore
                  : null;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      to={`/work/kpi?member=${item.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <MemberAvatar id={item.id} name={item.name} />
                      <span className="font-medium text-slate-800">
                        {item.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {item.done}/{item.assigned}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      item.late > 0
                        ? "font-semibold text-rose-600"
                        : "text-slate-600",
                    )}
                  >
                    {item.late}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">—</TableCell>
                  <TableCell className="text-right text-slate-600">—</TableCell>
                  <TableCell className="text-right">
                    {item.score === null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          scoreBadge(item.score),
                        )}
                      >
                        {item.score}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-xs font-medium",
                      delta === null
                        ? "text-slate-400"
                        : delta >= 0
                          ? "text-emerald-600"
                          : "text-rose-600",
                    )}
                  >
                    {delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta}`}
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
            selected
              ? t("department.kpi.trendOf", { name: selected.name })
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
            labels={labels}
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
                const reasons = [
                  item.late > 0 &&
                    t("department.kpi.reason.late", { count: item.late }),
                ].filter(Boolean);
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <MemberAvatar id={item.id} name={item.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {reasons.join(" · ")}
                      </p>
                    </div>
                    {item.score !== null && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          scoreBadge(item.score),
                        )}
                      >
                        {item.score}
                      </span>
                    )}
                    <LifeBuoy className="mt-0.5 size-4 shrink-0 text-slate-300" />
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardCard>
      </section>
    </main>
  );
}
