import { Request, Response, NextFunction } from "express";
import {
  createPostService,
  deletePostService,
  getPostListService,
  reactPostService,
} from "../services/post.service";

export const getPostListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;

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
      message: "Lấy danh sách bài viết thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { content, visibility = "PUBLIC", groupId } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Nội dung bài viết không được để trống",
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        message: "Nội dung bài viết không được vượt quá 5000 ký tự",
      });
    }

    if (!["PUBLIC", "PRIVATE", "GROUP"].includes(visibility)) {
      return res.status(400).json({
        message: "visibility không hợp lệ",
      });
    }

    const newPost = await createPostService({
      userId,
      content: content.trim(),
      visibility,
      groupId: groupId ? Number(groupId) : 6, // tạm thời gán groupId mặc định để test
      files: files || [],
    });

    return res.status(201).json({
      message: "Đăng bài viết thành công",
      data: newPost,
    });
  } catch (error) {
    next(error);
  }
};

export const reactPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);
    const { reactionType } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập hoặc token không hợp lệ",
      });
    }

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "postId không hợp lệ",
      });
    }

    const allowedReactionTypes = [
      "LIKE",
      "LOVE",
      "HAHA",
      "WOW",
      "SAD",
      "ANGRY",
    ];

    if (!reactionType || !allowedReactionTypes.includes(reactionType)) {
      return res.status(400).json({
        message: "reactionType không hợp lệ",
      });
    }

    const result = await reactPostService({
      userId,
      postId,
      reactionType,
    });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const postId = Number(req.params.postId);

    if (!userId) {
      return res.status(401).json({
        message: "Người dùng chưa đăng nhập",
      });
    }

    const result = await deletePostService(userId, postId);

    if (result)
      return res.status(200).json({
        message: "Xóa bài viết thành công",
      });
  } catch (error) {
    next(error);
  }
};
