export type KpiPeriod = "week" | "month" | "quarter";

export type KpiDateRange = { from: string; to: string };

export type KpiMetricValue = { value: number | null; previous: number | null };

export type KpiMetrics = {
  completionRate: KpiMetricValue;
  onTimeRate: KpiMetricValue;
  avgDelayDays: KpiMetricValue;
  effortVariance: KpiMetricValue;
  reopenRate: KpiMetricValue;
};

export type KpiMetricId = keyof KpiMetrics;

export type KpiTargets = Record<KpiMetricId, number>;

export type KpiTrendPoint = KpiDateRange & {
  completionRate: number | null;
  onTimeRate: number | null;
  reopenRate: number | null;
};

export type KpiPriorityKey = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type KpiProjectRow = {
  id: number;
  name: string;
  assigned: number;
  done: number;
  onTimeRate: number | null;
  avgDelayDays: number | null;
  effortVariance: number | null;
  reopenRate: number | null;
  score: number | null;
};

export type KpiAttentionItem = {
  id: number;
  code: string;
  title: string;
  project: string | null;
  kind: "overdue" | "reopened" | "overEffort";
  amount: number;
};

export type KpiResponse = {
  period: KpiPeriod;
  range: KpiDateRange;
  previousRange: KpiDateRange;
  targets: KpiTargets;
  score: number | null;
  previousScore: number | null;
  rank: number | null;
  teamSize: number | null;
  counts: {
    assigned: number;
    done: number;
    onTime: number;
    late: number;
    reopened: number | null;
  };
  metrics: KpiMetrics;
  trend: KpiTrendPoint[];
  status: { todo: number; inProgress: number; done: number; cancelled: number };
  delayBuckets: { range: string; count: number }[];
  effortByProject: {
    projectId: number;
    name: string;
    estimatedHours: number;
    actualHours: number | null;
  }[];
  reopenByType: { name: string; reopened: number; total: number }[];
  priority: { key: KpiPriorityKey; done: number; total: number }[];
  projects: KpiProjectRow[];
  attention: KpiAttentionItem[];
};
