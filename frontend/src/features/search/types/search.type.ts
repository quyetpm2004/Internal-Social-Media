export type SearchTab = "all" | "people" | "groups";

export interface SearchHistoryItem {
  id: number;
  query: string;
  searchedAt: string;
}

export interface SearchUser {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  departmentName: string | null;
  positionName: string | null;
}

export interface SearchGroup {
  id: number;
  groupName: string;
  description: string | null;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  coverUrl: string | null;
  isMember: boolean;
  membershipStatus: string | null;
  memberCount: number;
  postCount: number;
}

export interface SearchPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SearchResult {
  query: string;
  type: SearchTab;
  users: SearchUser[];
  groups: SearchGroup[];
  counts: {
    users: number;
    groups: number;
  } | null;
  pagination: SearchPagination | null;
}
