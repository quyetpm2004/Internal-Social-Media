import { axiosClient } from "@/lib/axios";
import type {
  GetGroupAttachmentsResponse,
  GetJoinRequestsResponse,
  GetMembersResponse,
  GroupApiResponse,
  GroupDetail,
  GroupSettings,
  JoinLeaveResponse,
} from "@/features/group/types/group.type";
import type {
  ApiPost,
  GetPostsResponse,
} from "@/features/new-feed/types/new-feed.type";
import type { ApiResponse } from "@/types/api.type";

export const groupApi = {
  getGroups(searchQuery?: string, filter?: string, page: number = 1) {
    const params: Record<string, string | number> = {
      search: searchQuery ?? "",
      page,
    };

    if (filter === "MY") {
      params.scope = "my";
    } else if (filter) {
      params.groupType = filter;
    }

    const response = axiosClient.get<ApiResponse<GroupApiResponse>>("/groups", {
      params,
    });
    return response;
  },
  createGroup(data: {
    groupName: string;
    description: string;
    groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
    departmentId?: string;
  }) {
    const response = axiosClient.post("/groups", data);
    return response;
  },
  getGroupDetail(groupId: string) {
    const response = axiosClient.get<ApiResponse<GroupDetail>>(
      `/groups/${groupId}`,
    );
    return response;
  },
  joinGroup(groupId: string) {
    const response = axiosClient.post<ApiResponse<JoinLeaveResponse>>(
      `/groups/${groupId}/join`,
    );
    return response;
  },
  leaveGroup(groupId: string) {
    const response = axiosClient.post<ApiResponse<JoinLeaveResponse>>(
      `/groups/${groupId}/leave`,
    );
    return response;
  },
  getPost(groupId: string, page: number = 1, limit: number = 10) {
    const response = axiosClient.get<ApiResponse<GetPostsResponse>>(
      `/groups/${groupId}/posts`,
      {
        params: {
          page,
          limit,
        },
      },
    );
    return response;
  },
  getMembers: async (groupId: string, page = 1, search = "", role = "") => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (search) params.append("search", search);
    if (role) {
      params.append("role", role);
    }

    return axiosClient.get<ApiResponse<GetMembersResponse>>(
      `/groups/${groupId}/members?${params.toString()}`,
    );
  },

  addMember: (
    groupId: string,
    data: { email: string; memberRole?: string },
  ) => {
    return axiosClient.post(`/groups/${groupId}/members`, data);
  },

  removeMember: (groupId: string, memberId: string) => {
    return axiosClient.delete(`/groups/${groupId}/members/${memberId}`);
  },

  updateMemberRole: (groupId: string, memberId: string, memberRole: string) => {
    return axiosClient.patch(`/groups/${groupId}/members/${memberId}/role`, {
      memberRole,
    });
  },
  getGroupPostDetail(groupId: string, postId: string) {
    const response = axiosClient.get<ApiResponse<ApiPost>>(
      `/groups/${groupId}/posts/${postId}`,
    );
    return response;
  },

  getJoinRequests: (groupId: string, page = 1, limit = 10) => {
    return axiosClient.get<ApiResponse<GetJoinRequestsResponse>>(
      `/groups/${groupId}/join-requests`,
      { params: { page, limit } },
    );
  },

  approveJoinRequest: (groupId: string, userId: string) => {
    return axiosClient.post(
      `/groups/${groupId}/join-requests/${userId}/approve`,
    );
  },

  rejectJoinRequest: (groupId: string, userId: string) => {
    return axiosClient.delete(`/groups/${groupId}/join-requests/${userId}`);
  },

  updateGroup: (groupId: string, groupName: string, description: string) => {
    return axiosClient.put(`/groups/${groupId}`, {
      groupName,
      description,
    });
  },

  getGroupSetting: (groupId: string) => {
    return axiosClient.get<ApiResponse<GroupSettings>>(
      `/groups/${groupId}/settings`,
    );
  },

  updateGroupSetting: (
    groupId: string,
    data: Partial<GroupSettings>,
  ) => {
    return axiosClient.patch<ApiResponse<GroupSettings>>(
      `/groups/${groupId}/settings`,
      data,
    );
  },

  getGroupMedia: (groupId: string, page = 1, search = "", limit = 24) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);

    return axiosClient.get<ApiResponse<GetGroupAttachmentsResponse>>(
      `/groups/${groupId}/media?${params.toString()}`,
    );
  },

  getGroupFiles: (groupId: string, page = 1, search = "", limit = 10) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);

    return axiosClient.get<ApiResponse<GetGroupAttachmentsResponse>>(
      `/groups/${groupId}/files?${params.toString()}`,
    );
  },
};
