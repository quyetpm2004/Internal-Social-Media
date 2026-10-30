import {
  periodSnapshots,
  projectRows,
  type DepartmentRow,
  type PeriodKey,
  type ProjectRow,
} from "@/features/work/data/org-overview.mock";

export type HealthLevel = "ok" | "warn" | "danger";

export type RiskLevel = "low" | "medium" | "high";

export type OverviewSection =
  "projects" | "departments" | "workload" | "activity" | "risks";

export type ProjectHealth = ProjectRow & {
  elapsed: number;
  level: HealthLevel;
};

export type RiskFactor = {
  id: "lateProjects" | "overdueTasks";
  count: number;
  points: number;
};

export type OrgRisk = {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
};

export type DepartmentHeat = {
  id: string;
  name: string;
  headcount: number;
  late: number;
  idle: number;
  kpi: number;
};

export type KpiTrend = {
  values: number[];
  higherIsBetter: boolean;
};

export const REFERENCE_DATE = "2026-10-08";
export const OVERLOAD_THRESHOLD = 8;
export const WORKLOAD_CAPACITY = 10;
export const DANGER_GAP = 35;
export const WARN_GAP = 10;

export const healthColors: Record<HealthLevel, string> = {
  ok: "#10b981",
  warn: "#f59e0b",
  danger: "#e11d48",
};

export const riskColors: Record<RiskLevel, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#e11d48",
};

export const departmentKpi: Record<string, number> = {
  eng: 78,
  product: 86,
  hr: 82,
  sales: 61,
  marketing: 74,
  ops: 91,
};

export const overviewSections: OverviewSection[] = [
  "projects",
  "departments",
  "workload",
  "activity",
  "risks",
];

export const kpiTrends: Record<string, KpiTrend> = {
  "on-time": { values: [64, 66, 65, 69, 70, 71, 72], higherIsBetter: true },
  running: { values: [7, 7, 8, 8, 8, 8, 8], higherIsBetter: true },
  "late-projects": { values: [2, 2, 3, 3, 4, 3, 3], higherIsBetter: false },
  "overdue-tasks": { values: [6, 7, 9, 8, 12, 13, 11], higherIsBetter: false },
  "open-issues": {
    values: [10, 12, 11, 15, 16, 15, 14],
    higherIsBetter: false,
  },
  "slow-people": { values: [4, 5, 5, 7, 7, 6, 6], higherIsBetter: false },
};

const riskWeights: Record<RiskFactor["id"], number> = {
  lateProjects: 8,
  overdueTasks: 1.6,
};

function parseShortDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(2000 + year, month - 1, day).getTime();
}

export function overviewPath(section: OverviewSection, period: PeriodKey) {
  return `/work/overview/${section}?period=${period}`;
}

export function isOverviewSection(value: string | undefined) {
  return overviewSections.some((section) => section === value);
}

export function getProjectHealth(row: ProjectRow): ProjectHealth {
  const reference = new Date(REFERENCE_DATE).getTime();
  const start = parseShortDate(row.start);
  const end = parseShortDate(row.end);
  const elapsed = Math.min(
    100,
    Math.max(0, Math.round(((reference - start) / (end - start)) * 100)),
  );
  const gap = row.status === "done" ? 0 : elapsed - row.progress;
  let level: HealthLevel = "ok";
  if (gap >= DANGER_GAP) level = "danger";
  else if (gap >= WARN_GAP || row.status === "slow") level = "warn";
  return { ...row, elapsed, level };
}

export function getProjectHealthList(archived = false) {
  return projectRows
    .filter((row) => Boolean(row.archived) === archived)
    .map(getProjectHealth);
}

export function getDepartmentHeat(row: DepartmentRow): DepartmentHeat {
  return {
    id: row.id,
    name: row.name,
    headcount: row.headcount,
    late: row.late,
    idle: row.idle,
    kpi: departmentKpi[row.id] ?? 0,
  };
}

export function getSnapshotValue(period: PeriodKey, id: string) {
  const snapshot = periodSnapshots[period];
  const item = [...snapshot.metrics, ...snapshot.alerts].find(
    (entry) => entry.id === id,
  );
  return item?.value ?? "0";
}

function getSnapshotCount(period: PeriodKey, id: string) {
  return Number(getSnapshotValue(period, id).replace(/\D/g, "")) || 0;
}

export function getOrgRisk(period: PeriodKey): OrgRisk {
  const counts: Record<RiskFactor["id"], number> = {
    lateProjects: getSnapshotCount(period, "late-projects"),
    overdueTasks: getSnapshotCount(period, "overdue-tasks"),
  };
  const factors = (Object.keys(counts) as RiskFactor["id"][])
    .map((id) => ({
      id,
      count: counts[id],
      points: Math.round(counts[id] * riskWeights[id]),
    }))
    .sort((a, b) => b.points - a.points);
  const score = Math.min(
    100,
    factors.reduce((sum, factor) => sum + factor.points, 0),
  );
  let level: RiskLevel = "low";
  if (score >= 65) level = "high";
  else if (score >= 35) level = "medium";
  return { score, level, factors };
}
