import type { GroupDetail } from "@/features/group/types/group.type";
import type { GroupMemberRole } from "@/features/group/utils/group-member";

export type GroupOutletContext = {
  isMember: boolean;
  groupDetail: GroupDetail | null;
  currentMemberRole: GroupMemberRole | null;
  canManageMembers: boolean;
  canApproveJoinRequests: boolean;
  refreshGroupDetail: () => Promise<void>;
};
