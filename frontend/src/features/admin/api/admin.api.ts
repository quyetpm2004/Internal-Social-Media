import { axiosClient } from "@/lib/axios";
import type {
  AdminGroup,
  AdminGroupDetail,
  AdminGroupMember,
  AdminPost,
  AdminPostDetail,
  AdminUser,
  DashboardData,
  Pagination,
} from "@/features/admin/types/admin.type";
import type { ApiResponse } from "@/types/api.type";

export const adminApi = {
  getDashboard() {
    return axiosClient.get<ApiResponse<DashboardData>>("/admin/dashboard");
  },

  getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    return axiosClient.get<
      ApiResponse<{ users: AdminUser[]; pagination: Pagination }>
    >("/admin/users", { params });
  },

  updateUserStatus(userId: number, status: "ACTIVE" | "INACTIVE") {
    return axiosClient.patch<ApiResponse<AdminUser>>(
      `/admin/users/${userId}/status`,
      { status },
    );
  },

  getPosts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    return axiosClient.get<
      ApiResponse<{ posts: AdminPost[]; pagination: Pagination }>
    >("/admin/posts", { params });
  },

  getPostDetail(postId: number) {
    return axiosClient.get<ApiResponse<AdminPostDetail>>(
      `/admin/posts/${postId}`,
    );
  },

  deletePost(postId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(`/admin/posts/${postId}`);
  },

  getGroups(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    return axiosClient.get<
      ApiResponse<{ groups: AdminGroup[]; pagination: Pagination }>
    >("/admin/groups", { params });
  },

  getGroupDetail(groupId: number) {
    return axiosClient.get<ApiResponse<AdminGroupDetail>>(
      `/admin/groups/${groupId}`,
    );
  },

  getGroupMembers(groupId: number, params?: { page?: number; limit?: number }) {
    return axiosClient.get<
      ApiResponse<{ members: AdminGroupMember[]; pagination: Pagination }>
    >(`/admin/groups/${groupId}/members`, { params });
  },

  deleteGroup(groupId: number) {
    return axiosClient.delete<ApiResponse<boolean>>(`/admin/groups/${groupId}`);
  },
};
