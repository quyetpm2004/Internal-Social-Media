import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useEffect } from "react";
import { authApi } from "@/features/auth/api/auth.api";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const accessToken = localStorage.getItem("auth-storage")
    ? JSON.parse(localStorage.getItem("auth-storage")!).state.accessToken
    : null;

  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        try {
          const res = await authApi.getMe();
          const user = res.data;
          setUser(user);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    initAuth();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
