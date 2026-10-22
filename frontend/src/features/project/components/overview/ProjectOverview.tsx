import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListTodo,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import BudgetMeter from "@/components/shared/dashboard/BudgetMeter";
import DashboardCard from "@/components/shared/dashboard/DashboardCard";
import GroupedBars from "@/components/shared/dashboard/GroupedBars";
import MeterList from "@/components/shared/dashboard/MeterList";
import NoticeList from "@/components/shared/dashboard/NoticeList";
import ProgressRing from "@/components/shared/dashboard/ProgressRing";
import ShareBars from "@/components/shared/dashboard/ShareBars";
import StatCard from "@/components/shared/dashboard/StatCard";
import { projectApi } from "@/features/project/api/project.api";
import type {
  OverviewCategory,
  OverviewPriority,
  ProjectOverviewData,
} from "@/features/project/types/overview.type";
import {
  getApiErrorMessages,
  toastApiError,
} from "@/features/project-template/utils/api-error";

const CATEGORY_COLORS: Record<OverviewCategory, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#0A6AF6",
  DONE: "#10b981",
  CANCELLED: "#f59e0b",
};

const PRIORITY_COLORS: Record<OverviewPriority, string> = {
  URGENT: "#e11d48",
  HIGH: "#f97316",
  MEDIUM: "#0A6AF6",
  LOW: "#94a3b8",
};

const MEMBER_COLORS = [
  "#0A6AF6",
  "#7c3aed",
  "#0891b2",
  "#f59e0b",
  "#e11d48",
  "#10b981",
];

