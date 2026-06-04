import type { GroupMemberRole } from "@/features/group/utils/group-member";

export type GroupMembershipStatus = "PENDING" | "ACTIVE" | "BLOCKED" | null;

export interface Group {
  id: string;
  groupName: string;
  description: string;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  status: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    posts: number;
  };
  isMember: boolean;
  membershipStatus?: GroupMembershipStatus;
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
  coverUrl?: string;
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
  membershipStatus: GroupMembershipStatus;
  joinApprovalPolicy?: GroupPermission;
  allowAnonymousJoin?: boolean;
  pendingRequestCount?: number;
  pendingPostCount?: number;
  postApprovalRequired?: boolean;
}

export interface PendingGroupPost {
  id: number;
  content: string;
  createdAt: string;
  attachmentCount: number;
  author: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface GetPendingGroupPostsResponse {
  posts: PendingGroupPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JoinRequest {
  id: string;
  fullName: string;
  email: string;
  requestedAt: string;
  avatarUrl: string | null;
}

export interface GetJoinRequestsResponse {
  requests: JoinRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export type ItemType = "input-group" | "radio" | "info";

export interface SettingConfig {
  id: string;
  label: string;
  value: string;
  type: ItemType;
  options?: string[];
  isDropdown?: boolean;
  description?: string;
}

export type GroupPermission = "ADMIN_ONLY" | "ANY_MEMBER";

export interface GroupSettings {
  groupName: string;
  description: string | null;
  isHidden: boolean;
  joinApprovalPolicy: GroupPermission;
  allowAnonymousJoin: boolean;
  postPermission: GroupPermission;
  postApprovalRequired: boolean;
}

export interface JoinLeaveResponse {
  member: Member;
  action: string;
}

export type GroupAttachmentType = "IMAGE" | "VIDEO" | "FILE";

export interface GroupAttachmentItem {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  attachmentType: GroupAttachmentType;
  uploadedAt: string;
  post: {
    id: number;
    content: string;
    createdAt: string;
    author: {
      id: number;
      fullName: string;
      avatarUrl: string | null;
    };
  } | null;
}

export interface GetGroupAttachmentsResponse {
  items: GroupAttachmentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
