import { Request, Response } from "express";
import type {
  AddMemberInput,
  CreateGroupInput,
  CreateGroupPostInput,
  GroupFilesQuery,
  GroupMediaQuery,
  GroupListQuery,
  GroupMembersQuery,
  GroupPostListQuery,
  UpdateGroupInput,
  UpdateGroupSettingInput,
  UpdateMemberRoleInput,
} from "@/modules/group/group.schema";
import * as groupService from "@/modules/group/group.service";
import { getPostListService } from "@/modules/post/post.service";

export async function createGroup(req: Request, res: Response) {
  const data = req.validated as CreateGroupInput;

  const group = await groupService.createGroup(req.user!.id, data);

  res.status(201).json({
    message: "Tạo nhóm thành công",
    data: group,
  });
}

export async function getGroups(req: Request, res: Response) {
  const query = req.validated as GroupListQuery;

  const groups = await groupService.getGroups(query, req.user!.id);

  res.status(200).json({
    message: "Lấy danh sách nhóm thành công",
    data: groups,
  });
}

export async function getGroupById(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);

  const group = await groupService.getGroupById(groupId, req.user!.id);

  res.status(200).json({
    message: "Lấy thông tin nhóm thành công",
    data: group,
  });
}

export async function updateGroup(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const data = req.validated as UpdateGroupInput;

  const group = await groupService.updateGroup(groupId, req.user!.id, data);

  res.status(200).json({
    message: "Cập nhật nhóm thành công",
    data: group,
  });
}

export async function deleteGroup(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);

  await groupService.deleteGroup(groupId, req.user!.id);

  res.status(200).json({
    message: "Xóa nhóm thành công",
  });
}

export async function addMemberToGroup(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const data = req.validated as AddMemberInput;

  const member = await groupService.addMemberToGroup(
    groupId,
    req.user!.id,
    data,
  );

  res.status(201).json({
    message: "Thêm thành viên thành công",
    data: member,
  });
}

export async function getGroupMembers(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const { page, limit, search, role } = req.validated as GroupMembersQuery;

  const members = await groupService.getGroupMembers(
    groupId,
    req.user!.id,
    page,
    limit,
    search,
    role,
  );

  res.status(200).json({
    message: "Lấy danh sách thành viên thành công",
    data: members,
  });
}

export async function removeMemberFromGroup(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);

  await groupService.removeMemberFromGroup(groupId, userId, req.user!.id);

  res.status(200).json({
    message: "Xóa thành viên khỏi nhóm thành công",
  });
}

export async function updateMemberRole(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const userId = Number(req.params.userId);
  const { memberRole } = req.validated as UpdateMemberRoleInput;

  const member = await groupService.updateMemberRole(
    groupId,
    userId,
    req.user!.id,
    memberRole,
  );

  res.status(200).json({
    message: "Cập nhật quyền thành viên thành công",
    data: member,
  });
}

export async function joinGroup(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);

  const result = await groupService.joinGroup(groupId, req.user!.id);

  res.status(201).json({
    message:
      result.action === "requested"
        ? "Đã gửi yêu cầu tham gia nhóm"
        : "Tham gia nhóm thành công",
    data: result,
  });
}

export async function leaveGroup(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);

  const result = await groupService.leaveGroup(groupId, req.user!.id);

  res.status(200).json({
    message:
      result.action === "cancelled_request"
        ? "Đã hủy yêu cầu tham gia"
        : "Rời nhóm thành công",
    data: result,
  });
}

export async function getJoinRequests(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const { page, limit } = req.validated as { page: number; limit: number };

  const data = await groupService.getJoinRequests(
    groupId,
    req.user!.id,
    page,
    limit,
  );

  res.status(200).json({
    message: "Lấy danh sách yêu cầu tham gia thành công",
    data,
  });
}

export async function approveJoinRequest(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const targetUserId = Number(req.params.userId);

  const member = await groupService.approveJoinRequest(
    groupId,
    targetUserId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Đã chấp nhận yêu cầu tham gia",
    data: member,
  });
}

export async function rejectJoinRequest(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const targetUserId = Number(req.params.userId);

  await groupService.rejectJoinRequest(groupId, targetUserId, req.user!.id);

  res.status(200).json({
    message: "Đã từ chối yêu cầu tham gia",
  });
}

export async function getPendingGroupPosts(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const { page, limit } = req.validated as { page: number; limit: number };

  const data = await groupService.getPendingGroupPosts(
    groupId,
    req.user!.id,
    page,
    limit,
  );

  res.status(200).json({
    message: "Lấy danh sách bài viết chờ duyệt thành công",
    data,
  });
}

export async function approveGroupPost(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const postId = Number(req.params.postId);

  const post = await groupService.approveGroupPost(
    groupId,
    postId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Đã duyệt bài viết",
    data: post,
  });
}

export async function rejectGroupPost(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const postId = Number(req.params.postId);

  await groupService.rejectGroupPost(groupId, postId, req.user!.id);

  res.status(200).json({
    message: "Đã từ chối bài viết",
  });
}

export async function createGroupPost(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const data = req.validated as CreateGroupPostInput;

  const post = await groupService.createGroupPost(groupId, req.user!.id, data);

  res.status(201).json({
    message:
      post.status === "PENDING_REVIEW"
        ? "Bài viết đã gửi và đang chờ phê duyệt"
        : "Đăng bài trong nhóm thành công",
    data: post,
  });
}

export async function getGroupPosts(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const { page, limit, sort } = req.validated as GroupPostListQuery;

  const result = await getPostListService({
    userId: req.user!.id,
    page,
    limit,
    sort,
    groupId,
  });

  res.status(200).json({
    message: "Lấy bài viết trong nhóm thành công",
    data: result,
  });
}

export async function getGroupPostDetail(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const postId = Number(req.params.postId);

  const post = await groupService.getGroupPostDetail(
    groupId,
    postId,
    req.user!.id,
  );

  res.status(200).json({
    message: "Lấy chi tiết bài viết thành công",
    data: post,
  });
}

export async function getGroupSetting(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);

  const result = await groupService.getGroupSetting(groupId, req.user!.id);

  res.status(200).json({
    message: "Lấy chi tiết cài đặt nhóm thành công",
    data: result,
  });
}

export async function updateGroupSetting(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const data = req.validated as UpdateGroupSettingInput;

  const result = await groupService.updateGroupSetting(
    groupId,
    req.user!.id,
    data,
  );

  res.status(200).json({
    message: "Cập nhật cài đặt nhóm thành công",
    data: result,
  });
}

export async function getGroupMedia(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const { page, limit, search } = req.validated as GroupMediaQuery;

  const data = await groupService.getGroupAttachments(
    groupId,
    req.user!.id,
    "media",
    page,
    limit,
    search,
  );

  res.status(200).json({
    message: "Lấy file phương tiện nhóm thành công",
    data,
  });
}

export async function getGroupFiles(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const { page, limit, search } = req.validated as GroupFilesQuery;

  const data = await groupService.getGroupAttachments(
    groupId,
    req.user!.id,
    "file",
    page,
    limit,
    search,
  );

  res.status(200).json({
    message: "Lấy danh sách file nhóm thành công",
    data,
  });
}
