import { axiosClient } from "@/lib/axios";
import type {
  Department,
  Position,
  UserProfile,
} from "@/features/profile/types/profile.type";
import { type ApiResponse } from "@/types/api.type";

export const profileApi = {
  getProfile(userId: string) {
    return axiosClient.get<ApiResponse<UserProfile>>(
      `/users/profile/${userId}`,
    );
  },

  getDepartments() {
    return axiosClient.get<ApiResponse<Department[]>>("/departments");
  },

  getPositions() {
    return axiosClient.get<ApiResponse<Position[]>>("/positions");
  },

  updateProfile(payload: Partial<UserProfile>) {
    return axiosClient.put<ApiResponse<UserProfile>>("/users/profile", payload);
  },

  deleteAvatar() {
    return axiosClient.delete("/users/profile/avatar");
  },
};
