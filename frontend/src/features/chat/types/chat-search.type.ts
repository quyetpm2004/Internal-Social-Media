export interface ChatSearchUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
}

export interface ChatSearchHistoryItem {
  id: number;
  searchedAt: string;
  user: ChatSearchUser;
}

export interface ChatSearchUsersResponse {
  users: ChatSearchUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
