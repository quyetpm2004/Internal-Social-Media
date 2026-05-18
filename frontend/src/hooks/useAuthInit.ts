import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { authApi } from "@/features/auth/api/auth.api";
import { toast } from "sonner";

export function useAuthInit() {
  const setUser = useAuthStore((state) => state.setUser);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        let accessToken = useAuthStore.getState().accessToken;

        if (!accessToken) {
          const refreshRes = await authApi.refreshToken();

          // Sửa theo đúng response backend của bạn
          accessToken = refreshRes.data.accessToken;

          useAuthStore.setState({
            accessToken,
            isAuthenticated: Boolean(accessToken),
          });
        }

        if (accessToken) {
          const userRes = await authApi.getMe();

          const user = userRes.data;

          setUser(user);
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Có lỗi xảy ra. Vui lòng thử lại.";
        toast.error(message);

        useAuthStore.setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });

        localStorage.removeItem("auth-storage");
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, [setUser]);

  return { initialized };
}
