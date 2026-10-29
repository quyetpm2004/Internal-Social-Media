import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import ForbiddenPage from "@/features/forbidden/pages/ForbiddenPage";

export default function DepartmentRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== "MANAGER") {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
