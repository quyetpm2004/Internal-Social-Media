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

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Đã xảy ra lỗi";
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
    label: "Tổng người dùng",
    icon: Users,
    to: "/admin/users",
  },
  {
    key: "activeUsers" as const,
    label: "Đang hoạt động",
    icon: UserCheck,
    to: "/admin/users",
  },
  {
    key: "totalPosts" as const,
    label: "Tổng bài viết",
    icon: FileText,
    to: "/admin/posts",
  },
  {
    key: "totalGroups" as const,
    label: "Tổng nhóm",
    icon: UsersRound,
    to: "/admin/groups",
  },
];

export default function AdminDashboardPage() {
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
      <p className="text-muted-foreground">Không thể tải dữ liệu dashboard.</p>
    );
  }

  const alertItems = [
    {
      label: "Bài viết chờ duyệt",
      count: data.alerts.pendingReviewPosts,
      to: "/admin/posts",
    },
    {
      label: "Tài khoản bị khóa",
      count: data.alerts.inactiveUsers,
      to: "/admin/users",
    },
    {
      label: "Nhóm bị khóa",
      count: data.alerts.inactiveGroups,
      to: "/admin/groups",
    },
  ];

  const hasAlerts = alertItems.some((item) => item.count > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tổng quan hệ thống và hoạt động gần đây
        </p>
      </div>

      <div className={dashboardCardClass}>
        <div className="grid divide-y divide-gray-200/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          {statCards.map(({ key, label, icon: Icon, to }) => (
            <Link
              key={key}
              to={to}
              className="block p-5 transition-colors hover:bg-gray-50/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
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

      <div className={dashboardCardClass}>
        <div
          className={cn(
            "flex items-center gap-2 border-b px-5 py-4",
            dashboardDividerClass,
          )}
        >
          <AlertTriangle className="size-4 text-amber-500" />
          <h2 className="text-base font-medium text-gray-900">Cần xử lý</h2>
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
              Không có việc cần xử lý lúc này.
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
              Bài viết gần đây
            </h2>
            <Button
              variant="outline"
              size="sm"
              className={cn("border-gray-200/80 bg-white text-gray-700", dashboardDividerClass)}
              asChild
            >
              <Link to="/admin/posts">Xem tất cả</Link>
            </Button>
          </div>
          {data.recentPosts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">
              Chưa có bài viết nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={cn("border-b hover:bg-transparent", dashboardDividerClass)}>
                  <TableHead className="px-5 text-gray-500">Nội dung</TableHead>
                  <TableHead className="text-gray-500">Tác giả</TableHead>
                  <TableHead className="pr-5 text-gray-500">Trạng thái</TableHead>
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
                        {stripHtml(post.content) || "Không có nội dung"}
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
                          ? "Hoạt động"
                          : post.status === "PENDING_REVIEW"
                            ? "Chờ duyệt"
                            : "Đã khóa"}
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
              Người dùng mới
            </h2>
            <Button
              variant="outline"
              size="sm"
              className={cn("border-gray-200/80 bg-white text-gray-700", dashboardDividerClass)}
              asChild
            >
              <Link to="/admin/users">Xem tất cả</Link>
            </Button>
          </div>
          {data.recentUsers.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">
              Chưa có người dùng nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={cn("border-b hover:bg-transparent", dashboardDividerClass)}>
                  <TableHead className="px-5 text-gray-500">Họ tên</TableHead>
                  <TableHead className="text-gray-500">Email</TableHead>
                  <TableHead className="pr-5 text-gray-500">Trạng thái</TableHead>
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
                        {user.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
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
