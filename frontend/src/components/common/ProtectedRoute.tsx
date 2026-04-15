import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