const STATUS_FALLBACK = [
  "#94a3b8",
  "#0A6AF6",
  "#f59e0b",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#38bdf8",
  "#10b981",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatUpdated(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDayMonth(value: string | null) {
  if (!value) return "—";
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${Number(day)}/${Number(month)}`;
}

function weekLabel(weekStart: string, index: number) {
  const [, month, day] = weekStart.split("-");
  return `T${index + 1} (${Number(day)}/${Number(month)})`;
}

function EmptyNote({ children }: { children: string }) {
  return <p className="py-6 text-center text-sm text-slate-400">{children}</p>;
}

type ProjectOverviewProps = {
  projectId: number;
};

export default function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ProjectOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await projectApi.getOverview(projectId);
        if (!cancelled) setData(response.data);
      } catch (loadError) {
        if (cancelled) return;
        setData(null);
        setError(
          getApiErrorMessages(loadError)[0] ??
            t("pages.projects.overviewPanel.loadFailed"),
        );
        toastApiError(loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, t]);

  if (loading && !data) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        {error || t("pages.projects.overviewPanel.loadFailed")}
      </p>
    );
  }

  const progressItems = data.progress.items.map((item, index) => {
    if (item.kind === "category") {
      return {
        label: t(`pages.projects.overviewPanel.category.${item.category}`),
        value: item.count,
        color: CATEGORY_COLORS[item.category],
      };
    }
    return {
      label: item.name,
      value: item.count,
      color: item.color || STATUS_FALLBACK[index % STATUS_FALLBACK.length],
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t("pages.projects.overviewPanel.title")}
          </h2>
          <p className="text-sm text-slate-500">
            {t("pages.projects.overviewPanel.subtitle")}
          </p>
        </div>
        <p className="text-xs text-slate-400">
          {t("pages.projects.overviewPanel.updated", {
            time: formatUpdated(data.updatedAt),
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="blue"
          icon={<ListTodo className="size-4" />}
          label={t("pages.projects.overviewPanel.totalTasks")}
          value={String(data.summary.total)}
          hint={t("pages.projects.overviewPanel.completedHint", {
            count: data.summary.done,
          })}
        />
        <StatCard
          tone="violet"
          icon={<CheckCircle2 className="size-4" />}
          label={t("pages.projects.overviewPanel.inProgress")}
          value={String(data.summary.inProgress)}
          hint={t("pages.projects.overviewPanel.inProgressHint", {
            count: data.summary.todo,
          })}
        />
        <StatCard
          tone="rose"
          icon={<AlertTriangle className="size-4" />}
          label={t("pages.projects.overviewPanel.overdue")}
          value={String(data.summary.overdue)}
          hint={t("pages.projects.overviewPanel.overdueHint", {
            count: data.summary.urgentOpen,
          })}
        />
        <StatCard
          tone="emerald"
          icon={<Clock3 className="size-4" />}
          label={t("pages.projects.overviewPanel.time")}
          value={t("pages.projects.overviewPanel.timeEmpty")}
          hint={t("pages.projects.overviewPanel.timeEmpty")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title={t("pages.projects.overviewPanel.overall")}>
          <ProgressRing percent={data.progress.percent} items={progressItems} />
        </DashboardCard>
        <DashboardCard title={t("pages.projects.overviewPanel.prioritySplit")}>
          <ShareBars
            items={data.priorities.map((item) => ({
              label: t(`pages.projects.tasks.priority.${item.priority}`),
              value: item.count,
              percent: item.percent,
              color: PRIORITY_COLORS[item.priority],
            }))}
          />
        </DashboardCard>
      </div>

      <DashboardCard title={t("pages.projects.overviewPanel.weekly")}>
        <GroupedBars
          series={[
            {
              label: t("pages.projects.overviewPanel.completedSeries"),
              color: "#10b981",
            },
            {
              label: t("pages.projects.overviewPanel.addedSeries"),
              color: "#0A6AF6",
            },
          ]}
          groups={data.weekly.map((week, index) => ({
            label: weekLabel(week.weekStart, index),
            values: [week.completed, week.created],
          }))}
        />
      </DashboardCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title={t("pages.projects.overviewPanel.memberPerformance")}>
          {data.members.length === 0 ? (
            <EmptyNote>{t("pages.projects.overviewPanel.membersEmpty")}</EmptyNote>
          ) : (
            <MeterList
              rows={data.members.map((member, index) => ({
                name: member.name,
                detail: `${member.done}/${member.assigned}`,
                percent: member.percent,
                color: MEMBER_COLORS[index % MEMBER_COLORS.length],
              }))}
            />
          )}
        </DashboardCard>
        <DashboardCard title={t("pages.projects.overviewPanel.upcoming")}>
          {data.upcoming.length === 0 ? (
            <EmptyNote>{t("pages.projects.overviewPanel.upcomingEmpty")}</EmptyNote>
          ) : (
            <NoticeList
              items={data.upcoming.map((task) => ({
                id: task.id,
                title: task.title,
                meta: formatDayMonth(task.dueDate),
                tone: "slate",
              }))}
            />
          )}
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title={t("pages.projects.overviewPanel.timeBudget")}>
          <BudgetMeter
            usedLabel={`${t("pages.projects.overviewPanel.used")} ${t("pages.projects.overviewPanel.timeEmpty")}`}
            totalLabel={t("pages.projects.overviewPanel.timeEmpty")}
            percent={0}
            status={t("pages.projects.overviewPanel.timeBudgetEmpty")}
          />
        </DashboardCard>
        <DashboardCard
          title={t("pages.projects.overviewPanel.attention", {
            count: data.attention.total,
          })}
        >
          {data.attention.items.length === 0 ? (
            <EmptyNote>{t("pages.projects.overviewPanel.attentionEmpty")}</EmptyNote>
          ) : (
            <NoticeList
              items={data.attention.items.map((task) => ({
                id: task.id,
                title: task.title,
                meta: formatDayMonth(task.dueDate),
                badge: t(
                  task.reason === "OVERDUE"
                    ? "pages.projects.overviewPanel.overdueBadge"
                    : "pages.projects.overviewPanel.urgentBadge",
                ),
                tone: task.reason === "OVERDUE" ? "rose" : "orange",
              }))}
            />
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
