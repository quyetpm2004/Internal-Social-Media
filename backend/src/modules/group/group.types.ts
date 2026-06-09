import { GroupPermission } from "@prisma/client";

export type GroupSettingPayload = {
  groupName: string;
  description: string | null;
  isHidden: boolean;
  joinApprovalPolicy: GroupPermission;
  allowAnonymousJoin: boolean;
  postPermission: GroupPermission;
  postApprovalRequired: boolean;
};

export type UpdateGroupSettingInput = Partial<{
  groupName: string;
  description: string | null;
  isHidden: boolean;
  joinApprovalPolicy: GroupPermission;
  allowAnonymousJoin: boolean;
  postPermission: GroupPermission;
  postApprovalRequired: boolean;
}>;

export type GroupAttachmentCategory = "media" | "file";
