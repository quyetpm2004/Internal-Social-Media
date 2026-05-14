import { axiosClient } from "@/lib/axios";
import type {
  Department,
  Position,
  UserProfile,
} from "@/features/profile/types/profile.type";

export const profileApi = {
  getProfile(userId: string) {
    return axiosClient.get<UserProfile>(`/users/profile/${userId}`);
  },

  getDepartments() {
    return axiosClient.get<Department[]>("/departments");
  },

  getPositions() {
    return axiosClient.get<Position[]>("/positions");
  },

  updateProfile(payload: Partial<UserProfile>) {
    return axiosClient.put<UserProfile>("/users/profile", payload);
  },

  deleteAvatar() {
    return axiosClient.delete("/users/profile/avatar");
  },
};
