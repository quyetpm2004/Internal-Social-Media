import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { workHomePath } from "@/features/auth/utils/role-access";
import OrgOverviewDashboardPage from "@/features/work/pages/OrgOverviewDashboardPage";

/** `/work`: Giám đốc vào dashboard tổ chức, các vai trò khác về trang làm việc của mình. */
export default function WorkHomePage() {
  const role = useAuthStore((state) => state.user?.role);

  if (role === "DIRECTOR") return <OrgOverviewDashboardPage />;
  return <Navigate to={workHomePath(role)} replace />;
}
