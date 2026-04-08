import { axiosClient } from "@/lib/axios";
import type { UserProfile } from "@/features/profile/types/profile.type";

export const profileApi = {
  getProfile() {
    return axiosClient.get<UserProfile>("/users/profile");
  },

  updateProfile(payload: Partial<UserProfile>) {
    return axiosClient.patch<UserProfile>("/users/profile", payload);
  },
};
