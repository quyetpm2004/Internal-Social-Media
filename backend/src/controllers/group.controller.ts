import { Request, Response } from "express";
import * as groupService from "@/services/group.service";
import { getPostListService } from "@/services/post.service";

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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const groups = await groupService.getGroups(req.query, userId);

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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const groupId = Number(req.params.groupId);
    const group = await groupService.getGroupById(groupId, userId);

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

// controller
export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { page = 1, limit = 10, search = "", role } = req.query;

    const members = await groupService.getGroupMembers(
      groupId,
      userId,
      +page,
      +limit,
      search as string,
      role as string,
    );

    return res.status(200).json({
      message: "Lấy danh sách thành viên thành công",
      data: members,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
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
    const result = await groupService.joinGroup(groupId, userId);

    return res.status(201).json({
      message:
        result.action === "requested"
          ? "Đã gửi yêu cầu tham gia nhóm"
          : "Tham gia nhóm thành công",
      data: result,
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
    const result = await groupService.leaveGroup(groupId, userId);

    return res.status(200).json({
      message:
        result.action === "cancelled_request"
          ? "Đã hủy yêu cầu tham gia"
          : "Rời nhóm thành công",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getJoinRequests = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { page = 1, limit = 10 } = req.query;

    const data = await groupService.getJoinRequests(
      groupId,
      userId,
      +page,
      +limit,
    );

    return res.status(200).json({
      message: "Lấy danh sách yêu cầu tham gia thành công",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const approveJoinRequest = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const targetUserId = Number(req.params.userId);
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const member = await groupService.approveJoinRequest(
      groupId,
      targetUserId,
      currentUserId,
    );

    return res.status(200).json({
      message: "Đã chấp nhận yêu cầu tham gia",
      data: member,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const rejectJoinRequest = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const targetUserId = Number(req.params.userId);
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await groupService.rejectJoinRequest(groupId, targetUserId, currentUserId);

    return res.status(200).json({
      message: "Đã từ chối yêu cầu tham gia",
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getPendingGroupPosts = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { page = 1, limit = 10 } = req.query;

    const data = await groupService.getPendingGroupPosts(
      groupId,
      userId,
      +page,
      +limit,
    );

    return res.status(200).json({
      message: "Lấy danh sách bài viết chờ duyệt thành công",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const approveGroupPost = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const postId = Number(req.params.postId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await groupService.approveGroupPost(groupId, postId, userId);

    return res.status(200).json({
      message: "Đã duyệt bài viết",
      data: post,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const rejectGroupPost = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const postId = Number(req.params.postId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await groupService.rejectGroupPost(groupId, postId, userId);

    return res.status(200).json({
      message: "Đã từ chối bài viết",
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
      message:
        post.status === "PENDING_REVIEW"
          ? "Bài viết đã gửi và đang chờ phê duyệt"
          : "Đăng bài trong nhóm thành công",
      data: post,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = (req.query.sort as "latest" | "trending") || "latest";
    const groupId = Number(req.params.groupId);
    if (page < 1) {
      return res.status(400).json({
        message: "page phải lớn hơn hoặc bằng 1",
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        message: "limit phải từ 1 đến 50",
      });
    }

    if (!["latest", "trending"].includes(sort)) {
      return res.status(400).json({
        message: "sort chỉ chấp nhận latest hoặc trending",
      });
    }

    const result = await getPostListService({
      userId,
      page,
      limit,
      sort,
      groupId,
    });

    return res.status(200).json({
      message: "Lấy bài viết trong nhóm thành công",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupPostDetail = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const postId = Number(req.params.postId);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const post = await groupService.getGroupPostDetail(groupId, postId, userId);

    return res.status(200).json({
      message: "Lấy chi tiết bài viết thành công",
      data: post,
    });
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

export const getGroupSetting = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await groupService.getGroupSetting(+groupId, userId);
    return res.status(200).json({
      message: "Lấy chi tiết cài đặt nhóm thành công",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateGroupSetting = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = Number(req.params.groupId);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await groupService.updateGroupSetting(
      groupId,
      userId,
      req.body,
    );
    return res.status(200).json({
      message: "Cập nhật cài đặt nhóm thành công",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupMedia = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const groupId = Number(req.params.groupId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const search = (req.query.search as string) || "";

    if (page < 1) {
      return res.status(400).json({ message: "page phải lớn hơn hoặc bằng 1" });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({ message: "limit phải từ 1 đến 50" });
    }

    const data = await groupService.getGroupAttachments(
      groupId,
      userId,
      "media",
      page,
      limit,
      search,
    );

    return res.status(200).json({
      message: "Lấy file phương tiện nhóm thành công",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupFiles = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const groupId = Number(req.params.groupId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";

    if (page < 1) {
      return res.status(400).json({ message: "page phải lớn hơn hoặc bằng 1" });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({ message: "limit phải từ 1 đến 50" });
    }

    const data = await groupService.getGroupAttachments(
      groupId,
      userId,
      "file",
      page,
      limit,
      search,
    );

    return res.status(200).json({
      message: "Lấy danh sách file nhóm thành công",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
