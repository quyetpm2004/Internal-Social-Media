import { create } from "zustand";
import { authApi } from "@/features/auth/api/auth.api";
import type { LoginPayload } from "@/features/auth/types/auth.type";
import type { UserProfile } from "@/features/profile/types/profile.type";
import { tokenStorage } from "@/lib/token";

type AuthState = {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: UserProfile | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: tokenStorage.getAccessToken(),
  isAuthenticated: Boolean(tokenStorage.getAccessToken()),
  isLoading: false,

  setUser: (user) =>
    set({
      user,
    }),

  setAccessToken: (accessToken) => {
    if (accessToken) {
      tokenStorage.setAccessToken(accessToken);
    } else {
      tokenStorage.removeAccessToken();
    }

    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    });
  },

  login: async (payload) => {
    set({ isLoading: true });
    console.log("Logging in with payload:", payload);

    try {
      const res = await authApi.login(payload);

      console.log("Login response:", res.data);

      tokenStorage.setAccessToken(res.data.accessToken);

      set({
        user: res.data.user,
        accessToken: res.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      tokenStorage.clearTokens();

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  hydrate: () => {
    const accessToken = tokenStorage.getAccessToken();

    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    });
  },

  clearAuth: () => {
    tokenStorage.clearTokens();

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
