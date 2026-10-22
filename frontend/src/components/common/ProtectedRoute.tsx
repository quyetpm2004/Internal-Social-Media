import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useEffect, useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";

function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}

export default function ProtectedRoute() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!hydrated) return;

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;

    let cancelled = false;

    const loadUser = async () => {
      try {
        const res = await authApi.getMe();
        if (!cancelled) {
          setUser(res.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [hydrated, setUser]);

  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
