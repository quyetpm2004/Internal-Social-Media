import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { authApi } from "@/features/auth/api/auth.api";
import { profileApi } from "@/features/profile/api/profile.api";

export function useAuthInit() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        hydrate();

        let accessToken = useAuthStore.getState().accessToken;

        if (!accessToken) {
          const refreshRes = await authApi.refreshToken();
          accessToken = refreshRes.data.accessToken;
          setAccessToken(accessToken);
        }

        if (accessToken) {
          const profileRes = await profileApi.getProfile();
          setUser(profileRes.data);
        }
      } catch {
        clearAuth();
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, [hydrate, setUser, setAccessToken, clearAuth]);

  return { initialized };
}
