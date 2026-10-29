import type {
  KpiPeriod,
  KpiPriorityKey,
  KpiResponse,
} from "@/features/work/types/kpi.type";
import { useDepartmentStore } from "@/features/department/store/department.store";
import {
  percentOf,
  shiftIso,
  taskRules,
  todayIso,
} from "@/features/department/utils/department-task";

const PERIOD_DAYS: Record<KpiPeriod, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};
const TREND_POINTS = 6;
const PRIORITY_KEYS: KpiPriorityKey[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

function buildMemberKpi(memberId: number, period: KpiPeriod): KpiResponse | null {
  const { members, kpis, tasks, statuses } = useDepartmentStore.getState();
  const kpi = kpis.find((item) => item.memberId === memberId);
  if (!kpi || !members.some((member) => member.id === memberId)) return null;

  const { isOverdue } = taskRules(statuses);
  const categoryOf = (statusId: string) =>
    statuses.find((status) => status.id === statusId)?.category ?? "TODO";
  const mine = tasks.filter((task) => task.assigneeIds.includes(memberId));
  const today = todayIso();
  const days = PERIOD_DAYS[period];
  const rank =
    [...kpis]
      .sort((left, right) => right.score - left.score)
      .findIndex((item) => item.memberId === memberId) + 1;
  const variance = percentOf(
    kpi.actualHours - kpi.estimatedHours,
    kpi.estimatedHours,
  );
  const onTime = Math.max(0, kpi.done - kpi.late);
  const step = Math.max(1, Math.floor(days / TREND_POINTS));

  const byProject = new Map<string, typeof mine>();
  for (const task of mine) {
    const name = task.project ?? "—";
    byProject.set(name, [...(byProject.get(name) ?? []), task]);
  }

  return {
    period,
    range: { from: shiftIso(today, -days), to: today },
    previousRange: {
      from: shiftIso(today, -days * 2),
      to: shiftIso(today, -days - 1),
    },
    targets: {
      completionRate: 90,
      onTimeRate: 90,
      avgDelayDays: 1,
      effortVariance: 10,
      reopenRate: 10,
    },
    score: kpi.score,
    previousScore: kpi.previousScore,
    rank,
    teamSize: kpis.length,
    counts: {
      assigned: kpi.assigned,
      done: kpi.done,
      onTime,
      late: kpi.late,
      reopened: kpi.reopened,
    },
    metrics: {
      completionRate: {
        value: percentOf(kpi.done, kpi.assigned),
        previous: null,
      },
      onTimeRate: { value: percentOf(onTime, kpi.done), previous: null },
      avgDelayDays: { value: kpi.late > 0 ? 1.5 : 0, previous: null },
      effortVariance: { value: variance, previous: null },
      reopenRate: { value: percentOf(kpi.reopened, kpi.done), previous: null },
    },
    trend: kpi.trend.map((score, index) => {
      const offset = (TREND_POINTS - 1 - index) * step;
      return {
        from: shiftIso(today, -offset - step),
        to: shiftIso(today, -offset),
        completionRate: score,
        onTimeRate: Math.max(0, score - 6),
        reopenRate: null,
      };
    }),
    status: {
      todo: mine.filter((task) => categoryOf(task.statusId) === "TODO").length,
      inProgress: mine.filter((task) => categoryOf(task.statusId) === "IN_PROGRESS")
        .length,
      done: mine.filter((task) => categoryOf(task.statusId) === "DONE").length,
      cancelled: mine.filter((task) => categoryOf(task.statusId) === "CANCELLED")
        .length,
    },
    delayBuckets: [
      { range: "1-2", count: Math.ceil(kpi.late / 2) },
      { range: "3-5", count: Math.floor(kpi.late / 2) },
      { range: "6-10", count: 0 },
      { range: ">10", count: 0 },
    ],
    effortByProject: [],
    reopenByType: [],
    priority: PRIORITY_KEYS.map((key) => {
      const rows = mine.filter((task) => task.priority === key);
      return {
        key,
        done: rows.filter((task) => categoryOf(task.statusId) === "DONE").length,
        total: rows.length,
      };
    }),
    projects: [...byProject.entries()].map(([name, rows], index) => {
      const done = rows.filter(
        (task) => categoryOf(task.statusId) === "DONE",
      ).length;
      return {
        id: index + 1,
        name,
        assigned: rows.length,
        done,
        onTimeRate: null,
        avgDelayDays: null,
        effortVariance: null,
        reopenRate: null,
        score: null,
      };
    }),
    attention: mine.filter(isOverdue).map((task) => ({
      id: task.id,
      code: task.code,
      title: task.title,
      project: task.project ?? "—",
      kind: "overdue" as const,
      amount: Math.max(
        1,
        Math.round(
          (Date.parse(`${today}T00:00:00Z`) -
            Date.parse(`${task.dueDate}T00:00:00Z`)) /
            86_400_000,
        ),
      ),
    })),
  };
}

export const departmentKpiApi = {
  async getMemberKpi(
    memberId: number,
    period: KpiPeriod,
  ): Promise<{ data: KpiResponse | null }> {
    return { data: buildMemberKpi(memberId, period) };
  },
};
