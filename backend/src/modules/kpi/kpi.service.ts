import { ProjectPriority, WorkflowStatusCategory } from "@prisma/client";
import type { KpiPeriod } from "@/modules/kpi/kpi.schema";
import * as kpiRepository from "@/modules/kpi/kpi.repository";
import type { KpiTaskRow } from "@/modules/kpi/kpi.repository";

/** Mục tiêu KPI mặc định. TODO: cho phép cấu hình theo tổ chức / vai trò. */
export const KPI_TARGETS = {
  completionRate: 90,
  onTimeRate: 90,
  avgDelayDays: 1,
  effortVariance: 10,
  reopenRate: 10,
} as const;

export const DAY_MS = 24 * 60 * 60 * 1000;
export const DELAY_BUCKETS = [
  { range: "1-2", min: 1, max: 2 },
  { range: "3-5", min: 3, max: 5 },
  { range: "6-10", min: 6, max: 10 },
  { range: ">10", min: 11, max: Infinity },
] as const;
export const PRIORITY_ORDER: ProjectPriority[] = [
  ProjectPriority.URGENT,
  ProjectPriority.HIGH,
  ProjectPriority.MEDIUM,
  ProjectPriority.LOW,
];
const ATTENTION_LIMIT = 5;

export type DateRange = { from: string; to: string };

export function vietnamIso(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function utcDate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function addDays(iso: string, days: number) {
  return new Date(utcDate(iso).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function diffDays(laterIso: string, earlierIso: string) {
  return Math.round(
    (utcDate(laterIso).getTime() - utcDate(earlierIso).getTime()) / DAY_MS,
  );
}

export function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function percent(part: number, total: number) {
  return total > 0 ? round((part / total) * 100) : null;
}

/** Khoảng thời gian (theo lịch) của kỳ chứa ngày `anchorIso`. */
export function rangeOf(period: KpiPeriod, anchorIso: string): DateRange {
  const anchor = utcDate(anchorIso);
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();

  if (period === "week") {
    const from = addDays(anchorIso, -((anchor.getUTCDay() + 6) % 7));
    return { from, to: addDays(from, 6) };
  }

  const startMonth = period === "month" ? month : Math.floor(month / 3) * 3;
  const span = period === "month" ? 1 : 3;
  return {
    from: new Date(Date.UTC(year, startMonth, 1)).toISOString().slice(0, 10),
    to: new Date(Date.UTC(year, startMonth + span, 0))
      .toISOString()
      .slice(0, 10),
  };
}

/** Chia kỳ thành các mốc nhỏ để vẽ biểu đồ xu hướng: tuần→ngày, tháng→tuần, quý→tháng. */
export function bucketsOf(period: KpiPeriod, range: DateRange): DateRange[] {
  const buckets: DateRange[] = [];

  if (period === "quarter") {
    const start = utcDate(range.from);
    for (let index = 0; index < 3; index += 1) {
      const from = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
      );
      const to = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index + 1, 0),
      );
      buckets.push({
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      });
    }
    return buckets;
  }

  const size = period === "week" ? 1 : 7;
  for (let from = range.from; from <= range.to; from = addDays(from, size)) {
    const to = addDays(from, size - 1);
    buckets.push({ from, to: to > range.to ? range.to : to });
  }
  return buckets;
}

export type TaskFacts = {
  row: KpiTaskRow;
  dueIso: string;
  category: WorkflowStatusCategory;
  done: boolean;
  lateDays: number;
};

export function toFacts(row: KpiTaskRow, todayIso: string): TaskFacts {
  const dueIso = row.dueDate!.toISOString().slice(0, 10);
  const category = row.status.category;
  const done = category === WorkflowStatusCategory.DONE;
  const endIso = done ? vietnamIso(row.completedAt ?? row.updatedAt) : todayIso;
  const open = category !== WorkflowStatusCategory.CANCELLED;

  return {
    row,
    dueIso,
    category,
    done,
    lateDays: open ? Math.max(0, diffDays(endIso, dueIso)) : 0,
  };
}

export function summarize(facts: TaskFacts[]) {
  const active = facts.filter(
    (item) => item.category !== WorkflowStatusCategory.CANCELLED,
  );
  const done = active.filter((item) => item.done);
  const onTime = done.filter((item) => item.lateDays === 0);
  const late = active.filter((item) => item.lateDays > 0);
  const avgDelayDays = active.length
    ? round(
        late.reduce((sum, item) => sum + item.lateDays, 0) / (late.length || 1),
      )
    : null;

  const completionRate = percent(done.length, active.length);
  const onTimeRate = percent(onTime.length, done.length);

  // Điểm tổng hợp chỉ gồm các chỉ số đã tính được.
  // TODO(kpi-log): thêm effortVariance và reopenRate vào công thức khi có dữ liệu log.
  const parts: { score: number; weight: number }[] = [];
  if (completionRate !== null)
    parts.push({ score: completionRate, weight: 40 });
  if (onTimeRate !== null) parts.push({ score: onTimeRate, weight: 40 });
  if (avgDelayDays !== null) {
    parts.push({ score: Math.max(0, 100 - avgDelayDays * 20), weight: 20 });
  }
  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const score = totalWeight
    ? Math.round(
        parts.reduce((sum, part) => sum + part.score * part.weight, 0) /
          totalWeight,
      )
    : null;

  return {
    active,
    done,
    onTime,
    late,
    completionRate,
    onTimeRate,
    avgDelayDays,
    score,
  };
}

