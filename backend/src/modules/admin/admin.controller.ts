import { Request, Response } from "express";
import * as adminService from "@/modules/admin/admin.service";
import type {
  AdminCommentListQuery,
  AdminGroupListQuery,
  AdminGroupMembersQuery,
  AdminPostListQuery,
  AdminUserListQuery,
  ReviewPostInput,
  UpdateCommentStatusInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from "@/modules/admin/admin.schema";

export async function getDashboard(req: Request, res: Response) {
  const stats = await adminService.getDashboardStats();
  res.status(200).json({ message: "Lấy thống kê thành công", data: stats });
}

export async function listUsers(req: Request, res: Response) {
  const query = req.validated as AdminUserListQuery;
  const result = await adminService.listUsers(query);
  res.status(200).json({ message: "Lấy danh sách người dùng thành công", data: result });
}

export async function updateUserStatus(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const data = req.validated as UpdateUserStatusInput;
  const result = await adminService.updateUserStatus(req.user!.id, userId, data);
  res.status(200).json({ message: "Cập nhật trạng thái người dùng thành công", data: result });
}

export async function updateUserRole(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const data = req.validated as UpdateUserRoleInput;
  const result = await adminService.updateUserRole(req.user!.id, userId, data);
  res.status(200).json({ message: "Cập nhật vai trò người dùng thành công", data: result });
}

export async function listPosts(req: Request, res: Response) {
  const query = req.validated as AdminPostListQuery;
  const result = await adminService.listPosts(query);
  res.status(200).json({ message: "Lấy danh sách bài viết thành công", data: result });
}

export async function getPostDetail(req: Request, res: Response) {
  const { postId } = req.validated as { postId: number };
  const post = await adminService.getPostDetail(postId);
  res.status(200).json({ message: "Lấy chi tiết bài viết thành công", data: post });
}

export async function deletePost(req: Request, res: Response) {
  const { postId } = req.validated as { postId: number };
  await adminService.deletePost(postId);
  res.status(200).json({ message: "Xóa bài viết thành công", data: true });
}

export async function reviewPost(req: Request, res: Response) {
  const postId = Number(req.params.postId);
  const data = req.validated as ReviewPostInput;
  const result = await adminService.reviewPost(req.user!.id, postId, data);
  res.status(200).json({
    message:
      data.action === "approve"
        ? "Duyệt bài viết thành công"
        : "Từ chối bài viết thành công",
    data: result,
  });
}

export async function listComments(req: Request, res: Response) {
  const query = req.validated as AdminCommentListQuery;
  const result = await adminService.listComments(query);
  res.status(200).json({ message: "Lấy danh sách bình luận thành công", data: result });
}

export async function updateCommentStatus(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);
  const data = req.validated as UpdateCommentStatusInput;
  const result = await adminService.updateCommentStatus(commentId, data);
  res.status(200).json({ message: "Cập nhật bình luận thành công", data: result });
}

export async function listGroups(req: Request, res: Response) {
  const query = req.validated as AdminGroupListQuery;
  const result = await adminService.listGroups(query);
  res.status(200).json({ message: "Lấy danh sách nhóm thành công", data: result });
}

export async function getGroupDetail(req: Request, res: Response) {
  const { groupId } = req.validated as { groupId: number };
  const group = await adminService.getGroupDetail(groupId);
  res.status(200).json({ message: "Lấy chi tiết nhóm thành công", data: group });
}

export async function listGroupMembers(req: Request, res: Response) {
  const groupId = Number(req.params.groupId);
  const query = req.validated as AdminGroupMembersQuery;
  const result = await adminService.listGroupMembers(groupId, query);
  res.status(200).json({
    message: "Lấy danh sách thành viên nhóm thành công",
    data: result,
  });
}

export async function deleteGroup(req: Request, res: Response) {
  const { groupId } = req.validated as { groupId: number };
  await adminService.deleteGroup(groupId);
  res.status(200).json({ message: "Xóa nhóm thành công", data: true });
}
