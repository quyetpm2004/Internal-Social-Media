import { APP_CONFIG } from "@/constants/app";

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(APP_CONFIG.accessTokenKey);
  },

  setAccessToken(token: string) {
    localStorage.setItem(APP_CONFIG.accessTokenKey, token);
  },

  removeAccessToken() {
    localStorage.removeItem(APP_CONFIG.accessTokenKey);
  },

  clearTokens() {
    this.removeAccessToken();
  },
};