export async function getMyKpi(userId: number, period: KpiPeriod) {
  const todayIso = vietnamIso(new Date());
  const range = rangeOf(period, todayIso);
  const previousRange = rangeOf(period, addDays(range.from, -1));

  // Một truy vấn cho cả kỳ hiện tại và kỳ trước.
  const rows = await kpiRepository.findAssignedTasks(
    userId,
    utcDate(previousRange.from),
    utcDate(range.to),
  );
  const all = rows.map((row) => toFacts(row, todayIso));
  const current = all.filter((item) => item.dueIso >= range.from);
  const previous = all.filter((item) => item.dueIso < range.from);

  const now = summarize(current);
  const before = summarize(previous);

  const trend = bucketsOf(period, range).map((bucket) => {
    const stats = summarize(
      current.filter(
        (item) => item.dueIso >= bucket.from && item.dueIso <= bucket.to,
      ),
    );
    return {
      from: bucket.from,
      to: bucket.to,
      completionRate: stats.completionRate,
      onTimeRate: stats.onTimeRate,
      reopenRate: null,
    };
  });

  const countByCategory = (category: WorkflowStatusCategory) =>
    current.filter((item) => item.category === category).length;

  const delayBuckets = DELAY_BUCKETS.map((bucket) => ({
    range: bucket.range,
    count: now.late.filter(
      (item) => item.lateDays >= bucket.min && item.lateDays <= bucket.max,
    ).length,
  }));

  const priority = PRIORITY_ORDER.map((key) => {
    const group = now.active.filter((item) => item.row.priority === key);
    return {
      key,
      done: group.filter((item) => item.done).length,
      total: group.length,
    };
  });

  const projectGroups = new Map<number, { name: string; items: TaskFacts[] }>();
  for (const item of current) {
    const project = item.row.project;
    if (!project) continue;
    const group = projectGroups.get(project.id) ?? {
      name: project.name,
      items: [],
    };
    group.items.push(item);
    projectGroups.set(project.id, group);
  }

  const projects = [...projectGroups.entries()].map(([id, group]) => {
    const stats = summarize(group.items);
    return {
      id,
      name: group.name,
      assigned: stats.active.length,
      done: stats.done.length,
      onTimeRate: stats.onTimeRate,
      avgDelayDays: stats.avgDelayDays,
      effortVariance: null,
      reopenRate: null,
      score: stats.score,
    };
  });

  const effortByProject = [...projectGroups.entries()].map(([id, group]) => ({
    projectId: id,
    name: group.name,
    estimatedHours: round(
      group.items.reduce(
        (sum, item) => sum + (item.row.estimatedMinutes ?? 0),
        0,
      ) / 60,
    ),
    actualHours: null,
  }));

  const attention = now.active
    .filter((item) => !item.done && item.lateDays > 0)
    .sort((a, b) => b.lateDays - a.lateDays)
    .slice(0, ATTENTION_LIMIT)
    .map((item) => ({
      id: item.row.id,
      code: item.row.code,
      title: item.row.title,
      project: item.row.project?.name ?? null,
      kind: "overdue" as const,
      amount: item.lateDays,
    }));

  return {
    period,
    range,
    previousRange,
    targets: KPI_TARGETS,
    score: now.score,
    previousScore: before.score,
    rank: null,
    teamSize: null,
    counts: {
      assigned: now.active.length,
      done: now.done.length,
      onTime: now.onTime.length,
      late: now.late.length,
      reopened: null,
    },
    metrics: {
      completionRate: {
        value: now.completionRate,
        previous: before.completionRate,
      },
      onTimeRate: { value: now.onTimeRate, previous: before.onTimeRate },
      avgDelayDays: { value: now.avgDelayDays, previous: before.avgDelayDays },
      effortVariance: { value: null, previous: null },
      reopenRate: { value: null, previous: null },
    },
    trend,
    status: {
      todo: countByCategory(WorkflowStatusCategory.TODO),
      inProgress: countByCategory(WorkflowStatusCategory.IN_PROGRESS),
      done: countByCategory(WorkflowStatusCategory.DONE),
      cancelled: countByCategory(WorkflowStatusCategory.CANCELLED),
    },
    delayBuckets,
    effortByProject,
    reopenByType: [] as { name: string; reopened: number; total: number }[], // TODO(kpi-log)
    priority,
    projects,
    attention,
  };
}
