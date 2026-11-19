import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { SystemRole } from "@/features/auth/types/auth.type";
import ForbiddenPage from "@/features/forbidden/pages/ForbiddenPage";

type RoleRouteProps = {
  allow: SystemRole[];
};

export default function RoleRoute({ allow }: RoleRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user || !allow.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
