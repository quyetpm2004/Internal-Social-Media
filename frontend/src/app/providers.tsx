import { Toaster } from "sonner";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { authApi } from "@/features/auth/api/auth.api";
import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function AppProviders() {
  const accessToken = localStorage.getItem("auth-storage")
    ? JSON.parse(localStorage.getItem("auth-storage")!).state.accessToken
    : null;

  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

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

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
