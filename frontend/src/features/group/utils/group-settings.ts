import type { GroupSettings } from "../types/group.type";

export const PERMISSION_LABELS = {
  ADMIN_ONLY: "Chỉ quản trị viên",
  ANY_MEMBER: "Bất cứ ai trong nhóm",
} as const;

export const BOOL_LABELS = {
  true: "Bật",
  false: "Tắt",
} as const;

export const HIDDEN_LABELS = {
  true: "Ẩn",
  false: "Hiển thị",
} as const;

export const permissionToLabel = (value: "ADMIN_ONLY" | "ANY_MEMBER") =>
  PERMISSION_LABELS[value];

export const labelToPermission = (
  label: string,
): "ADMIN_ONLY" | "ANY_MEMBER" =>
  label === PERMISSION_LABELS.ADMIN_ONLY ? "ADMIN_ONLY" : "ANY_MEMBER";

export const boolToLabel = (value: boolean) => BOOL_LABELS[String(value) as "true" | "false"];

export const labelToBool = (label: string) => label === BOOL_LABELS.true;

export const hiddenToLabel = (value: boolean) =>
  HIDDEN_LABELS[String(value) as "true" | "false"];

export const labelToHidden = (label: string) => label === HIDDEN_LABELS.true;

export const settingsToFormValues = (data: GroupSettings) => ({
  name: data.groupName,
  description: data.description ?? "",
  hide: hiddenToLabel(data.isHidden),
  approve: permissionToLabel(data.joinApprovalPolicy),
  anonymous: boolToLabel(data.allowAnonymousJoin),
  post: permissionToLabel(data.postPermission),
  review: boolToLabel(data.postApprovalRequired),
});

export const buildSettingUpdatePayload = (
  id: string,
  value: string,
  description?: string,
): Partial<GroupSettings> => {
  switch (id) {
    case "name":
      return {
        groupName: value,
        description: description ?? "",
      };
    case "hide":
      return { isHidden: labelToHidden(value) };
    case "approve":
      return { joinApprovalPolicy: labelToPermission(value) };
    case "anonymous":
      return { allowAnonymousJoin: labelToBool(value) };
    case "post":
      return { postPermission: labelToPermission(value) };
    case "review":
      return { postApprovalRequired: labelToBool(value) };
    default:
      return {};
  }
};
