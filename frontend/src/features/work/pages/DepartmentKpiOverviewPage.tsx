import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Gauge,
  Minus,
  Target,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StatCard, { type StatTone } from "@/components/shared/dashboard/StatCard";
import { cn } from "@/lib/utils";
import {
  organizationKpiApi,
  type OrganizationKpi,
} from "@/features/department/api/department-org.api";
import { scoreBadge } from "@/features/department/utils/department-task";
import { toastApiError } from "@/features/project-template/utils/api-error";
import type { KpiPeriod } from "@/features/work/types/kpi.type";

const PERIODS: KpiPeriod[] = ["week", "month", "quarter"];

/** Giám đốc: so sánh KPI giữa các phòng ban và điểm toàn tổ chức (chỉ đọc). */
export default function DepartmentKpiOverviewPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<KpiPeriod>("month");
  const [result, setResult] = useState<{
    period: KpiPeriod;
    data: OrganizationKpi | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    organizationKpiApi
      .overview(period)
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
  const summary = data?.summary;
  const topDepartment = data?.departments.find(
    (department) => department.id === data.topDepartments[0],
  );
  // Màu thẻ điểm theo mức điểm, cùng ngưỡng với huy hiệu điểm trong bảng.
  const scoreTone: StatTone =
    summary?.score == null
      ? "blue"
      : summary.score >= 85
        ? "emerald"
        : summary.score >= 70
          ? "blue"
          : "rose";

  return (
    <main className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {t("director.kpi.title")}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{t("director.kpi.subtitle")}</p>
          </div>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                item === period
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {t(`director.kpi.period.${item}`)}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("director.kpi.orgAverage")}
          value={summary?.score != null ? String(summary.score) : "—"}
          hint={
            summary?.score != null && summary.previousScore != null
              ? t("director.kpi.summary.scoreHint", {
                  previous: summary.previousScore,
                })
              : t("director.kpi.outOf")
          }
          icon={<Gauge className="size-4" />}
          tone={scoreTone}
        />
        <StatCard
          label={t("director.kpi.summary.departments")}
          value={summary ? String(summary.departmentCount) : "—"}
          hint={
            topDepartment
              ? t("director.kpi.summary.departmentsHint", {
                  name: topDepartment.name,
                })
              : t("director.kpi.summary.noData")
          }
          icon={<Building2 className="size-4" />}
          tone="violet"
        />
        <StatCard
          label={t("director.kpi.summary.members")}
          value={summary ? String(summary.memberCount) : "—"}
          hint={t("director.kpi.summary.membersHint", {
            count: summary?.departmentCount
              ? Math.round(summary.memberCount / summary.departmentCount)
              : 0,
          })}
          icon={<Users className="size-4" />}
          tone="blue"
        />
        <StatCard
          label={t("director.kpi.summary.late")}
          value={summary ? String(summary.late) : "—"}
          hint={t("director.kpi.summary.lateHint", {
            count: summary?.assigned ?? 0,
          })}
          icon={<AlertTriangle className="size-4" />}
          tone="rose"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("director.kpi.columns.department")}</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                {t("director.kpi.columns.manager")}
              </th>
              <th className="px-4 py-3 font-medium">{t("director.kpi.columns.score")}</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                {t("director.kpi.columns.completion")}
              </th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                {t("director.kpi.columns.onTime")}
              </th>
              <th className="px-4 py-3 font-medium">{t("director.kpi.columns.change")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {t("common.loading")}
                </td>
              </tr>
            )}
            {data?.departments.map((row) => {
              const change =
                row.score !== null && row.previousScore !== null
                  ? row.score - row.previousScore
                  : null;
              return (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <Link
                      to={`/work/departments/${row.id}/kpi`}
                      className="hover:text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {t("director.kpi.memberCount", { count: row.memberCount })}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {row.manager?.fullName ?? t("director.noManager")}
                  </td>
                  <td className="px-4 py-3">
                    {row.score === null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          scoreBadge(row.score),
                        )}
                      >
                        {row.score}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {row.completionRate === null ? "—" : `${row.completionRate}%`}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {row.onTimeRate === null ? "—" : `${row.onTimeRate}%`}
                  </td>
                  <td className="px-4 py-3">
                    {change === null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-medium",
                          change > 0
                            ? "text-emerald-600"
                            : change < 0
                              ? "text-rose-600"
                              : "text-slate-400",
                        )}
                      >
                        {change > 0 ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : change < 0 ? (
                          <ArrowDownRight className="size-3.5" />
                        ) : (
                          <Minus className="size-3.5" />
                        )}
                        {Math.abs(change)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {data && data.departments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {t("director.kpi.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
