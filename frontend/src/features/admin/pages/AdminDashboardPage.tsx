import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  FileText,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { adminApi } from "@/features/admin/api/admin.api";
import {
  AdminBarChart,
  AdminDonutChart,
  AdminHorizontalBarChart,
} from "@/features/admin/components/AdminCharts";
import type { DashboardData } from "@/features/admin/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unexpected error";
}

function stripHtml(content: string) {
  return content.replace(/<[^>]*>/g, "");
}

const dashboardCardClass =
  "overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-none";

const dashboardDividerClass = "border-gray-200/70";

const statCards = [
  {
    key: "totalUsers" as const,
    labelKey: "pages.admin.totalUsers",
    icon: Users,
    to: "/admin/users",
  },
  {
    key: "activeUsers" as const,
    labelKey: "pages.admin.activeUsers",
    icon: UserCheck,
    to: "/admin/users",
  },
  {
    key: "totalPosts" as const,
    labelKey: "pages.admin.totalPosts",
    icon: FileText,
    to: "/admin/posts",
  },
  {
    key: "totalGroups" as const,
    labelKey: "pages.admin.totalGroups",
    icon: UsersRound,
    to: "/admin/groups",
  },
];

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi.getDashboard();
        setData(res.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-muted-foreground">{t("pages.admin.dashboardLoadFailed")}</p>
    );
  }

  const alertItems = [
    {
      label: t("pages.admin.pendingPosts"),
      count: data.alerts.pendingReviewPosts,
      to: "/admin/pending-posts",
    },
    {
      label: t("pages.admin.lockedUsers"),
      count: data.alerts.inactiveUsers,
      to: "/admin/users",
    },
    {
      label: t("pages.admin.lockedGroups"),
      count: data.alerts.inactiveGroups,
      to: "/admin/groups",
    },
  ];

  const hasAlerts = alertItems.some((item) => item.count > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t("admin.dashboard")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("pages.admin.dashboardOverview")}
        </p>
      </div>

      <div className={dashboardCardClass}>
        <div className="grid divide-y divide-gray-200/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          {statCards.map(({ key, labelKey, icon: Icon, to }) => (
            <Link
              key={key}
              to={to}
              className="block p-5 transition-colors hover:bg-gray-50/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t(labelKey)}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                    {data.stats[key].toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-full bg-gray-100 p-2.5 text-gray-600">
                  <Icon className="size-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className={`${dashboardCardClass} xl:col-span-2`}>
          <div
            className={cn(
              "border-b px-5 py-4",
              dashboardDividerClass,
            )}
          >
            <h2 className="text-base font-medium text-gray-900">
              {t("pages.admin.growthChartTitle")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("pages.admin.growthChartDescription")}
            </p>
          </div>
          <div className="px-5 py-4">
            <AdminBarChart
              labels={data.charts.growth.labels}
              series={[
                {
                  key: "users",
                  label: t("pages.admin.chartUsers"),
                  values: data.charts.growth.users,
                  color: "#2563eb",
                },
                {
                  key: "posts",
                  label: t("pages.admin.chartPosts"),
                  values: data.charts.growth.posts,
                  color: "#16a34a",
                },
                {
                  key: "comments",
                  label: t("pages.admin.chartComments"),
                  values: data.charts.growth.comments,
                  color: "#9333ea",
                },
              ]}
            />
          </div>
        </div>

        <div className={dashboardCardClass}>
          <div
            className={cn(
              "border-b px-5 py-4",
              dashboardDividerClass,
            )}
          >
            <h2 className="text-base font-medium text-gray-900">
              {t("pages.admin.postVisibilityTitle")}
            </h2>
          </div>
          <div className="px-5 py-4">
            <AdminDonutChart
              items={[
                {
                  label: t("pages.admin.publicPosts"),
                  value: data.charts.postVisibility.public,
                  color: "#2563eb",
                },
                {
                  label: t("pages.admin.groupPosts"),
                  value: data.charts.postVisibility.group,
                  color: "#f59e0b",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className={dashboardCardClass}>
        <div
          className={cn(
            "border-b px-5 py-4",
            dashboardDividerClass,
          )}
        >
          <h2 className="text-base font-medium text-gray-900">
            {t("pages.admin.topGroupsTitle")}
          </h2>
        </div>
        <div className="px-5 py-4">
          {data.charts.topGroups.length === 0 ? (
            <p className="text-sm text-gray-500">{t("pages.admin.noGroupsChart")}</p>
          ) : (
            <AdminHorizontalBarChart
              items={data.charts.topGroups.map((group, index) => ({
                label: group.name,
                value: group.postCount,
                color: ["#2563eb", "#16a34a", "#9333ea", "#f59e0b", "#ef4444"][
                  index % 5
                ],
              }))}
            />
          )}
        </div>
      </div>

      <div className={dashboardCardClass}>
        <div
          className={cn(
            "flex items-center gap-2 border-b px-5 py-4",
            dashboardDividerClass,
          )}
        >
          <AlertTriangle className="size-4 text-amber-500" />
          <h2 className="text-base font-medium text-gray-900">{t("pages.admin.needAction")}</h2>
        </div>
        <div className="px-5 py-4">
          {hasAlerts ? (
            <div className="flex flex-wrap gap-2">
              {alertItems
                .filter((item) => item.count > 0)
                .map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700",
                      dashboardDividerClass,
                      "transition-colors hover:bg-gray-50",
                    )}
                  >
                    <Badge variant="inactive">{item.count}</Badge>
                    <span>{item.label}</span>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t("pages.admin.noActionNeeded")}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={dashboardCardClass}>
          <div
            className={cn(
              "flex items-center justify-between border-b px-5 py-4",
              dashboardDividerClass,
            )}
          >
            <h2 className="text-base font-medium text-gray-900">
              {t("pages.admin.recentPosts")}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className={cn("border-gray-200/80 bg-white text-gray-700", dashboardDividerClass)}
              asChild
            >
              <Link to="/admin/posts">{t("common.viewAll")}</Link>
            </Button>
          </div>
          {data.recentPosts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">
              {t("pages.admin.noPosts")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={cn("border-b hover:bg-transparent", dashboardDividerClass)}>
                  <TableHead className="px-5 text-gray-500">{t("common.content")}</TableHead>
                  <TableHead className="text-gray-500">{t("common.author")}</TableHead>
                  <TableHead className="pr-5 text-gray-500">{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPosts.map((post) => (
                  <TableRow
                    key={post.id}
                    className={cn("border-b hover:bg-gray-50/60", dashboardDividerClass)}
                  >
                    <TableCell className="max-w-[180px] px-5">
                      <Link
                        to={`/admin/posts/${post.id}`}
                        className="block truncate text-gray-900 hover:underline"
                        title={stripHtml(post.content)}
                      >
                        {stripHtml(post.content) || t("common.noContent")}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-gray-600">
                      {post.user.fullName}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Badge
                        variant={
                          post.status === "ACTIVE" ? "active" : "inactive"
                        }
                      >
                        {post.status === "ACTIVE"
                          ? t("common.active")
                          : post.status === "PENDING_REVIEW"
                            ? t("common.pendingReview")
                            : t("common.locked")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className={dashboardCardClass}>
          <div
            className={cn(
              "flex items-center justify-between border-b px-5 py-4",
              dashboardDividerClass,
            )}
          >
            <h2 className="text-base font-medium text-gray-900">
              {t("pages.admin.recentUsers")}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className={cn("border-gray-200/80 bg-white text-gray-700", dashboardDividerClass)}
              asChild
            >
              <Link to="/admin/users">{t("common.viewAll")}</Link>
            </Button>
          </div>
          {data.recentUsers.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">
              {t("pages.admin.noUsers")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={cn("border-b hover:bg-transparent", dashboardDividerClass)}>
                  <TableHead className="px-5 text-gray-500">{t("common.fullName")}</TableHead>
                  <TableHead className="text-gray-500">{t("common.email")}</TableHead>
                  <TableHead className="pr-5 text-gray-500">{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn("border-b hover:bg-gray-50/60", dashboardDividerClass)}
                  >
                    <TableCell className="px-5 text-gray-900">
                      {user.fullName}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-gray-600">
                      {user.email}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Badge
                        variant={
                          user.status === "ACTIVE" ? "active" : "inactive"
                        }
                      >
                        {user.status === "ACTIVE" ? t("common.active") : t("common.locked")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
