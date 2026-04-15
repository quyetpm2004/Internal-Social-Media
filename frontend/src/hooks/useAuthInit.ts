import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { authApi } from "@/features/auth/api/auth.api";

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
      } catch (error) {
        console.error("Error fetching user profile:", error);

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
