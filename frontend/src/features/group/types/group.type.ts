import type { GroupMemberRole } from "@/features/group/utils/group-member";

export interface Group {
  id: string;
  groupName: string;
  description: string;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  status: string;
  avatarUrl: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    posts: number;
  };
  isMember: boolean;
}

export interface GroupApiResponse {
  groups: Group[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GroupDetail {
  id: string;
  groupName: string;
  description: string;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  status: string;
  departmentId?: string;
  avatarUrl?: string;
  coverUrl?: string;
  avatarKey?: string;
  coverKey?: string;
  createdAt: string;
  updatedAt: string;
  department?: {
    name: string;
  };
  members: {
    id: string;
    memberRole: "ADMIN" | "MODERATOR" | "MEMBER";
    joinedAt: string;
    user: {
      id: number;
      fullName: string;
      email: string;
      avatarUrl?: string;
    };
  }[];
  _count: {
    members: number;
    posts: number;
  };
  isMember: boolean;
}

export interface Member {
  id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
  status: string;
  memberRole: GroupMemberRole;
  joinedAt: string;
}

export interface GetMembersResponse {
  members: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
