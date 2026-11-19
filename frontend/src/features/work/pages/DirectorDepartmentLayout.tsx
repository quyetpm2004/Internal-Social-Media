import { useEffect, useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  departmentOrgApi,
  type OrgDepartment,
} from "@/features/department/api/department-org.api";
import DepartmentScopeProvider from "@/features/department/context/DepartmentScopeProvider";
import { toastApiError } from "@/features/project-template/utils/api-error";

const tabs = [
  { path: "", labelKey: "nav.departmentOverview", end: true },
  { path: "/members", labelKey: "nav.departmentMembers" },
  { path: "/tasks", labelKey: "nav.departmentTasks" },
  { path: "/kpi", labelKey: "nav.departmentKpi" },
];

/**
 * Giám đốc xem một phòng ban bằng đúng các trang của trưởng phòng, chỉ đọc.
 * Phòng đang xem lấy từ URL và được truyền cho các trang con qua DepartmentScopeProvider,
 * nên các lời gọi API tự trỏ tới /departments/:id và /kpi/departments/:id.
 */
export default function DirectorDepartmentLayout() {
  const { departmentId = "" } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<OrgDepartment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    departmentOrgApi
      .list()
      .then((response) => {
        if (!cancelled) setDepartments(response.data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDepartments([]);
        toastApiError(error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const id = Number(departmentId);
  const department = departments?.find((item) => item.id === id);

  if (departments === null) {
    return (
      <p className="px-6 py-16 text-center text-sm text-slate-400">
        {t("common.loading")}
      </p>
    );
  }

  if (!department) {
    return (
      <main className="space-y-3 px-6 py-16 text-center text-sm text-slate-500">
        <p>{t("director.detail.notFound")}</p>
        <Link to="/work/departments" className="text-primary hover:underline">
          {t("director.detail.back")}
        </Link>
      </main>
    );
  }

  const basePath = `/work/departments/${department.id}`;

  return (
    <DepartmentScopeProvider value={{ ref: department.id, basePath, readOnly: true }}>
      <div className="border-b border-slate-200 bg-white px-4 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/work/departments"
            aria-label={t("director.detail.back")}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <select
            value={department.id}
            onChange={(event) => navigate(`/work/departments/${event.target.value}`)}
            aria-label={t("director.title")}
            className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-primary"
          >
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <Eye className="size-3.5" />
            {t("myDepartment.readOnly")}
          </span>
        </div>
        <nav className="mt-3 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`${basePath}${tab.path}`}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )
              }
            >
              {t(tab.labelKey)}
            </NavLink>
          ))}
        </nav>
      </div>
      <div key={department.id}>
        <Outlet />
      </div>
    </DepartmentScopeProvider>
  );
}
