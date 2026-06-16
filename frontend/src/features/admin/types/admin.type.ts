export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DashboardStats = {
  totalUsers: number;
  totalPosts: number;
  totalGroups: number;
  activeUsers: number;
};

export type DashboardAlerts = {
  pendingReviewPosts: number;
  inactiveUsers: number;
  inactiveGroups: number;
};

export type DashboardData = {
  stats: DashboardStats;
  alerts: DashboardAlerts;
  recentPosts: AdminPost[];
  recentUsers: AdminUser[];
};

export type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  department: { id: number; name: string } | null;
  position: { id: number; name: string } | null;
};

export type AdminPost = {
  id: number;
  content: string;
  status: string;
  visibility: string;
  isPinned: boolean;
  isAnonymous: boolean;
  createdAt: string;
  user: { id: number; fullName: string; email: string };
  group: { id: number; groupName: string } | null;
  _count: { comments: number; reactions: number };
};

export type AdminPostDetail = AdminPost & {
  attachments: Array<{
    id: number;
    fileKey: string;
    fileUrl?: string;
    attachmentType: "IMAGE" | "VIDEO" | "FILE";
    fileName: string;
  }>;
};

export type AdminGroup = {
  id: number;
  groupName: string;
  description: string | null;
  groupType: string;
  status: string;
  createdAt: string;
  creator: { id: number; fullName: string; email: string };
  department: { id: number; name: string } | null;
  _count: { members: number; posts: number };
};

export type AdminGroupDetail = AdminGroup & {
  coverKey: string | null;
  coverUrl: string | null;
  isHidden: boolean;
  joinApprovalPolicy: string;
  postPermission: string;
  postApprovalRequired: boolean;
};

export type AdminGroupMember = {
  id: number;
  memberRole: "ADMIN" | "MODERATOR" | "MEMBER";
  joinedAt: string;
  status: "PENDING" | "ACTIVE" | "BLOCKED";
  user: { id: number; fullName: string; email: string };
};
