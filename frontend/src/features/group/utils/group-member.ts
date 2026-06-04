export type GroupMemberRole = "ADMIN" | "MODERATOR" | "MEMBER";

export const ANONYMOUS_MEMBER_NAME = "Thành viên ẩn danh";

export type MemberRoleFilter = "STAFF" | "MEMBER";

export const MEMBER_ROLE_FILTER_OPTIONS: {
  value: MemberRoleFilter;
  label: string;
}[] = [
  { value: "STAFF", label: "Quản trị & kiểm duyệt" },
  { value: "MEMBER", label: "Thành viên thường" },
];

const ROLE_RANK: Record<GroupMemberRole, number> = {
  MEMBER: 1,
  MODERATOR: 2,
  ADMIN: 3,
};

export function getRoleRank(role: GroupMemberRole): number {
  return ROLE_RANK[role] ?? 0;
}

export function canManageGroupMembers(
  role: GroupMemberRole | null | undefined,
): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

export function canApproveJoinRequests(options: {
  isMember: boolean;
  groupType?: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  joinApprovalPolicy?: "ADMIN_ONLY" | "ANY_MEMBER";
  memberRole?: GroupMemberRole | null;
}): boolean { 
  const { isMember, groupType, joinApprovalPolicy, memberRole } = options;

  if (!isMember || groupType !== "PRIVATE") {
    return false;
  }

  if (joinApprovalPolicy === "ANY_MEMBER") {
    return true;
  }

  return canManageGroupMembers(memberRole);
}

export function canManageTargetMember(
  actorRole: GroupMemberRole | null | undefined,
  targetRole: GroupMemberRole,
  targetUserId?: string | number,
  currentUserId?: string | number,
): boolean {
  if (!actorRole || !canManageGroupMembers(actorRole)) return false;
  if (
    targetUserId != null &&
    currentUserId != null &&
    String(targetUserId) === String(currentUserId)
  ) {
    return false;
  }
  return getRoleRank(actorRole) >= getRoleRank(targetRole);
}

export function getAssignableRoles(
  actorRole: GroupMemberRole,
): GroupMemberRole[] {
  return (["MEMBER", "MODERATOR", "ADMIN"] as const).filter(
    (role) => getRoleRank(actorRole) >= getRoleRank(role),
  );
}

export const GROUP_MEMBER_ROLE_OPTIONS: {
  value: GroupMemberRole;
  label: string;
}[] = [
  { value: "MEMBER", label: "Thành viên" },
  { value: "MODERATOR", label: "Kiểm duyệt viên" },
  { value: "ADMIN", label: "Quản trị viên" },
];

export function formatGroupMemberRole(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    MODERATOR: "Kiểm duyệt viên",
    MEMBER: "Thành viên",
  };

  return labels[role] ?? role;
}

export function getRoleBadgeClass(role: string): string {
  const styles: Record<string, string> = {
    ADMIN: "bg-primary/10 text-primary border border-primary/20",
    MODERATOR: "bg-secondary-container text-on-secondary-container",
    MEMBER: "bg-surface-container-high text-on-surface-variant",
  };

  return styles[role] ?? styles.MEMBER;
}
