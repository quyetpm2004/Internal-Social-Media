import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/features/auth/api/auth.api";
import type {
  LoginPayload,
  UserPublicInfo,
} from "@/features/auth/types/auth.type";
import { toast } from "sonner";
import { disconnectSocket } from "@/lib/socket";

type AuthState = {
  user: UserPublicInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: UserPublicInfo | null) => void;
  setAccessToken: (token: string) => void;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
          isAuthenticated: Boolean(state.accessToken && user),
        })),

      setAccessToken: (token: string) =>
        set((state) => ({
          ...state,
          accessToken: token,
          isAuthenticated: true,
        })),

      login: async (payload) => {
        set({ isLoading: true });

        try {
          const res = await authApi.login(payload);
          const accessToken = res.data.accessToken;
          const user = res.data.user;

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          disconnectSocket();
          localStorage.removeItem("auth-storage");
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          toast.success("Đăng xuất thành công");
        }
      },

      clearAuth: () => {
        disconnectSocket();
        localStorage.removeItem("auth-storage");
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
