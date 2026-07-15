import { GroupPermission } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import type { UpdateGroupSettingInput } from "@/modules/group/group.types";
import * as groupRepo from "@/modules/group/group.repository";
import {
  checkIsGroupAdmin,
  mapGroupToSettings,
} from "@/modules/group/services/group-access.service";

export const getGroupSetting = async (groupId: number, userId: number) => {
  await checkIsGroupAdmin(groupId, userId);

  const group = await groupRepo.loadGroupSettings(groupId);

  if (!group) {
    throw new AppError(404, "Không tìm thấy nhóm");
  }

  return mapGroupToSettings(group);
};

export const updateGroupSetting = async (
  groupId: number,
  userId: number,
  data: UpdateGroupSettingInput,
) => {
  await checkIsGroupAdmin(groupId, userId);

  const {
    groupName,
    description,
    isHidden,
    joinApprovalPolicy,
    allowAnonymousJoin,
    postPermission,
    postApprovalRequired,
  } = data;

  if (groupName !== undefined && !groupName.trim()) {
    throw new AppError(400, "Tên nhóm không được để trống");
  }

  if (
    joinApprovalPolicy !== undefined &&
    !Object.values(GroupPermission).includes(joinApprovalPolicy)
  ) {
    throw new AppError(400, "Chính sách phê duyệt không hợp lệ");
  }

  if (
    postPermission !== undefined &&
    !Object.values(GroupPermission).includes(postPermission)
  ) {
    throw new AppError(400, "Quyền đăng bài không hợp lệ");
  }

  const group = await groupRepo.saveGroupSettings(groupId, {
    ...(groupName !== undefined && { groupName: groupName.trim() }),
    ...(description !== undefined && { description }),
    ...(isHidden !== undefined && { isHidden }),
    ...(joinApprovalPolicy !== undefined && { joinApprovalPolicy }),
    ...(allowAnonymousJoin !== undefined && { allowAnonymousJoin }),
    ...(postPermission !== undefined && { postPermission }),
    ...(postApprovalRequired !== undefined && { postApprovalRequired }),
  });

  return mapGroupToSettings(group);
};
