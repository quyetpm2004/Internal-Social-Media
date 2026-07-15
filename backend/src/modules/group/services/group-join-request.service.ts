import { GroupMemberStatus, GroupType } from "@prisma/client";
import { AppError } from "@/shared/errors/app-error";
import { getFileUrl } from "@/modules/file/file.service";
import {
  notifyGroupMemberAdded,
  notifyGroupMemberRejected,
} from "@/modules/notification/notification.service";
import * as groupRepo from "@/modules/group/group.repository";
import {
  checkCanApproveJoinRequest,
  checkGroupExists,
  findGroupMember,
} from "@/modules/group/services/group-access.service";

export const getJoinRequests = async (
  groupId: number,
  currentUserId: number,
  page: number = 1,
  limit: number = 10,
) => {
  const group = await checkGroupExists(groupId);

  if (group.groupType !== GroupType.PRIVATE) {
    throw new AppError(400, "Chỉ nhóm riêng tư mới có yêu cầu tham gia");
  }

  await checkCanApproveJoinRequest(groupId, currentUserId);

  const where = {
    groupId,
    status: GroupMemberStatus.PENDING,
  };

  const [requests, total] = await Promise.all([
    groupRepo.listJoinRequests(where, (page - 1) * limit, limit),
    groupRepo.countMembers(where),
  ]);

  return {
    requests: await Promise.all(
      requests.map(async (request) => ({
        id: request.user.id,
        fullName: request.user.fullName,
        email: request.user.email,
        requestedAt: request.joinedAt,
        avatarUrl: request.user.profile?.avatarKey
          ? await getFileUrl(request.user.profile.avatarKey, 24 * 60 * 60)
          : null,
      })),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const approveJoinRequest = async (
  groupId: number,
  targetUserId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanApproveJoinRequest(groupId, currentUserId);

  if (group.groupType !== GroupType.PRIVATE) {
    throw new AppError(400, "Chỉ nhóm riêng tư mới có yêu cầu tham gia");
  }

  const member = await findGroupMember(groupId, targetUserId);

  if (!member || member.status !== GroupMemberStatus.PENDING) {
    throw new AppError(404, "Không tìm thấy yêu cầu tham gia");
  }

  const updated = await groupRepo.approveMember(groupId, targetUserId);

  await notifyGroupMemberAdded(groupId, currentUserId, targetUserId);
  return updated;
};

export const rejectJoinRequest = async (
  groupId: number,
  targetUserId: number,
  currentUserId: number,
) => {
  const group = await checkGroupExists(groupId);
  await checkCanApproveJoinRequest(groupId, currentUserId);

  if (group.groupType !== GroupType.PRIVATE) {
    throw new AppError(400, "Chỉ nhóm riêng tư mới có yêu cầu tham gia");
  }

  const member = await findGroupMember(groupId, targetUserId);

  if (!member || member.status !== GroupMemberStatus.PENDING) {
    throw new AppError(404, "Không tìm thấy yêu cầu tham gia");
  }

  await groupRepo.deleteMember(groupId, targetUserId);

  await notifyGroupMemberRejected(groupId, currentUserId, targetUserId);
  return true;
};
