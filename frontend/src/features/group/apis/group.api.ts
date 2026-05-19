import { axiosClient } from "@/lib/axios";
import type {
  GetMembersResponse,
  GroupApiResponse,
  GroupDetail,
} from "@/features/group/types/group.type";
import type { GetPostsResponse } from "@/features/new-feed/types/new-feed.type";

export const groupApi = {
  getGroups(searchQuery?: string, filter?: string, page: number = 1) {
    const response = axiosClient.get<GroupApiResponse>("/groups", {
      params: {
        search: searchQuery,
        groupType: filter,
        page,
      },
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
    const response = axiosClient.get<GroupDetail>(`/groups/${groupId}`);
    return response;
  },
  joinGroup(groupId: string) {
    const response = axiosClient.post(`/groups/${groupId}/join`);
    return response;
  },
  leaveGroup(groupId: string) {
    const response = axiosClient.post(`/groups/${groupId}/leave`);
    return response;
  },
  getPost(groupId: string, page: number = 1, limit: number = 10) {
    const response = axiosClient.get<GetPostsResponse>(
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

    return axiosClient.get<GetMembersResponse>(
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

  updateMemberRole: (
    groupId: string,
    memberId: string,
    memberRole: string,
  ) => {
    return axiosClient.patch(`/groups/${groupId}/members/${memberId}/role`, {
      memberRole,
    });
  },
};
