import { Request, Response } from "express";
import * as groupService from "../services/group.service";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const group = await groupService.createGroup(userId, req.body);

    return res.status(201).json({
      message: "Tạo nhóm thành công",
      data: group,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const groups = await groupService.getGroups(req.query);

    return res.status(200).json({
      message: "Lấy danh sách nhóm thành công",
      data: groups,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const group = await groupService.getGroupById(groupId);

    return res.status(200).json({
      message: "Lấy thông tin nhóm thành công",
      data: group,
    });
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const group = await groupService.updateGroup(groupId, userId, req.body);

    return res.status(200).json({
      message: "Cập nhật nhóm thành công",
      data: group,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await groupService.deleteGroup(groupId, userId);

    return res.status(200).json({
      message: "Xóa nhóm thành công",
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const addMemberToGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const member = await groupService.addMemberToGroup(
      groupId,
      userId,
      req.body,
    );

    return res.status(201).json({
      message: "Thêm thành viên thành công",
      data: member,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const members = await groupService.getGroupMembers(groupId);

    return res.status(200).json({
      message: "Lấy danh sách thành viên thành công",
      data: members,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const removeMemberFromGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await groupService.removeMemberFromGroup(groupId, userId, currentUserId);

    return res.status(200).json({
      message: "Xóa thành viên khỏi nhóm thành công",
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const member = await groupService.updateMemberRole(
      groupId,
      userId,
      currentUserId,
      req.body.memberRole,
    );

    return res.status(200).json({
      message: "Cập nhật quyền thành viên thành công",
      data: member,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const joinGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const member = await groupService.joinGroup(groupId, userId);

    return res.status(201).json({
      message: "Tham gia nhóm thành công",
      data: member,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await groupService.leaveGroup(groupId, userId);

    return res.status(200).json({
      message: "Rời nhóm thành công",
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const createGroupPost = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await groupService.createGroupPost(groupId, userId, req.body);

    return res.status(201).json({
      message: "Đăng bài trong nhóm thành công",
      data: post,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupPosts = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const posts = await groupService.getGroupPosts(groupId);

    return res.status(200).json({
      message: "Lấy bài viết trong nhóm thành công",
      data: posts,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
