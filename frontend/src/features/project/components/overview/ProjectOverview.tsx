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

const UPDATED_AT = "01/10/2026 09:12";

export default function ProjectOverview() {
  const { t } = useTranslation();

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
          {t("pages.projects.overviewPanel.updated", { time: UPDATED_AT })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="blue"
          icon={<ListTodo className="size-4" />}
          label={t("pages.projects.overviewPanel.totalTasks")}
          value="63"
          hint={t("pages.projects.overviewPanel.completedHint", { count: 6 })}
        />
        <StatCard
          tone="violet"
          icon={<CheckCircle2 className="size-4" />}
          label={t("pages.projects.overviewPanel.inProgress")}
          value="12"
          hint={t("pages.projects.overviewPanel.inProgressHint", {
            reopened: 5,
            resolved: 4,
          })}
        />
        <StatCard
          tone="rose"
          icon={<AlertTriangle className="size-4" />}
          label={t("pages.projects.overviewPanel.overdue")}
          value="9"
          hint={t("pages.projects.overviewPanel.overdueHint", { count: 10 })}
        />
        <StatCard
          tone="emerald"
          icon={<Clock3 className="size-4" />}
          label={t("pages.projects.overviewPanel.time")}
          value="3h"
          hint={t("pages.projects.overviewPanel.timeHint", { hours: "1h" })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title={t("pages.projects.overviewPanel.overall")}>
          <ProgressRing
            percent={9.52}
            items={[
              { label: "Mới", value: 3, color: "#94a3b8" },
              { label: "Chỉ định", value: 8, color: "#0A6AF6" },
              { label: "Tạm dừng", value: 2, color: "#f59e0b" },
              { label: "Chờ upcode", value: 3, color: "#8b5cf6" },
              { label: "Mở lại", value: 2, color: "#f97316" },
              { label: "Giải quyết", value: 5, color: "#14b8a6" },
              { label: "Đã nhận", value: 2, color: "#38bdf8" },
              { label: "Đóng", value: 6, color: "#10b981" },
            ]}
          />
        </DashboardCard>
        <DashboardCard title={t("pages.projects.overviewPanel.prioritySplit")}>
          <ShareBars
            items={[
              { label: "Khẩn cấp", value: 11, percent: 17.46, color: "#e11d48" },
              { label: "Cao", value: 7, percent: 11.11, color: "#f97316" },
              { label: "Trung bình", value: 39, percent: 61.9, color: "#0A6AF6" },
              { label: "Thấp", value: 6, percent: 9.53, color: "#94a3b8" },
            ]}
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
          groups={[
            { label: "T1 (24/2)", values: [8, 6] },
            { label: "T2 (3/3)", values: [5, 7] },
            { label: "T3 (10/3)", values: [9, 4] },
            { label: "T4 (17/3)", values: [11, 3] },
          ]}
        />
      </DashboardCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title={t("pages.projects.overviewPanel.memberPerformance")}>
          <MeterList
            rows={[
              { name: "Admin", detail: "2/5", percent: 40, color: "#0A6AF6" },
              { name: "Nhân viên QA", detail: "3/9", percent: 33, color: "#7c3aed" },
              { name: "Tài khoản Dev", detail: "2/17", percent: 12, color: "#0891b2" },
              { name: "Admin QA", detail: "0/5", percent: 0, color: "#f59e0b" },
              { name: "Tài khoản PM", detail: "0/4", percent: 0, color: "#e11d48" },
              { name: "Mai Thị Thanh Xuân", detail: "0/3", percent: 0, color: "#10b981" },
            ]}
          />
        </DashboardCard>
        <DashboardCard title={t("pages.projects.overviewPanel.upcoming")}>
          <NoticeList
            items={[
              {
                title: "Nút Lưu không phản hồi khi tạo bug",
                meta: "22/8",
                badge: "Quá 40d",
                tone: "rose",
              },
              {
                title: "Nút Lưu không phản hồi khi tạo bug (copy)",
                meta: "22/8",
                badge: "Quá 40d",
                tone: "rose",
              },
              {
                title: "Lỗi không tìm được dự án khi danh sách lọc dài",
                meta: "28/8",
                badge: "Quá 34d",
                tone: "rose",
              },
              {
                title: "Lỗi làm tròn tỷ lệ % phân bổ theo mức ưu tiên",
                meta: "30/8",
                badge: "Quá 33d",
                tone: "rose",
              },
              {
                title: "Thiết kế giao diện đăng nhập",
                meta: "30/8",
                badge: "Quá 32d",
                tone: "rose",
              },
            ]}
          />
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title={t("pages.projects.overviewPanel.timeBudget")}>
          <BudgetMeter
            usedLabel={`${t("pages.projects.overviewPanel.used")} 3h`}
            totalLabel="1h"
            percent={305}
            over
            status={t("pages.projects.overviewPanel.overBudget")}
          />
        </DashboardCard>
        <DashboardCard
          title={t("pages.projects.overviewPanel.attention", { count: 17 })}
        >
          <NoticeList
            items={[
              {
                title: "Nút Lưu không phản hồi khi tạo bug",
                meta: "22/8",
                badge: "Quá hạn",
                tone: "rose",
              },
              {
                title: "Không hiển thị thông báo khi tạo bug thành công",
                meta: "25/8",
                badge: "Khẩn cấp",
                tone: "orange",
              },
              {
                title: "Test lỗi",
                meta: "01/9",
                badge: "Quá hạn",
                tone: "amber",
              },
            ]}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
